import { sha256Bytes } from "@/lib/web-hash";
import { packZip, unpackZip, PackageError } from "@/lib/browser-zip";
import { prettyStringify } from "@/lib/canonical";
import { BUNDLED_TEMPLATE } from "@/lib/template/vic-residential";
import {
  FORMAT_VERSION,
  PROJECT_FORMAT,
  type AttachmentMeta,
  type ItemStatus,
  type ProjectDocument,
  type ProjectSummary,
  type Site,
  type TemplateDocument,
  progressForProject,
} from "@/lib/types";
import { validateProjectDocument, validateTemplateDocument } from "@/lib/validate";

const DB_NAME = "vic-arch-checklist";
const DB_VERSION = 1;
const MAX_ATTACHMENT_BYTES = 12 * 1024 * 1024;

type AttachmentRecord = {
  key: string;
  projectId: string;
  attachmentId: string;
  filename: string;
  mimeType: string;
  bytes: ArrayBuffer;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("projects")) {
        db.createObjectStore("projects", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("templates")) {
        db.createObjectStore("templates", { keyPath: "projectId" });
      }
      if (!db.objectStoreNames.contains("attachments")) {
        db.createObjectStore("attachments", { keyPath: "key" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function listProjects(): Promise<ProjectSummary[]> {
  const db = await openDb();
  const tx = db.transaction(["projects", "templates"], "readonly");
  const projects = (await requestToPromise(
    tx.objectStore("projects").getAll(),
  )) as ProjectDocument[];
  const templates = (await requestToPromise(
    tx.objectStore("templates").getAll(),
  )) as Array<{ projectId: string; template: TemplateDocument }>;
  await txDone(tx);
  const templateById = new Map(
    templates.map((entry) => [entry.projectId, entry.template]),
  );
  return projects
    .map((project) => {
      const template = templateById.get(project.id);
      if (!template) {
        return null;
      }
      const { done, total } = progressForProject(template, project);
      return {
        id: project.id,
        name: project.site.name,
        typology: project.site.typology,
        address: project.site.address,
        revision: project.revision,
        updatedAt: project.updatedAt,
        templateId: project.template.id,
        templateVersion: project.template.version,
        done,
        total,
      } satisfies ProjectSummary;
    })
    .filter((entry): entry is ProjectSummary => entry !== null)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function loadProject(projectId: string): Promise<{
  project: ProjectDocument;
  template: TemplateDocument;
}> {
  const db = await openDb();
  const tx = db.transaction(["projects", "templates"], "readonly");
  const project = (await requestToPromise(
    tx.objectStore("projects").get(projectId),
  )) as ProjectDocument | undefined;
  const templateRow = (await requestToPromise(
    tx.objectStore("templates").get(projectId),
  )) as { template: TemplateDocument } | undefined;
  await txDone(tx);
  if (!project || !templateRow) {
    throw new Error("Project was not found on this phone");
  }
  return {
    project: validateProjectDocument(project),
    template: validateTemplateDocument(templateRow.template),
  };
}

async function writeProject(
  project: ProjectDocument,
  template: TemplateDocument,
): Promise<void> {
  validateProjectDocument(project);
  validateTemplateDocument(template);
  const db = await openDb();
  const tx = db.transaction(["projects", "templates"], "readwrite");
  tx.objectStore("projects").put(JSON.parse(prettyStringify(project)));
  tx.objectStore("templates").put({
    projectId: project.id,
    template: JSON.parse(prettyStringify(template)),
  });
  await txDone(tx);
}

export async function createProject(site: Site): Promise<{
  project: ProjectDocument;
  template: TemplateDocument;
}> {
  const now = new Date().toISOString();
  const template = structuredClone(BUNDLED_TEMPLATE);
  const project: ProjectDocument = {
    format: PROJECT_FORMAT,
    formatVersion: FORMAT_VERSION,
    id: crypto.randomUUID(),
    revision: 1,
    createdAt: now,
    updatedAt: now,
    template: {
      id: template.id,
      version: template.version,
      checksum: template.checksum,
    },
    site,
    answers: {},
    attachments: [],
  };
  await writeProject(project, template);
  return { project, template };
}

async function mutateProject(
  projectId: string,
  mutate: (project: ProjectDocument) => void | Promise<void>,
): Promise<ProjectDocument> {
  const { project, template } = await loadProject(projectId);
  await mutate(project);
  project.revision += 1;
  project.updatedAt = new Date().toISOString();
  await writeProject(project, template);
  return project;
}

export async function setAnswer(
  projectId: string,
  itemId: string,
  patch: {
    status?: ItemStatus;
    notes?: string;
    fields?: Record<string, string | number | boolean | null>;
  },
): Promise<ProjectDocument> {
  const { template } = await loadProject(projectId);
  if (!template.items.some((item) => item.id === itemId)) {
    throw new PackageError(`Checklist item ${itemId} is not in this project's template`);
  }
  return mutateProject(projectId, (project) => {
    const existing = project.answers[itemId];
    project.answers[itemId] = {
      ...existing,
      status: patch.status ?? existing?.status ?? "todo",
      notes: patch.notes ?? existing?.notes ?? "",
      updatedAt: new Date().toISOString(),
      fields: patch.fields ?? existing?.fields ?? {},
    };
  });
}

export async function addAttachment(input: {
  projectId: string;
  itemId: string | null;
  filename: string;
  mimeType: string;
  bytes: Uint8Array;
}): Promise<ProjectDocument> {
  if (input.bytes.byteLength > MAX_ATTACHMENT_BYTES) {
    throw new PackageError("Attachment is larger than 12 MB");
  }
  const filename = input.filename.replace(/[\\/]/g, "_").slice(0, 180) || "attachment";
  const id = crypto.randomUUID();
  const sha256 = await sha256Bytes(input.bytes);
  const attachment: AttachmentMeta = {
    id,
    itemId: input.itemId,
    filename,
    mimeType: input.mimeType || "application/octet-stream",
    size: input.bytes.byteLength,
    sha256,
    addedAt: new Date().toISOString(),
  };
  const copy = new Uint8Array(input.bytes.byteLength);
  copy.set(input.bytes);
  const db = await openDb();
  const tx = db.transaction("attachments", "readwrite");
  tx.objectStore("attachments").put({
    key: `${input.projectId}:${id}`,
    projectId: input.projectId,
    attachmentId: id,
    filename,
    mimeType: attachment.mimeType,
    bytes: copy.buffer,
  } satisfies AttachmentRecord);
  await txDone(tx);
  return mutateProject(input.projectId, (project) => {
    project.attachments.push(attachment);
  });
}

export async function readAttachment(
  projectId: string,
  attachmentId: string,
): Promise<AttachmentRecord> {
  const db = await openDb();
  const tx = db.transaction("attachments", "readonly");
  const row = (await requestToPromise(
    tx.objectStore("attachments").get(`${projectId}:${attachmentId}`),
  )) as AttachmentRecord | undefined;
  await txDone(tx);
  if (!row) {
    throw new Error("Attachment was not found");
  }
  return row;
}

export async function deleteProject(projectId: string): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(["projects", "templates", "attachments"], "readwrite");
  tx.objectStore("projects").delete(projectId);
  tx.objectStore("templates").delete(projectId);
  const attachments = (await requestToPromise(
    tx.objectStore("attachments").getAll(),
  )) as AttachmentRecord[];
  for (const row of attachments) {
    if (row.projectId === projectId) {
      tx.objectStore("attachments").delete(row.key);
    }
  }
  await txDone(tx);
}

export async function exportProjectZip(projectId: string): Promise<{
  filename: string;
  bytes: Uint8Array;
}> {
  const { project, template } = await loadProject(projectId);
  const attachments = [];
  for (const meta of project.attachments) {
    const row = await readAttachment(projectId, meta.id);
    attachments.push({
      id: meta.id,
      filename: meta.filename,
      bytes: new Uint8Array(row.bytes),
    });
  }
  const bytes = await packZip({ project, template, attachments });
  const slug =
    project.site.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "project";
  return { filename: `${slug}-rev${project.revision}.zip`, bytes };
}

export async function importProjectZip(bytes: Uint8Array): Promise<{
  project: ProjectDocument;
}> {
  const unpacked = await unpackZip(bytes);
  await deleteProject(unpacked.project.id);
  await writeProject(unpacked.project, unpacked.template);
  const db = await openDb();
  const tx = db.transaction("attachments", "readwrite");
  for (const file of unpacked.attachments) {
    const copy = new Uint8Array(file.bytes.byteLength);
    copy.set(file.bytes);
    tx.objectStore("attachments").put({
      key: `${unpacked.project.id}:${file.id}`,
      projectId: unpacked.project.id,
      attachmentId: file.id,
      filename: file.filename,
      mimeType:
        unpacked.project.attachments.find((item) => item.id === file.id)
          ?.mimeType ?? "application/octet-stream",
      bytes: copy.buffer,
    } satisfies AttachmentRecord);
  }
  await txDone(tx);
  return { project: unpacked.project };
}

export function downloadBytes(filename: string, bytes: Uint8Array, type: string): void {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const blob = new Blob([copy], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function openHtml(html: string): void {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
}
