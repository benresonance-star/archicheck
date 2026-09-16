import { sha256Bytes, sha256Json } from "@/lib/web-hash";
import { packZip, unpackZip, PackageError } from "@/lib/browser-zip";
import { prettyStringify } from "@/lib/canonical";
import { templateChecksumPayload } from "@/lib/hash-payload";
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
import { applyProposedToTemplate } from "@/lib/scout/apply-wording";
import {
  mergeScoutSettings,
  STATEWIDE_BOARD_ID,
  type ScoutSettings,
} from "@/lib/scout/settings";
import type { ScoutFinding, ScoutProposed, ScoutReport } from "@/lib/scout/types";
import type { PreviousSnapshot } from "@/lib/scout/watch-list";

const DB_NAME = "vic-arch-checklist";
const DB_VERSION = 3;
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
      if (!db.objectStoreNames.contains("scoutReports")) {
        db.createObjectStore("scoutReports", { keyPath: "projectId" });
      }
      if (!db.objectStoreNames.contains("scoutSnapshots")) {
        db.createObjectStore("scoutSnapshots", { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains("scoutSettings")) {
        db.createObjectStore("scoutSettings", { keyPath: "id" });
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
  const tx = db.transaction(
    ["projects", "templates", "attachments", "scoutReports", "scoutSnapshots"],
    "readwrite",
  );
  tx.objectStore("projects").delete(projectId);
  tx.objectStore("templates").delete(projectId);
  tx.objectStore("scoutReports").delete(projectId);
  const attachments = (await requestToPromise(
    tx.objectStore("attachments").getAll(),
  )) as AttachmentRecord[];
  for (const row of attachments) {
    if (row.projectId === projectId) {
      tx.objectStore("attachments").delete(row.key);
    }
  }
  const snapshots = (await requestToPromise(
    tx.objectStore("scoutSnapshots").getAll(),
  )) as Array<{ key: string; projectId: string }>;
  for (const row of snapshots) {
    if (row.projectId === projectId) {
      tx.objectStore("scoutSnapshots").delete(row.key);
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

export async function loadScoutReport(
  projectId: string,
): Promise<ScoutReport | null> {
  const db = await openDb();
  const tx = db.transaction("scoutReports", "readonly");
  const report = (await requestToPromise(
    tx.objectStore("scoutReports").get(projectId),
  )) as ScoutReport | undefined;
  await txDone(tx);
  return report ? { ...report, kind: report.kind ?? "project" } : null;
}

export async function loadScoutSnapshots(
  projectId: string,
): Promise<PreviousSnapshot[]> {
  const db = await openDb();
  const tx = db.transaction("scoutSnapshots", "readonly");
  const rows = (await requestToPromise(
    tx.objectStore("scoutSnapshots").getAll(),
  )) as Array<{ key: string; projectId: string; sourceId: string; sha256: string }>;
  await txDone(tx);
  return rows
    .filter((row) => row.projectId === projectId && row.sha256)
    .map((row) => ({ sourceId: row.sourceId, sha256: row.sha256 }));
}

export async function saveScoutReport(report: ScoutReport): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(["scoutReports", "scoutSnapshots"], "readwrite");
  tx.objectStore("scoutReports").put(report);
  for (const snapshot of report.snapshots) {
    if (!snapshot.ok || !snapshot.sha256) {
      continue;
    }
    tx.objectStore("scoutSnapshots").put({
      key: `${report.projectId}:${snapshot.sourceId}`,
      projectId: report.projectId,
      sourceId: snapshot.sourceId,
      sha256: snapshot.sha256,
    });
  }
  await txDone(tx);
}

export async function patchScoutFinding(
  projectId: string,
  findingId: string,
  patch: { status: ScoutFinding["status"]; proposed?: ScoutProposed | null },
): Promise<ScoutReport> {
  const report = await loadScoutReport(projectId);
  if (!report) {
    throw new Error("No scout report on this project");
  }
  report.findings = report.findings.map((finding) =>
    finding.id === findingId
      ? {
          ...finding,
          status: patch.status,
          proposed:
            patch.proposed === undefined ? finding.proposed : patch.proposed,
        }
      : finding,
  );
  await saveScoutReport(report);
  return report;
}

function bumpDraftVersion(version: string): string {
  const match = version.match(/^(.*)-draft\.(\d+)$/);
  if (match) {
    return `${match[1]}-draft.${Number(match[2]) + 1}`;
  }
  return `${version}-draft.1`;
}

export async function updateMunicipality(
  projectId: string,
  municipality: string,
): Promise<ProjectDocument> {
  return mutateProject(projectId, (project) => {
    project.site.municipality = municipality.trim();
  });
}

export async function applyProposedWording(input: {
  projectId: string;
  finding: ScoutFinding;
  proposed: ScoutProposed;
}): Promise<{ template: TemplateDocument; report: ScoutReport }> {
  const { project, template } = await loadProject(input.projectId);
  const next = applyProposedToTemplate(template, input.finding, input.proposed);
  next.version = bumpDraftVersion(next.version);
  next.checksum = await sha256Json(
    templateChecksumPayload(next as unknown as Record<string, unknown>),
  );
  project.template = {
    id: next.id,
    version: next.version,
    checksum: next.checksum,
  };
  project.revision += 1;
  project.updatedAt = new Date().toISOString();
  await writeProject(project, next);
  const report = await patchScoutFinding(input.projectId, input.finding.id, {
    status: "accepted_draft",
    proposed: input.proposed,
  });
  return { template: next, report };
}

export async function loadScoutSettings(): Promise<ScoutSettings> {
  try {
    const db = await openDb();
    const tx = db.transaction("scoutSettings", "readonly");
    const saved = (await requestToPromise(
      tx.objectStore("scoutSettings").get("default"),
    )) as ScoutSettings | undefined;
    await txDone(tx);
    return mergeScoutSettings(saved ?? null);
  } catch {
    return mergeScoutSettings(null);
  }
}

export async function saveScoutSettings(
  settings: ScoutSettings,
): Promise<ScoutSettings> {
  const next = mergeScoutSettings(settings);
  const db = await openDb();
  const tx = db.transaction("scoutSettings", "readwrite");
  tx.objectStore("scoutSettings").put(next);
  await txDone(tx);
  return next;
}

export async function runStatewideScout(): Promise<ScoutReport> {
  const settings = await loadScoutSettings();
  const previous = await loadScoutSnapshots(STATEWIDE_BOARD_ID);
  const response = await fetch("/api/scout/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      projectId: STATEWIDE_BOARD_ID,
      kind: "statewide",
      previous,
      sources: enabledOrAll(settings),
    }),
  });
  return persistScoutResponse(response);
}

function enabledOrAll(settings: ScoutSettings) {
  const enabled = settings.sources.filter((source) => source.enabled);
  if (enabled.length === 0) {
    throw new Error("Enable at least one scout site under Scout process");
  }
  return enabled;
}

async function persistScoutResponse(response: Response): Promise<ScoutReport> {
  const data = (await response.json()) as {
    error?: string;
    report?: ScoutReport;
  };
  if (!response.ok || !data.report) {
    throw new Error(data.error ?? "Scout run failed");
  }
  await saveScoutReport(data.report);
  return data.report;
}

export async function runProjectScout(projectId: string): Promise<ScoutReport> {
  const { project } = await loadProject(projectId);
  const settings = await loadScoutSettings();
  const previous = await loadScoutSnapshots(projectId);
  const response = await fetch("/api/scout/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      projectId,
      kind: "project",
      municipality: project.site.municipality,
      typology: project.site.typology,
      previous,
      sources: enabledOrAll(settings),
    }),
  });
  return persistScoutResponse(response);
}
