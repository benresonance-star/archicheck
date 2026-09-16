import type {
  ChecklistItem,
  ItemAssessment,
  RequirementKind,
  TemplateDocument,
  TemplateRef,
  Typology,
} from "@/lib/types";
import { isRequirementKind, isTypology } from "@/lib/types";
import {
  isOutputKind,
  outputKindForItem,
  type OutputKind,
} from "@/lib/template/output-lens";

export type ChecklistQuery = {
  typology?: Typology;
  stageId?: string;
  deliverableId?: string;
  elementType?: string;
  requirementKind?: RequirementKind;
  outputKind?: OutputKind;
  itemIds?: string[];
  availableInputs?: Record<string, boolean | string | number | null>;
};

export type MissingInput = {
  id: string;
  label: string;
  kind: ItemAssessment["requiredInputs"][number]["kind"];
};

export type MissingInformation = {
  itemId: string;
  title: string;
  missingInputs: MissingInput[];
  missingEvidence: MissingInput[];
  humanReviewRequired: boolean;
  humanReviewReason?: string;
};

export type UnstructuredItem = {
  itemId: string;
  title: string;
  stageId: string;
};

export type ChecklistQueryResult = {
  template: TemplateRef;
  items: ChecklistItem[];
  missingInformation: MissingInformation[];
  unstructuredItems: UnstructuredItem[];
};

function inputIsPresent(
  available: Record<string, boolean | string | number | null> | undefined,
  id: string,
): boolean {
  if (!available) {
    return false;
  }
  if (!(id in available)) {
    return false;
  }
  const value = available[id];
  if (value === false || value === null || value === "") {
    return false;
  }
  return true;
}

export function parseChecklistQuery(
  params: Record<string, string | string[] | undefined>,
): ChecklistQuery {
  const first = (key: string): string | undefined => {
    const value = params[key];
    if (Array.isArray(value)) {
      return value[0];
    }
    return value;
  };
  const all = (key: string): string[] => {
    const value = params[key];
    if (value === undefined) {
      return [];
    }
    return Array.isArray(value) ? value : [value];
  };

  const typologyRaw = first("typology");
  const requirementKindRaw = first("requirementKind");
  const outputKindRaw = first("outputKind");
  const available: Record<string, boolean> = {};
  for (const id of all("input")) {
    if (id) {
      available[id] = true;
    }
  }

  return {
    ...(typologyRaw && isTypology(typologyRaw) ? { typology: typologyRaw } : {}),
    ...(first("stageId") ? { stageId: first("stageId") } : {}),
    ...(first("deliverableId") ? { deliverableId: first("deliverableId") } : {}),
    ...(first("elementType") ? { elementType: first("elementType") } : {}),
    ...(requirementKindRaw && isRequirementKind(requirementKindRaw)
      ? { requirementKind: requirementKindRaw }
      : {}),
    ...(outputKindRaw && isOutputKind(outputKindRaw)
      ? { outputKind: outputKindRaw }
      : {}),
    ...(all("itemId").length > 0 ? { itemIds: all("itemId") } : {}),
    ...(Object.keys(available).length > 0 ? { availableInputs: available } : {}),
  };
}

export function queryChecklistItems(
  template: TemplateDocument,
  query: ChecklistQuery = {},
): ChecklistQueryResult {
  const items = template.items.filter((item) => {
    if (query.typology && !item.appliesTo.includes(query.typology)) {
      return false;
    }
    if (query.stageId && item.stageId !== query.stageId) {
      return false;
    }
    if (query.deliverableId && item.deliverableId !== query.deliverableId) {
      return false;
    }
    if (query.itemIds && query.itemIds.length > 0 && !query.itemIds.includes(item.id)) {
      return false;
    }
    if (query.elementType) {
      const types = item.assessment?.applicability.elementTypes ?? [];
      if (!types.includes(query.elementType)) {
        return false;
      }
    }
    if (query.requirementKind) {
      if (item.assessment?.requirement.kind !== query.requirementKind) {
        return false;
      }
    }
    if (query.outputKind && outputKindForItem(item) !== query.outputKind) {
      return false;
    }
    return true;
  });

  const missingInformation: MissingInformation[] = [];
  const unstructuredItems: UnstructuredItem[] = [];

  for (const item of items) {
    if (!item.assessment) {
      unstructuredItems.push({
        itemId: item.id,
        title: item.title,
        stageId: item.stageId,
      });
      continue;
    }
    const missingInputs = item.assessment.requiredInputs
      .filter((input) => input.required && !inputIsPresent(query.availableInputs, input.id))
      .map((input) => ({
        id: input.id,
        label: input.label,
        kind: input.kind,
      }));
    const missingEvidence = item.assessment.requiredEvidence
      .filter((entry) => !inputIsPresent(query.availableInputs, entry.id))
      .map((entry) => ({
        id: entry.id,
        label: entry.label,
        kind: entry.kind,
      }));
    if (
      missingInputs.length > 0 ||
      missingEvidence.length > 0 ||
      item.assessment.humanReview.required
    ) {
      missingInformation.push({
        itemId: item.id,
        title: item.title,
        missingInputs,
        missingEvidence,
        humanReviewRequired: item.assessment.humanReview.required,
        humanReviewReason: item.assessment.humanReview.reason,
      });
    }
  }

  return {
    template: {
      id: template.id,
      version: template.version,
      checksum: template.checksum,
    },
    items,
    missingInformation,
    unstructuredItems,
  };
}
