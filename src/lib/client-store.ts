import { sha256Bytes, sha256Json } from "@/lib/web-hash";
import { packZip, unpackZip, PackageError } from "@/lib/browser-zip";
import { prettyStringify } from "@/lib/canonical";
import { templateChecksumPayload } from "@/lib/hash-payload";
import { BUNDLED_TEMPLATE } from "@/lib/template/vic-residential";
import {
  FORMAT_VERSION,
  PROJECT_FORMAT,
  type AttachmentMeta,
  type FindingDocument,
  type ItemStatus,
  type ProjectDocument,
  type ProjectSummary,
  type Site,
  type TemplateDocument,
  type TemplateRelease,
  isJobOnlyItemId,
  mergeAnswer,
  openImpactCount,
  progressForProject,
} from "@/lib/types";
import {
  addItemToTemplate,
  buildChecklistItem,
  bumpJobVersion,
  diffTemplateItems,
  moveItemAmongSiblings,
  reorderItemsAmongSiblings,
  siblingOrder,
  newJobItemId,
  promoteItemCopy,
  removeItemFromTemplate,
  updateItemInTemplate,
  type ChecklistItemDraft,
  type ChecklistItemPatch,
  type MoveDirection,
} from "@/lib/template/checklist-crud";
import { validateProjectDocument, validateTemplateDocument } from "@/lib/validate";
import { applyProposedToTemplate } from "@/lib/scout/apply-wording";
import { appendFinding } from "@/lib/agent/findings";
import {
  mergeScoutSettings,
  STATEWIDE_BOARD_ID,
  type ScoutSettings,
} from "@/lib/scout/settings";
import {
  SCOUT_FORMAT_VERSION,
  SCOUT_REPORT_FORMAT,
  type ScoutFinding,
  type ScoutProposed,
  type ScoutReport,
} from "@/lib/scout/types";
import type { PreviousSnapshot } from "@/lib/scout/watch-list";
import {
  adoptSelected,
  dismissNotice,
  noticeFromRelease,
  publishEditsToTemplate,
  publishFindingToTemplate,
} from "@/lib/template/publish";

const DB_NAME = "vic-arch-checklist";
const DB_VERSION = 4;
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
      if (!db.objectStoreNames.contains("liveTemplate")) {
        db.createObjectStore("liveTemplate", { keyPath: "id" });
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
        openImpacts: openImpactCount(project),
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
  const live = await loadLiveTemplate();
  const template = structuredClone(live.template);
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
    impacts: [],
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
    project.answers[itemId] = mergeAnswer(
      existing,
      patch,
      new Date().toISOString(),
    );
  });
}

export async function recordFinding(
  projectId: string,
  finding: FindingDocument,
): Promise<ProjectDocument> {
  return mutateProject(projectId, (project) => {
    const next = appendFinding(project, finding);
    project.findings = next.findings;
  });
}

export async function addAttachment(input: {
  projectId: string;
  itemId: string | null;
  deliverableId?: string | null;
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
    deliverableId: input.deliverableId ?? null,
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

export async function updateSite(
  projectId: string,
  site: Site,
): Promise<ProjectDocument> {
  return mutateProject(projectId, (project) => {
    project.site = site;
  });
}

type LiveTemplateRecord = {
  id: string;
  template: TemplateDocument;
  releases: TemplateRelease[];
};

export async function loadLiveTemplate(): Promise<{
  template: TemplateDocument;
  releases: TemplateRelease[];
}> {
  try {
    const db = await openDb();
    const tx = db.transaction("liveTemplate", "readonly");
    const row = (await requestToPromise(
      tx.objectStore("liveTemplate").get(BUNDLED_TEMPLATE.id),
    )) as LiveTemplateRecord | undefined;
    await txDone(tx);
    if (row?.template) {
      return {
        template: validateTemplateDocument(row.template),
        releases: row.releases ?? [],
      };
    }
  } catch {
    // First run or older IndexedDB without this store yet.
  }
  return { template: structuredClone(BUNDLED_TEMPLATE), releases: [] };
}

async function saveLiveTemplate(
  template: TemplateDocument,
  releases: TemplateRelease[],
): Promise<void> {
  validateTemplateDocument(template);
  const db = await openDb();
  const tx = db.transaction("liveTemplate", "readwrite");
  tx.objectStore("liveTemplate").put({
    id: template.id,
    template: JSON.parse(prettyStringify(template)) as TemplateDocument,
    releases,
  } satisfies LiveTemplateRecord);
  await txDone(tx);
}

async function stampTemplateChecksum(
  template: TemplateDocument,
): Promise<TemplateDocument> {
  template.checksum = await sha256Json(
    templateChecksumPayload(template as unknown as Record<string, unknown>),
  );
  return template;
}

export async function addSourcedProposal(input: {
  sourceTitle: string;
  sourceUrl: string;
  flag: string;
  itemIds: string[];
  detail: string;
  action?: ScoutFinding["action"];
  proposed?: ScoutProposed;
}): Promise<ScoutReport> {
  const sourceTitle = input.sourceTitle.trim();
  const sourceUrl = input.sourceUrl.trim();
  const flag = input.flag.trim();
  const detail = input.detail.trim();
  if (!sourceTitle) {
    throw new Error("Give the source a name");
  }
  if (!sourceUrl.startsWith("https://")) {
    throw new Error("Source URL must start with https://");
  }
  if (input.itemIds.length === 0 && !input.proposed?.newItem) {
    throw new Error("Pick at least one checklist item");
  }
  if (!detail && !input.proposed?.newItem) {
    throw new Error("Write the proposed wording");
  }
  const existing = await loadScoutReport(STATEWIDE_BOARD_ID);
  const finding: ScoutFinding = {
    id: crypto.randomUUID(),
    sourceId: `proposal-${crypto.randomUUID()}`,
    sourceTitle,
    url: sourceUrl,
    scope: "statewide",
    action: input.action ?? "replace",
    itemIds: input.itemIds,
    flag: flag || "Sourced wording change proposed for review.",
    proposed: input.proposed ?? {
      detail,
      references: [sourceUrl],
    },
    confidence: "low",
    status: "open",
    hashChanged: false,
    baseline: false,
  };
  const report: ScoutReport = existing
    ? { ...existing, findings: [finding, ...existing.findings] }
    : {
        format: SCOUT_REPORT_FORMAT,
        formatVersion: SCOUT_FORMAT_VERSION,
        id: crypto.randomUUID(),
        projectId: STATEWIDE_BOARD_ID,
        kind: "statewide",
        ranAt: new Date().toISOString(),
        municipality: "",
        localConfigured: false,
        typology: "house",
        snapshots: [],
        findings: [finding],
      };
  await saveScoutReport(report);
  return report;
}

export async function publishFinding(input: {
  reportId: string;
  finding: ScoutFinding;
  proposed: ScoutProposed;
}): Promise<{
  template: TemplateDocument;
  report: ScoutReport;
  release: TemplateRelease;
}> {
  const live = await loadLiveTemplate();
  const publishedAt = new Date().toISOString();
  const published = publishFindingToTemplate({
    template: live.template,
    finding: input.finding,
    proposed: input.proposed,
    publishedAt,
    releaseId: crypto.randomUUID(),
  });
  await stampTemplateChecksum(published.template);
  await saveLiveTemplate(published.template, [
    ...live.releases,
    published.release,
  ]);
  const summaries = await listProjects();
  for (const summary of summaries) {
    const loaded = await loadProject(summary.id);
    const notice = noticeFromRelease({
      release: published.release,
      project: loaded.project,
      template: loaded.template,
      noticeId: crypto.randomUUID(),
    });
    if (!notice) {
      continue;
    }
    loaded.project.impacts = [...(loaded.project.impacts ?? []), notice];
    loaded.project.revision += 1;
    loaded.project.updatedAt = publishedAt;
    await writeProject(loaded.project, loaded.template);
  }
  const report = await patchScoutFinding(input.reportId, input.finding.id, {
    status: "published",
    proposed: input.proposed,
  });
  return {
    template: published.template,
    report,
    release: published.release,
  };
}

export async function adoptFindingOnProject(input: {
  projectId: string;
  finding: ScoutFinding;
  proposed: ScoutProposed;
}): Promise<{ template: TemplateDocument; report: ScoutReport; project: ProjectDocument }> {
  const { project, template } = await loadProject(input.projectId);
  const next = applyProposedToTemplate(template, input.finding, input.proposed);
  next.version = bumpDraftVersion(next.version);
  await stampTemplateChecksum(next);
  const now = new Date().toISOString();
  const itemIds =
    input.finding.itemIds.length > 0
      ? input.finding.itemIds
      : input.proposed.newItem
        ? [input.proposed.newItem.id]
        : [];
  for (const itemId of itemIds) {
    if (!next.items.some((item) => item.id === itemId)) {
      continue;
    }
    project.answers[itemId] = mergeAnswer(
      project.answers[itemId],
      { status: "needs_recheck" },
      now,
    );
  }
  project.template = {
    id: next.id,
    version: next.version,
    checksum: next.checksum,
  };
  project.revision += 1;
  project.updatedAt = now;
  await writeProject(project, next);
  const report = await patchScoutFinding(input.projectId, input.finding.id, {
    status: "accepted_draft",
    proposed: input.proposed,
  });
  return { template: next, report, project };
}

export async function adoptImpact(input: {
  projectId: string;
  noticeId: string;
  selectedItemIds: string[];
}): Promise<{ project: ProjectDocument; template: TemplateDocument }> {
  const { project, template } = await loadProject(input.projectId);
  const notice = (project.impacts ?? []).find(
    (row) => row.id === input.noticeId,
  );
  if (!notice) {
    throw new Error("Impact notice was not found on this project");
  }
  const live = await loadLiveTemplate();
  const adopted = adoptSelected({
    project,
    template,
    publishedTemplate: live.template,
    notice,
    selectedItemIds: input.selectedItemIds,
    now: new Date().toISOString(),
  });
  await stampTemplateChecksum(adopted.template);
  adopted.project.template = {
    id: adopted.template.id,
    version: notice.toVersion,
    checksum: adopted.template.checksum,
  };
  adopted.project.revision += 1;
  adopted.project.updatedAt = new Date().toISOString();
  await writeProject(adopted.project, adopted.template);
  return adopted;
}

export async function dismissImpact(input: {
  projectId: string;
  noticeId: string;
}): Promise<{ project: ProjectDocument; template: TemplateDocument }> {
  const { project, template } = await loadProject(input.projectId);
  const next = dismissNotice(project, input.noticeId);
  next.revision += 1;
  next.updatedAt = new Date().toISOString();
  await writeProject(next, template);
  return { project: next, template };
}

export async function syncProjectImpacts(projectId: string): Promise<{
  project: ProjectDocument;
  template: TemplateDocument;
}> {
  const loaded = await loadProject(projectId);
  const live = await loadLiveTemplate();
  if (
    loaded.project.template.version === live.template.version &&
    loaded.project.template.checksum === live.template.checksum
  ) {
    return loaded;
  }
  let added = 0;
  const now = new Date().toISOString();
  for (const release of live.releases) {
    const notice = noticeFromRelease({
      release,
      project: loaded.project,
      template: loaded.template,
      noticeId: crypto.randomUUID(),
    });
    if (!notice) {
      continue;
    }
    loaded.project.impacts = [...(loaded.project.impacts ?? []), notice];
    added += 1;
  }
  if (added === 0) {
    return loaded;
  }
  loaded.project.revision += 1;
  loaded.project.updatedAt = now;
  await writeProject(loaded.project, loaded.template);
  return loaded;
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

async function mutateWorkspace(
  projectId: string,
  mutate: (project: ProjectDocument, template: TemplateDocument) => void,
): Promise<{ project: ProjectDocument; template: TemplateDocument }> {
  const { project, template } = await loadProject(projectId);
  mutate(project, template);
  await stampTemplateChecksum(template);
  project.template = {
    id: template.id,
    version: template.version,
    checksum: template.checksum,
  };
  project.revision += 1;
  project.updatedAt = new Date().toISOString();
  await writeProject(project, template);
  return { project, template };
}

export async function addProjectItem(input: {
  projectId: string;
  draft: ChecklistItemDraft;
  afterItemId?: string;
}): Promise<{ project: ProjectDocument; template: TemplateDocument }> {
  return mutateWorkspace(input.projectId, (project, template) => {
    const item = buildChecklistItem({
      id: newJobItemId(),
      draft: input.draft,
    });
    const next = addItemToTemplate(template, item, input.afterItemId);
    template.items = next.items;
    template.version = bumpJobVersion(template.version);
  });
}

export async function updateProjectItem(input: {
  projectId: string;
  itemId: string;
  patch: ChecklistItemPatch;
}): Promise<{ project: ProjectDocument; template: TemplateDocument }> {
  return mutateWorkspace(input.projectId, (_project, template) => {
    const next = updateItemInTemplate(template, input.itemId, input.patch);
    template.items = next.items;
    template.version = bumpJobVersion(template.version);
  });
}

export async function removeProjectItem(input: {
  projectId: string;
  itemId: string;
}): Promise<{ project: ProjectDocument; template: TemplateDocument }> {
  return mutateWorkspace(input.projectId, (_project, template) => {
    const next = removeItemFromTemplate(template, input.itemId);
    template.items = next.items;
    template.version = bumpJobVersion(template.version);
  });
}

export async function moveProjectItem(input: {
  projectId: string;
  itemId: string;
  siblingIds: string[];
  direction: MoveDirection;
}): Promise<{ project: ProjectDocument; template: TemplateDocument }> {
  return mutateWorkspace(input.projectId, (_project, template) => {
    const next = moveItemAmongSiblings(
      template,
      input.siblingIds,
      input.itemId,
      input.direction,
    );
    template.items = next.items;
    template.version = bumpJobVersion(template.version);
  });
}

export async function reorderProjectItems(input: {
  projectId: string;
  siblingIds: string[];
}): Promise<{ project: ProjectDocument; template: TemplateDocument }> {
  const loaded = await loadProject(input.projectId);
  if (
    siblingOrder(loaded.template, input.siblingIds).join("\n") ===
    input.siblingIds.join("\n")
  ) {
    return loaded;
  }
  return mutateWorkspace(input.projectId, (_project, template) => {
    const next = reorderItemsAmongSiblings(template, input.siblingIds);
    template.items = next.items;
    template.version = bumpJobVersion(template.version);
  });
}

export async function publishLiveTemplateEdits(input: {
  draft: TemplateDocument;
  sourceTitle: string;
  sourceUrl: string;
}): Promise<{ template: TemplateDocument; release: TemplateRelease }> {
  const sourceTitle = input.sourceTitle.trim();
  const sourceUrl = input.sourceUrl.trim();
  if (!sourceTitle) {
    throw new Error("Give the source a name");
  }
  if (!sourceUrl.startsWith("https://")) {
    throw new Error("Source URL must start with https://");
  }
  const live = await loadLiveTemplate();
  const changes = diffTemplateItems(live.template, input.draft);
  if (changes.length === 0) {
    throw new Error("No checklist changes to publish");
  }
  const publishedAt = new Date().toISOString();
  const published = publishEditsToTemplate({
    template: live.template,
    nextTemplate: input.draft,
    changes,
    sourceTitle,
    sourceUrl,
    publishedAt,
    releaseId: crypto.randomUUID(),
    findingId: `live-edit-${crypto.randomUUID()}`,
  });
  await stampTemplateChecksum(published.template);
  await saveLiveTemplate(published.template, [
    ...live.releases,
    published.release,
  ]);
  const summaries = await listProjects();
  for (const summary of summaries) {
    const loaded = await loadProject(summary.id);
    const notice = noticeFromRelease({
      release: published.release,
      project: loaded.project,
      template: loaded.template,
      noticeId: crypto.randomUUID(),
    });
    if (!notice) {
      continue;
    }
    loaded.project.impacts = [...(loaded.project.impacts ?? []), notice];
    loaded.project.revision += 1;
    loaded.project.updatedAt = publishedAt;
    await writeProject(loaded.project, loaded.template);
  }
  return {
    template: published.template,
    release: published.release,
  };
}

export async function proposeJobItemPromotion(input: {
  projectId: string;
  itemId: string;
  sourceTitle: string;
  sourceUrl: string;
  flag?: string;
}): Promise<ScoutReport> {
  const { template } = await loadProject(input.projectId);
  const item = template.items.find((entry) => entry.id === input.itemId);
  if (!item) {
    throw new Error("Checklist item is not in this project's template");
  }
  if (!isJobOnlyItemId(item.id)) {
    throw new Error("Only job-only checks can be proposed for the live template");
  }
  const promoted = promoteItemCopy(item);
  return addSourcedProposal({
    sourceTitle: input.sourceTitle,
    sourceUrl: input.sourceUrl,
    flag:
      input.flag?.trim() ||
      "Job-only check proposed for the live template that populates new projects.",
    itemIds: [],
    detail: promoted.detail || promoted.title,
    action: "add",
    proposed: {
      title: promoted.title,
      detail: promoted.detail,
      references: promoted.references,
      appliesTo: promoted.appliesTo,
      newItem: promoted,
    },
  });
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
