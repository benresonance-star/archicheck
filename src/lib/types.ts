export const FORMAT_VERSION = "1.0.0" as const;

export const PROJECT_FORMAT = "vic-arch-checklist-project" as const;
export const TEMPLATE_FORMAT = "vic-arch-checklist-template" as const;
export const PACKAGE_FORMAT = "vic-arch-checklist-package" as const;
export const FINDING_FORMAT = "vic-arch-checklist-finding" as const;
export const FINDING_FORMAT_VERSION = "1.0.0" as const;
export const ITEM_ASSESSMENT_SCHEMA_VERSION = "1.0.0" as const;

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

export const REQUIREMENT_KINDS = [
  "regulatory",
  "guidance",
  "office_practice",
] as const;
export type RequirementKind = (typeof REQUIREMENT_KINDS)[number];

export const ELEMENT_TYPES = [
  "site",
  "building",
  "dwelling",
  "private_open_space",
  "communal_open_space",
  "balcony",
  "facade",
  "landscape",
  "drawing",
  "document",
  "practice",
] as const;
export type ElementType = (typeof ELEMENT_TYPES)[number];

export const INPUT_DATA_KINDS = [
  "drawing",
  "document",
  "measurement",
  "site_data",
  "certificate",
  "note",
] as const;
export type InputDataKind = (typeof INPUT_DATA_KINDS)[number];

export const FINDING_RESULTS = [
  "pass",
  "fail",
  "not_applicable",
  "insufficient_information",
  "needs_judgement",
  "check_error",
] as const;
export type FindingResult = (typeof FINDING_RESULTS)[number];

export const CHECKLIST_ISSUE_KINDS = [
  "ambiguity",
  "contradiction",
  "missing_coverage",
] as const;
export type ChecklistIssueKind = (typeof CHECKLIST_ISSUE_KINDS)[number];

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
  zones?: string[];
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
  findings?: FindingDocument[];
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

export type SourceReference = {
  citation: string;
  url?: string;
  version?: string;
};

export type RequirementSpec = {
  kind: RequirementKind;
  statement: string;
  version?: string;
  sourceRefs: SourceReference[];
};

export type ApplicabilitySpec = {
  elementTypes: string[];
  conditions?: string;
};

export type RequiredInput = {
  id: string;
  label: string;
  kind: InputDataKind;
  required: boolean;
};

export type RequiredEvidence = {
  id: string;
  label: string;
  kind: InputDataKind;
};

export type CheckingMethod = {
  id: string;
  description: string;
  acceptanceCriteria: string[];
};

export type HumanReviewNeed = {
  required: boolean;
  reason?: string;
};

export type ItemAssessment = {
  schemaVersion: typeof ITEM_ASSESSMENT_SCHEMA_VERSION;
  requirement: RequirementSpec;
  method: CheckingMethod;
  applicability: ApplicabilitySpec;
  requiredInputs: RequiredInput[];
  requiredEvidence: RequiredEvidence[];
  humanReview: HumanReviewNeed;
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
  assessment?: ItemAssessment;
};

export type DesignRevisionRef = {
  id: string;
  label: string;
  capturedAt?: string;
};

export type AffectedElement = {
  id?: string;
  type: string;
  label: string;
};

export type FindingEvidence = {
  id: string;
  inputId?: string;
  description: string;
  present: boolean;
  location?: string;
};

export type SuggestedChecklistChange = {
  title?: string;
  detail?: string;
  references?: string[];
};

export type ChecklistIssue = {
  kind: ChecklistIssueKind;
  itemId?: string;
  detail: string;
  suggestedChange?: SuggestedChecklistChange;
};

export type FindingDocument = {
  format: typeof FINDING_FORMAT;
  formatVersion: typeof FINDING_FORMAT_VERSION;
  id: string;
  createdAt: string;
  itemId: string;
  checklist: TemplateRef;
  designRevision: DesignRevisionRef;
  result: FindingResult;
  summary: string;
  affectedElements: AffectedElement[];
  evidence: FindingEvidence[];
  assumptions: string[];
  missingInputs: string[];
  checklistIssue?: ChecklistIssue;
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

export function isRequirementKind(value: string): value is RequirementKind {
  return (REQUIREMENT_KINDS as readonly string[]).includes(value);
}

export function isInputDataKind(value: string): value is InputDataKind {
  return (INPUT_DATA_KINDS as readonly string[]).includes(value);
}

export function isFindingResult(value: string): value is FindingResult {
  return (FINDING_RESULTS as readonly string[]).includes(value);
}

export function isChecklistIssueKind(value: string): value is ChecklistIssueKind {
  return (CHECKLIST_ISSUE_KINDS as readonly string[]).includes(value);
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

export function requirementKindLabel(kind: RequirementKind): string {
  switch (kind) {
    case "regulatory":
      return "Regulatory requirement";
    case "guidance":
      return "Guidance";
    case "office_practice":
      return "Office practice";
    default:
      return assertNever(kind, `Unknown requirement kind: ${String(kind)}`);
  }
}

export function findingResultLabel(result: FindingResult): string {
  switch (result) {
    case "pass":
      return "Pass";
    case "fail":
      return "Fail";
    case "not_applicable":
      return "Not applicable";
    case "insufficient_information":
      return "Insufficient information";
    case "needs_judgement":
      return "Needs judgement";
    case "check_error":
      return "Check error";
    default:
      return assertNever(result, `Unknown finding result: ${String(result)}`);
  }
}

export function checklistIssueKindLabel(kind: ChecklistIssueKind): string {
  switch (kind) {
    case "ambiguity":
      return "Ambiguity";
    case "contradiction":
      return "Contradiction";
    case "missing_coverage":
      return "Missing coverage";
    default:
      return assertNever(kind, `Unknown checklist issue: ${String(kind)}`);
  }
}

export function inputDataKindLabel(kind: InputDataKind): string {
  switch (kind) {
    case "drawing":
      return "Drawing";
    case "document":
      return "Document";
    case "measurement":
      return "Measurement";
    case "site_data":
      return "Site data";
    case "certificate":
      return "Certificate";
    case "note":
      return "Note";
    default:
      return assertNever(kind, `Unknown input kind: ${String(kind)}`);
  }
}

export function itemsForTypology(
  items: ChecklistItem[],
  typology: Typology,
): ChecklistItem[] {
  return items.filter((item) => item.appliesTo.includes(typology));
}

export function progressForItems(
  items: ChecklistItem[],
  answers: ProjectDocument["answers"],
): { done: number; total: number } {
  const done = items.filter((item) => {
    const answer = answers[item.id];
    return answer?.status === "done" || answer?.status === "not_applicable";
  }).length;
  return { done, total: items.length };
}

export function progressForProject(
  template: TemplateDocument,
  project: ProjectDocument,
): { done: number; total: number } {
  return progressForItems(
    itemsForTypology(template.items, project.site.typology),
    project.answers,
  );
}
