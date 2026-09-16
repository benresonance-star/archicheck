import type { ScoutFinding, ScoutProposed } from "@/lib/scout/types";
import type {
  FindingDocument,
  ProjectDocument,
  SuggestedChecklistChange,
} from "@/lib/types";
import { validateFindingDocument } from "@/lib/validate";

export function applyFindingToAnswers(
  _project: ProjectDocument,
  _finding: FindingDocument,
): never {
  throw new Error(
    "Agent findings must not modify project answers. Record the finding separately and wait for a reviewer.",
  );
}

export function applyFindingToTemplate(
  _template: unknown,
  _finding: FindingDocument,
): never {
  throw new Error(
    "Agent findings must not modify approved requirements. Convert checklistIssue to a sourced proposal for human review.",
  );
}

export function appendFinding(
  project: ProjectDocument,
  finding: FindingDocument,
): ProjectDocument {
  validateFindingDocument(finding);
  if (project.findings?.some((entry) => entry.id === finding.id)) {
    throw new Error(`Finding ${finding.id} is already recorded`);
  }
  return {
    ...project,
    findings: [...(project.findings ?? []), finding],
  };
}

export function checklistIssueToSourcedProposal(finding: FindingDocument): {
  sourceTitle: string;
  sourceUrl: string;
  flag: string;
  itemIds: string[];
  detail: string;
} {
  const issue = finding.checklistIssue;
  if (!issue?.suggestedChange) {
    throw new Error("Finding has no suggested checklist change for review");
  }
  const change: SuggestedChecklistChange = issue.suggestedChange;
  const detail = change.detail?.trim();
  if (!detail) {
    throw new Error("Suggested checklist change needs proposed wording");
  }
  return {
    sourceTitle: `Agent checklist ${issue.kind}`,
    sourceUrl: "https://archicheck-gules.vercel.app/schema",
    flag: issue.detail,
    itemIds: [issue.itemId ?? finding.itemId],
    detail,
  };
}

export function checklistIssueToScoutFinding(
  finding: FindingDocument,
): { finding: ScoutFinding; proposed: ScoutProposed } {
  const proposal = checklistIssueToSourcedProposal(finding);
  const issue = finding.checklistIssue;
  if (!issue) {
    throw new Error("Finding has no checklist issue");
  }
  const proposed: ScoutProposed = {
    detail: proposal.detail,
    ...(issue.suggestedChange?.title ? { title: issue.suggestedChange.title } : {}),
    ...(issue.suggestedChange?.references
      ? { references: issue.suggestedChange.references }
      : {}),
  };
  const scoutFinding: ScoutFinding = {
    id: crypto.randomUUID(),
    sourceId: `finding-${finding.id}`,
    sourceTitle: proposal.sourceTitle,
    url: proposal.sourceUrl,
    scope: "statewide",
    action: "replace",
    itemIds: proposal.itemIds,
    flag: proposal.flag,
    proposed,
    confidence: "low",
    status: "open",
    hashChanged: false,
    baseline: false,
  };
  return { finding: scoutFinding, proposed };
}
