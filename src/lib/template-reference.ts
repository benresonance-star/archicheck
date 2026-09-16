import { BUNDLED_TEMPLATE } from "@/lib/template/vic-residential";
import {
  itemsForTypology,
  TYPOLOGIES,
  type ChecklistItem,
  type Stage,
  type TemplateDocument,
  type Typology,
} from "@/lib/types";

export const TEMPLATE_REFERENCE_KEY = "vic-arch-checklist-template-reference";

export type TemplateTicks = Record<Typology, Record<string, boolean>>;

export type TemplateStageGroup = {
  stage: Stage;
  items: ChecklistItem[];
};

export function emptyTemplateTicks(): TemplateTicks {
  return { house: {}, townhouse: {}, apartment: {} };
}

export function parseTemplateTicks(raw: unknown): TemplateTicks {
  const next = emptyTemplateTicks();
  if (!raw || typeof raw !== "object") {
    return next;
  }
  const record = raw as Record<string, unknown>;
  for (const typology of TYPOLOGIES) {
    const bag = record[typology];
    if (!bag || typeof bag !== "object" || Array.isArray(bag)) {
      continue;
    }
    for (const [itemId, value] of Object.entries(bag as Record<string, unknown>)) {
      if (value === true && itemId) {
        next[typology][itemId] = true;
      }
    }
  }
  return next;
}

export function loadTemplateTicks(): TemplateTicks {
  if (typeof window === "undefined") {
    return emptyTemplateTicks();
  }
  try {
    const stored = window.localStorage.getItem(TEMPLATE_REFERENCE_KEY);
    if (!stored) {
      return emptyTemplateTicks();
    }
    return parseTemplateTicks(JSON.parse(stored));
  } catch {
    return emptyTemplateTicks();
  }
}

export function saveTemplateTicks(ticks: TemplateTicks): void {
  window.localStorage.setItem(TEMPLATE_REFERENCE_KEY, JSON.stringify(ticks));
}

export function groupedTemplateStages(
  template: TemplateDocument,
  typology: Typology,
): TemplateStageGroup[] {
  const items = itemsForTypology(template.items, typology);
  return template.stages
    .map((stage) => ({
      stage,
      items: items.filter((item) => item.stageId === stage.id),
    }))
    .filter((group) => group.items.length > 0);
}

export function referenceProgress(
  items: ChecklistItem[],
  ticks: Record<string, boolean>,
): { done: number; total: number } {
  return {
    done: items.filter((item) => ticks[item.id]).length,
    total: items.length,
  };
}

export function bundledItemsForTypology(typology: Typology): ChecklistItem[] {
  return itemsForTypology(BUNDLED_TEMPLATE.items, typology);
}
