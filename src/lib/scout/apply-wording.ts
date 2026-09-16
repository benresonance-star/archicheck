import type { ScoutFinding, ScoutProposed } from "@/lib/scout/types";
import type { TemplateDocument } from "@/lib/types";

export function applyProposedToTemplate(
  template: TemplateDocument,
  finding: ScoutFinding,
  proposed: ScoutProposed,
): TemplateDocument {
  const next: TemplateDocument = structuredClone(template);
  if (finding.action === "add" && proposed.newItem) {
    next.items.push(proposed.newItem);
    return next;
  }

  const ids = finding.itemIds;
  if (ids.length === 0) {
    throw new Error("No checklist items to update");
  }

  let touched = 0;
  for (const targetId of ids) {
    const item = next.items.find((entry) => entry.id === targetId);
    if (!item) {
      continue;
    }
    touched += 1;
    if (proposed.title) {
      item.title = proposed.title;
    }
    if (proposed.detail) {
      item.detail = proposed.detail;
    }
    if (proposed.references) {
      item.references = proposed.references;
    }
    if (proposed.appliesTo) {
      item.appliesTo = proposed.appliesTo;
    }
  }
  if (touched === 0) {
    throw new Error("Checklist item is not in this template");
  }
  return next;
}
