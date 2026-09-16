import {
  assertNever,
  findingResultLabel,
  requirementKindLabel,
  statusLabel,
  typologyLabel,
  TYPOLOGIES,
  progressForItems,
  type AttachmentMeta,
  type ChecklistItem,
  type FindingDocument,
  type ItemStatus,
  type ProjectDocument,
  type RequirementKind,
} from "@/lib/types";

export const CHECK_SIGNALS = [
  "todo",
  "in_progress",
  "done",
  "pass",
  "fail",
  "not_applicable",
  "blocked",
  "needs_recheck",
  "evidence_missing",
] as const;
export type CheckSignal = (typeof CHECK_SIGNALS)[number];

export type CheckUnderstanding = {
  established: string;
  why: string;
  evidence: string[];
  assessment: string[];
  method?: string;
  acceptanceCriteria: string[];
};

export function latestFindingForItem(
  findings: FindingDocument[] | undefined,
  itemId: string,
): FindingDocument | undefined {
  return (findings ?? [])
    .filter((finding) => finding.itemId === itemId)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0];
}

export function findingsForItem(
  findings: FindingDocument[] | undefined,
  itemId: string,
): FindingDocument[] {
  return (findings ?? [])
    .filter((finding) => finding.itemId === itemId)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export function requiredEvidenceMissing(args: {
  item: ChecklistItem;
  notes: string;
  files: AttachmentMeta[];
  findings?: FindingDocument[];
}): boolean {
  const { item, notes, files, findings } = args;
  const assessment = item.assessment;
  if (!assessment) {
    return false;
  }
  const latest = latestFindingForItem(findings, item.id);
  if (latest) {
    if (latest.result === "insufficient_information") {
      return true;
    }
    if (latest.missingInputs.length > 0) {
      return true;
    }
    if (latest.evidence.some((row) => !row.present)) {
      return true;
    }
  }
  const needs = [
    ...assessment.requiredInputs.filter((input) => input.required),
    ...assessment.requiredEvidence,
  ];
  if (needs.length === 0) {
    return false;
  }
  return files.length === 0 && notes.trim() === "";
}

export function deriveCheckSignal(args: {
  item: ChecklistItem;
  status: ItemStatus;
  notes: string;
  files: AttachmentMeta[];
  findings?: FindingDocument[];
}): CheckSignal {
  const { item, status, notes, files, findings } = args;
  const latest = latestFindingForItem(findings, item.id);
  if (status === "not_applicable") {
    return "not_applicable";
  }
  if (status === "needs_recheck") {
    return "needs_recheck";
  }
  if (latest?.result === "fail") {
    return "fail";
  }
  if (
    latest?.result === "insufficient_information" ||
    requiredEvidenceMissing({ item, notes, files, findings })
  ) {
    return "evidence_missing";
  }
  if (latest?.result === "pass" && status === "done") {
    return "pass";
  }
  switch (status) {
    case "todo":
      return "todo";
    case "in_progress":
      return "in_progress";
    case "done":
      return "done";
    case "blocked":
      return "blocked";
    default:
      return assertNever(status, `Unknown status: ${String(status)}`);
  }
}

export function templateCheckSignal(ticked: boolean): CheckSignal {
  return ticked ? "done" : "todo";
}

export function rowShowsSignal(signal: CheckSignal): boolean {
  return signal !== "todo";
}

export function needsEvidenceCount(signals: CheckSignal[]): number {
  return signals.filter(
    (signal) => signal === "evidence_missing" || signal === "needs_recheck",
  ).length;
}

export function listRollup(args: {
  done: number;
  total: number;
  needsEvidence: number;
}): string {
  if (args.needsEvidence > 0) {
    return args.needsEvidence === 1
      ? "1 needs evidence"
      : `${args.needsEvidence} need evidence`;
  }
  return `${args.done}/${args.total}`;
}

export function projectItemSignal(
  item: ChecklistItem,
  project: ProjectDocument,
): CheckSignal {
  const answer = project.answers[item.id];
  return deriveCheckSignal({
    item,
    status: answer?.status ?? "todo",
    notes: answer?.notes ?? "",
    files: project.attachments.filter((file) => file.itemId === item.id),
    findings: project.findings,
  });
}

export function projectListRollup(
  items: ChecklistItem[],
  project: ProjectDocument,
): string {
  const signals = items.map((item) => projectItemSignal(item, project));
  const progress = progressForItems(items, project.answers);
  return listRollup({
    done: progress.done,
    total: items.length,
    needsEvidence: needsEvidenceCount(signals),
  });
}

export function checkSignalLabel(signal: CheckSignal): string {
  switch (signal) {
    case "todo":
      return "To do";
    case "in_progress":
      return "In progress";
    case "done":
      return "Done";
    case "pass":
      return "Pass";
    case "fail":
      return "Fail";
    case "not_applicable":
      return "N/A";
    case "blocked":
      return "Blocked";
    case "needs_recheck":
      return "Needs recheck";
    case "evidence_missing":
      return "Evidence missing";
    default:
      return assertNever(signal, `Unknown check signal: ${String(signal)}`);
  }
}

export function checkSignalVariant(
  signal: CheckSignal,
): "default" | "secondary" | "destructive" | "outline" {
  switch (signal) {
    case "evidence_missing":
    case "needs_recheck":
    case "fail":
    case "blocked":
      return "destructive";
    case "pass":
    case "done":
      return "default";
    case "todo":
    case "in_progress":
    case "not_applicable":
      return "outline";
    default:
      return assertNever(signal, `Unknown check signal: ${String(signal)}`);
  }
}

function shortRequirementKind(kind: RequirementKind): string {
  switch (kind) {
    case "regulatory":
      return "Regulatory";
    case "guidance":
      return "Guidance";
    case "office_practice":
      return "Office practice";
    default:
      return assertNever(kind, `Unknown requirement kind: ${String(kind)}`);
  }
}

export function itemRestrictionParts(item: ChecklistItem): string[] {
  const parts: string[] = [];
  if (!item.required) {
    parts.push("Optional");
  }
  if (item.appliesTo.length < TYPOLOGIES.length) {
    parts.push(
      `${item.appliesTo.map((typology) => typologyLabel(typology)).join(" / ")} only`,
    );
  }
  if (item.assessment) {
    parts.push(shortRequirementKind(item.assessment.requirement.kind));
    if (item.assessment.requirement.version) {
      parts.push(item.assessment.requirement.version);
    }
  }
  return parts;
}

export function checkUnderstanding(args: {
  item: ChecklistItem;
  notes: string;
  files: AttachmentMeta[];
  status?: ItemStatus;
  ticked?: boolean;
  findings?: FindingDocument[];
  mode: "project" | "template";
}): CheckUnderstanding {
  const { item, notes, files, status, ticked, findings, mode } = args;
  const assessment = item.assessment;
  const latest = latestFindingForItem(findings, item.id);
  const established =
    assessment?.requirement.statement.trim() || item.detail.trim() || item.title;
  const whyParts: string[] = [];
  if (assessment) {
    whyParts.push(requirementKindLabel(assessment.requirement.kind));
    if (assessment.applicability.conditions) {
      whyParts.push(assessment.applicability.conditions);
    } else if (assessment.applicability.elementTypes.length > 0) {
      whyParts.push(
        `Applies to ${assessment.applicability.elementTypes.join(", ")}.`,
      );
    }
    if (assessment.humanReview.required) {
      whyParts.push(
        assessment.humanReview.reason ??
          "A person must review this before it can close.",
      );
    }
  } else {
    whyParts.push(
      item.required
        ? "Required on this typology for the current template."
        : "Optional on this typology.",
    );
  }

  const evidence: string[] = [];
  if (mode === "template") {
    evidence.push(
      "This is a phone reference tick. Start a project to attach drawings, notes and evidence.",
    );
  } else if (assessment) {
    for (const input of assessment.requiredInputs.filter(
      (entry) => entry.required,
    )) {
      const fromFinding = latest?.evidence.find(
        (row) => row.inputId === input.id,
      );
      if (fromFinding) {
        evidence.push(
          fromFinding.present
            ? `${input.label}: on file${fromFinding.location ? ` (${fromFinding.location})` : ""}.`
            : `${input.label}: missing.`,
        );
      } else {
        evidence.push(
          `${input.label}: ${files.length > 0 || notes.trim() ? "see files or notes below." : "missing."}`,
        );
      }
    }
    for (const required of assessment.requiredEvidence) {
      evidence.push(
        `${required.label}: ${files.length > 0 ? "a file is attached." : "not attached yet."}`,
      );
    }
  }
  if (mode === "project") {
    if (notes.trim()) {
      evidence.push(`Note on file: ${notes.trim()}`);
    }
    if (files.length > 0) {
      evidence.push(
        `Files: ${files.map((file) => file.filename).join(", ")}.`,
      );
    }
    if (evidence.length === 0) {
      evidence.push("No note or file on this check yet.");
    }
  }

  const assessmentLines: string[] = [];
  if (mode === "template") {
    assessmentLines.push(
      ticked ? "Ticked on this phone as a quick reference." : "Not ticked yet.",
    );
  } else if (status) {
    assessmentLines.push(`Status: ${statusLabel(status)}.`);
  }
  if (latest) {
    assessmentLines.push(
      `Latest finding: ${findingResultLabel(latest.result)} — ${latest.summary}`,
    );
  }

  return {
    established,
    why: whyParts.join(" "),
    evidence,
    assessment: assessmentLines,
    method: assessment?.method.description,
    acceptanceCriteria: assessment?.method.acceptanceCriteria ?? [],
  };
}
