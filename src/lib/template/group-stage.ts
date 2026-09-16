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
