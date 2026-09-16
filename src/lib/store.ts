import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { prettyStringify } from "@/lib/canonical";
import { sha256Bytes } from "@/lib/hash";
import {
  FORMAT_VERSION,
  PROJECT_FORMAT,
  type AttachmentMeta,
  type ItemStatus,
  type ProjectDocument,
  type ProjectSummary,
  type Site,
  type TemplateDocument,
  itemsForTypology,
  progressForProject,
} from "@/lib/types";
import { BUNDLED_TEMPLATE } from "@/lib/template/vic-residential";
import {
  attachmentFilePath,
  attachmentsDir,
  projectDir,
  projectJsonPath,
  projectsRoot,
  safeFilename,
  templateJsonPath,
} from "@/lib/paths";
import {
  SchemaValidationError,
  validateProjectDocument,
  validateTemplateDocument,
} from "@/lib/validate";
import {
  MAX_ATTACHMENT_BYTES,
  PackageError,
  packZip,
  unpackZip,
  type PackedAttachment,
} from "@/lib/zip-package";

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

async function ensureProjectsRoot(): Promise<void> {
  await mkdir(projectsRoot(), { recursive: true });
}

async function readJsonFile(filePath: string): Promise<unknown> {
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw);
}

export async function loadProject(projectId: string): Promise<{
  project: ProjectDocument;
  template: TemplateDocument;
}> {
  try {
    const project = validateProjectDocument(
      await readJsonFile(projectJsonPath(projectId)),
    );
    const template = validateTemplateDocument(
      await readJsonFile(templateJsonPath(projectId)),
    );
    return { project, template };
  } catch (error) {
    if (error instanceof SchemaValidationError) {
      throw error;
    }
    throw new NotFoundError(`Project ${projectId} was not found`);
  }
}

export async function listProjects(): Promise<ProjectSummary[]> {
  await ensureProjectsRoot();
  const ids = (await readdir(projectsRoot(), { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
  const summaries: ProjectSummary[] = [];
  for (const id of ids) {
    try {
      const { project, template } = await loadProject(id);
      const { done, total } = progressForProject(template, project);
      summaries.push({
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
      });
    } catch {
      continue;
    }
  }
  summaries.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return summaries;
}

async function writeProjectFiles(
  project: ProjectDocument,
  template: TemplateDocument,
): Promise<void> {
  validateProjectDocument(project);
  validateTemplateDocument(template);
  await mkdir(projectDir(project.id), { recursive: true });
  await writeFile(projectJsonPath(project.id), prettyStringify(project), "utf8");
  await writeFile(templateJsonPath(project.id), prettyStringify(template), "utf8");
}

export async function createProject(input: {
  site: Site;
  id?: string;
}): Promise<{ project: ProjectDocument; template: TemplateDocument }> {
  const now = new Date().toISOString();
  const template = structuredClone(BUNDLED_TEMPLATE);
  const project: ProjectDocument = {
    format: PROJECT_FORMAT,
    formatVersion: FORMAT_VERSION,
    id: input.id ?? crypto.randomUUID(),
    revision: 1,
    createdAt: now,
    updatedAt: now,
    template: {
      id: template.id,
      version: template.version,
      checksum: template.checksum,
    },
    site: input.site,
    answers: {},
    attachments: [],
  };
  await writeProjectFiles(project, template);
  return { project, template };
}

async function persistMutatedProject(
  projectId: string,
  mutate: (project: ProjectDocument) => void,
): Promise<ProjectDocument> {
  const { project, template } = await loadProject(projectId);
  mutate(project);
  project.revision += 1;
  project.updatedAt = new Date().toISOString();
  await writeProjectFiles(project, template);
  return project;
}

export async function updateSite(
  projectId: string,
  site: Site,
): Promise<ProjectDocument> {
  return persistMutatedProject(projectId, (project) => {
    project.site = site;
  });
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
  const known = template.items.some((item) => item.id === itemId);
  if (!known) {
    throw new PackageError(`Checklist item ${itemId} is not in this project's template`);
  }
  return persistMutatedProject(projectId, (project) => {
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
  bytes: Buffer;
}): Promise<{ project: ProjectDocument; attachment: AttachmentMeta }> {
  if (input.bytes.length > MAX_ATTACHMENT_BYTES) {
    throw new PackageError(
      `Attachment exceeds ${MAX_ATTACHMENT_BYTES} byte limit`,
    );
  }
  const filename = safeFilename(input.filename);
  const id = crypto.randomUUID();
  const sha256 = sha256Bytes(input.bytes);
  const addedAt = new Date().toISOString();
  const attachment: AttachmentMeta = {
    id,
    itemId: input.itemId,
    filename,
    mimeType: input.mimeType || "application/octet-stream",
    size: input.bytes.length,
    sha256,
    addedAt,
  };
  await mkdir(path.dirname(attachmentFilePath(input.projectId, id, filename)), {
    recursive: true,
  });
  await writeFile(attachmentFilePath(input.projectId, id, filename), input.bytes);
  const project = await persistMutatedProject(input.projectId, (doc) => {
    doc.attachments.push(attachment);
  });
  return { project, attachment };
}

export async function removeAttachment(
  projectId: string,
  attachmentId: string,
): Promise<ProjectDocument> {
  const { project } = await loadProject(projectId);
  const meta = project.attachments.find((item) => item.id === attachmentId);
  if (!meta) {
    throw new NotFoundError("Attachment was not found");
  }
  await rm(path.join(attachmentsDir(projectId), attachmentId), {
    recursive: true,
    force: true,
  });
  return persistMutatedProject(projectId, (doc) => {
    doc.attachments = doc.attachments.filter((item) => item.id !== attachmentId);
  });
}

export async function readAttachmentBytes(
  projectId: string,
  attachmentId: string,
): Promise<{ meta: AttachmentMeta; bytes: Buffer }> {
  const { project } = await loadProject(projectId);
  const meta = project.attachments.find((item) => item.id === attachmentId);
  if (!meta) {
    throw new NotFoundError("Attachment was not found");
  }
  const bytes = await readFile(
    attachmentFilePath(projectId, attachmentId, meta.filename),
  );
  if (sha256Bytes(bytes) !== meta.sha256) {
    throw new PackageError("Stored attachment hash does not match project.json");
  }
  return { meta, bytes };
}

async function loadPackedAttachments(
  project: ProjectDocument,
): Promise<PackedAttachment[]> {
  const packed: PackedAttachment[] = [];
  for (const meta of project.attachments) {
    const bytes = await readFile(
      attachmentFilePath(project.id, meta.id, meta.filename),
    );
    packed.push({ id: meta.id, filename: meta.filename, bytes });
  }
  return packed;
}

export async function exportProjectZip(projectId: string): Promise<{
  filename: string;
  bytes: Buffer;
  project: ProjectDocument;
}> {
  const { project, template } = await loadProject(projectId);
  const attachments = await loadPackedAttachments(project);
  const bytes = await packZip({ project, template, attachments });
  const slug = project.site.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "project";
  return {
    filename: `${slug}-rev${project.revision}.zip`,
    bytes,
    project,
  };
}

export async function importProjectZip(bytes: Buffer): Promise<{
  project: ProjectDocument;
  template: TemplateDocument;
}> {
  const unpacked = await unpackZip(bytes);
  await rm(projectDir(unpacked.project.id), { recursive: true, force: true });
  await mkdir(attachmentsDir(unpacked.project.id), { recursive: true });
  await writeFile(projectJsonPath(unpacked.project.id), unpacked.projectRaw, "utf8");
  await writeFile(templateJsonPath(unpacked.project.id), unpacked.templateRaw, "utf8");
  for (const file of unpacked.attachments) {
    const dest = attachmentFilePath(
      unpacked.project.id,
      file.id,
      file.filename,
    );
    await mkdir(path.dirname(dest), { recursive: true });
    await writeFile(dest, file.bytes);
  }
  return { project: unpacked.project, template: unpacked.template };
}

export async function deleteProject(projectId: string): Promise<void> {
  await rm(projectDir(projectId), { recursive: true, force: true });
}

export function applicableItemCount(
  template: TemplateDocument,
  typology: ProjectDocument["site"]["typology"],
): number {
  return itemsForTypology(template.items, typology).length;
}
