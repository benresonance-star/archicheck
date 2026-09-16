import type {
  ChecklistItem,
  StageDeliverable,
  TemplateDocument,
  Typology,
} from "@/lib/types";

export type StageDeliverableGroup = {
  deliverable: StageDeliverable;
  items: ChecklistItem[];
};

export type GroupedStageContent = {
  deliverables: StageDeliverableGroup[];
  processItems: ChecklistItem[];
};

export type StageContentSection =
  | { kind: "stage-checks"; items: ChecklistItem[] }
  | {
      kind: "deliverable";
      deliverable: StageDeliverable;
      items: ChecklistItem[];
    };

export function groupStageContent(
  template: TemplateDocument,
  stageId: string,
  typology: Typology,
  items: ChecklistItem[],
): GroupedStageContent {
  const deliverables = (template.deliverables ?? [])
    .filter(
      (deliverable) =>
        deliverable.stageId === stageId &&
        deliverable.appliesTo.includes(typology),
    )
    .map((deliverable) => ({
      deliverable,
      items: items.filter((entry) => entry.deliverableId === deliverable.id),
    }));
  return {
    deliverables,
    processItems: items.filter((entry) => !entry.deliverableId),
  };
}

export function stageContentSections(
  grouped: GroupedStageContent,
  options?: { includeEmptyStageChecks?: boolean },
): StageContentSection[] {
  const sections: StageContentSection[] = [];
  if (
    grouped.processItems.length > 0 ||
    options?.includeEmptyStageChecks
  ) {
    sections.push({ kind: "stage-checks", items: grouped.processItems });
  }
  for (const entry of grouped.deliverables) {
    sections.push({
      kind: "deliverable",
      deliverable: entry.deliverable,
      items: entry.items,
    });
  }
  return sections;
}
