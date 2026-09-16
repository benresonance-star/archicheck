export const FORMAT_VERSION = "1.0.0" as const;

export const PROJECT_FORMAT = "vic-arch-checklist-project" as const;
export const TEMPLATE_FORMAT = "vic-arch-checklist-template" as const;
export const PACKAGE_FORMAT = "vic-arch-checklist-package" as const;

export const TYPOLOGIES = ["house", "townhouse", "apartment"] as const;
export type Typology = (typeof TYPOLOGIES)[number];

export const ITEM_STATUSES = [
  "todo",
  "in_progress",
  "done",
  "not_applicable",
  "blocked",
  "needs_recheck",
] as const;
export type ItemStatus = (typeof ITEM_STATUSES)[number];

export const IMPACT_STATUSES = ["open", "adopted", "dismissed"] as const;
export type ImpactStatus = (typeof IMPACT_STATUSES)[number];

export type TemplateRef = {
  id: string;
  version: string;
  checksum: string;
};

export type Answer = {
  status: ItemStatus;
  notes: string;
  updatedAt: string;
  fields: Record<string, string | number | boolean | null>;
  previousStatus?: ItemStatus;
};

export type TemplateItemChange = {
  itemId: string;
  title: string;
  beforeTitle: string;
  afterTitle: string;
  beforeDetail: string;
  afterDetail: string;
  beforeReferences: string[];
  afterReferences: string[];
};

export type TemplateRelease = {
  id: string;
  findingId: string;
  sourceTitle: string;
  sourceUrl: string;
  fromVersion: string;
  toVersion: string;
  publishedAt: string;
  changes: TemplateItemChange[];
};

export type ImpactChange = TemplateItemChange & {
  adopted: boolean;
};

export type ImpactNotice = {
  id: string;
  releaseId: string;
  findingId: string;
  sourceTitle: string;
  sourceUrl: string;
  fromVersion: string;
  toVersion: string;
  publishedAt: string;
  status: ImpactStatus;
  changes: ImpactChange[];
};

export type AttachmentMeta = {
  id: string;
  itemId: string | null;
  deliverableId?: string | null;
  filename: string;
  mimeType: string;
  size: number;
  sha256: string;
  addedAt: string;
};

export type Site = {
  name: string;
  typology: Typology;
  address: string;
  municipality: string;
  planningScheme: string;
  zone: string;
  overlays: string[];
  storeys: number;
  dwellingCount: number;
  lotAreaSqm: number | null;
  notes: string;
};

export type ProjectDocument = {
  format: typeof PROJECT_FORMAT;
  formatVersion: typeof FORMAT_VERSION;
  id: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
  template: TemplateRef;
  site: Site;
  answers: Record<string, Answer>;
  attachments: AttachmentMeta[];
  impacts?: ImpactNotice[];
};

export type Stage = {
  id: string;
  number: number;
  title: string;
  summary: string;
};

export const DELIVERABLE_KINDS = ["drawing", "document"] as const;
export type DeliverableKind = (typeof DELIVERABLE_KINDS)[number];

export type StageDeliverable = {
  id: string;
  stageId: string;
  kind: DeliverableKind;
  title: string;
  summary: string;
  appliesTo: Typology[];
};

export type ChecklistResource = {
  label: string;
  url: string;
};

export type ChecklistItem = {
  id: string;
  stageId: string;
  title: string;
  detail: string;
  appliesTo: Typology[];
  required: boolean;
  references: string[];
  resources: ChecklistResource[];
  grokbotId: string;
  deliverableId?: string;
};

export type GrokBotBrief = {
  id: string;
  name: string;
  title: string;
  stageId: string;
  description: string;
  firstTask: string;
  plugins: string[];
  approvalRules: string[];
};

export type TemplateDocument = {
  format: typeof TEMPLATE_FORMAT;
  formatVersion: typeof FORMAT_VERSION;
  id: string;
  version: string;
  title: string;
  jurisdiction: string;
  description: string;
  checksum: string;
  stages: Stage[];
  items: ChecklistItem[];
  grokbots: GrokBotBrief[];
  deliverables?: StageDeliverable[];
};

export type PackageAttachmentIndex = {
  id: string;
  path: string;
  sha256: string;
  size: number;
  filename: string;
};

export type PackageManifest = {
  format: typeof PACKAGE_FORMAT;
  formatVersion: typeof FORMAT_VERSION;
  exportedAt: string;
  projectId: string;
  revision: number;
  templateId: string;
  templateVersion: string;
  templateChecksum: string;
  files: {
    project: "project.json";
    template: "template.json";
    attachments: PackageAttachmentIndex[];
  };
};

export type ProjectSummary = {
  id: string;
  name: string;
  typology: Typology;
  address: string;
  revision: number;
  updatedAt: string;
  templateId: string;
  templateVersion: string;
  done: number;
  total: number;
  openImpacts: number;
};

export function isTypology(value: string): value is Typology {
  return (TYPOLOGIES as readonly string[]).includes(value);
}

export function isItemStatus(value: string): value is ItemStatus {
  return (ITEM_STATUSES as readonly string[]).includes(value);
}

export function isImpactStatus(value: string): value is ImpactStatus {
  return (IMPACT_STATUSES as readonly string[]).includes(value);
}

export function openImpactCount(project: ProjectDocument): number {
  return (project.impacts ?? []).filter((notice) => notice.status === "open")
    .length;
}

export function mergeAnswer(
  existing: Answer | undefined,
  patch: {
    status?: ItemStatus;
    notes?: string;
    fields?: Record<string, string | number | boolean | null>;
  },
  now: string,
): Answer {
  const status = patch.status ?? existing?.status ?? "todo";
  const previousStatus =
    status === "needs_recheck"
      ? existing?.previousStatus ??
        (existing && existing.status !== "needs_recheck"
          ? existing.status
          : undefined)
      : undefined;
  return {
    status,
    notes: patch.notes ?? existing?.notes ?? "",
    updatedAt: now,
    fields: patch.fields ?? existing?.fields ?? {},
    previousStatus,
  };
}

export function assertNever(value: never, message: string): never {
  throw new Error(message);
}

export function typologyLabel(typology: Typology): string {
  switch (typology) {
    case "house":
      return "House";
    case "townhouse":
      return "Townhouse";
    case "apartment":
      return "Apartment";
    default:
      return assertNever(typology, `Unknown typology: ${String(typology)}`);
  }
}

export function deliverableKindLabel(kind: DeliverableKind): string {
  switch (kind) {
    case "drawing":
      return "Drawing";
    case "document":
      return "Document";
    default:
      return assertNever(kind, `Unknown deliverable kind: ${String(kind)}`);
  }
}

export function statusLabel(status: ItemStatus): string {
  switch (status) {
    case "todo":
      return "To do";
    case "in_progress":
      return "In progress";
    case "done":
      return "Done";
    case "not_applicable":
      return "N/A";
    case "blocked":
      return "Blocked";
    case "needs_recheck":
      return "Needs recheck";
    default:
      return assertNever(status, `Unknown status: ${String(status)}`);
  }
}

export function itemsForTypology(
  items: ChecklistItem[],
  typology: Typology,
): ChecklistItem[] {
  return items.filter((item) => item.appliesTo.includes(typology));
}

export function progressForProject(
  template: TemplateDocument,
  project: ProjectDocument,
): { done: number; total: number } {
  const applicable = itemsForTypology(template.items, project.site.typology);
  const total = applicable.length;
  const done = applicable.filter((item) => {
    const answer = project.answers[item.id];
    return answer?.status === "done" || answer?.status === "not_applicable";
  }).length;
  return { done, total };
}
