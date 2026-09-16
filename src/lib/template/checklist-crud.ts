import type { OutputKind } from "@/lib/template/output-lens";
import {
  TYPOLOGIES,
  type ChecklistItem,
  type ChecklistResource,
  type TemplateDocument,
  type TemplateItemChange,
  type Typology,
  assertNever,
  changeKind,
} from "@/lib/types";

export type ChecklistItemDraft = {
  title: string;
  detail: string;
  references: string[];
  resources: ChecklistResource[];
  required: boolean;
  appliesTo: Typology[];
  stageId: string;
  deliverableId?: string;
  outputKind?: OutputKind;
};

export type ChecklistItemPatch = Partial<ChecklistItemDraft>;

export type MoveDirection = "up" | "down";

export function newJobItemId(): string {
  return `job-${crypto.randomUUID()}`;
}

export function newTemplateItemId(): string {
  return `tpl-${crypto.randomUUID()}`;
}

export function draftFromItem(item: ChecklistItem): ChecklistItemDraft {
  return {
    title: item.title,
    detail: item.detail,
    references: [...item.references],
    resources: item.resources.map((entry) => ({ ...entry })),
    required: item.required,
    appliesTo: [...item.appliesTo],
    stageId: item.stageId,
    deliverableId: item.deliverableId,
    outputKind: item.outputKind as OutputKind | undefined,
  };
}

export function emptyItemDraft(input: {
  stageId: string;
  appliesTo: Typology[];
  deliverableId?: string;
  outputKind?: OutputKind;
}): ChecklistItemDraft {
  return {
    title: "",
    detail: "",
    references: [],
    resources: [],
    required: true,
    appliesTo: input.appliesTo.length > 0 ? [...input.appliesTo] : [...TYPOLOGIES],
    stageId: input.stageId,
    deliverableId: input.deliverableId,
    outputKind: input.outputKind,
  };
}

export function parseLineList(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function parseResourceLines(value: string): ChecklistResource[] {
  return parseLineList(value).map((line) => {
    const cut = line.indexOf("|");
    if (cut === -1) {
      return { label: line, url: line };
    }
    return {
      label: line.slice(0, cut).trim() || line.slice(cut + 1).trim(),
      url: line.slice(cut + 1).trim(),
    };
  });
}

export function resourceLines(resources: ChecklistResource[]): string {
  return resources
    .map((entry) =>
      entry.label === entry.url ? entry.url : `${entry.label} | ${entry.url}`,
    )
    .join("\n");
}

export function validateItemDraft(draft: ChecklistItemDraft): ChecklistItemDraft {
  const title = draft.title.trim();
  if (!title) {
    throw new Error("Give the check a title");
  }
  const appliesTo = TYPOLOGIES.filter((typology) =>
    draft.appliesTo.includes(typology),
  );
  if (appliesTo.length === 0) {
    throw new Error("Tick at least one typology");
  }
  const references = draft.references.map((entry) => entry.trim()).filter(Boolean);
  const resources = draft.resources
    .map((entry) => ({
      label: entry.label.trim(),
      url: entry.url.trim(),
    }))
    .filter((entry) => entry.label || entry.url);
  for (const resource of resources) {
    if (!resource.label) {
      throw new Error("Each resource needs a label");
    }
    if (!resource.url.startsWith("https://")) {
      throw new Error("Resource links must start with https://");
    }
  }
  const stageId = draft.stageId.trim();
  if (!stageId) {
    throw new Error("Pick an ARBV stage");
  }
  return {
    title,
    detail: draft.detail.trim(),
    references,
    resources,
    required: draft.required,
    appliesTo,
    stageId,
    deliverableId: draft.deliverableId?.trim() || undefined,
    outputKind: draft.outputKind,
  };
}

export function buildChecklistItem(input: {
  id: string;
  draft: ChecklistItemDraft;
  grokbotId?: string;
}): ChecklistItem {
  const draft = validateItemDraft(input.draft);
  return {
    id: input.id,
    stageId: draft.stageId,
    title: draft.title,
    detail: draft.detail,
    appliesTo: draft.appliesTo,
    required: draft.required,
    references: draft.references,
    resources: draft.resources,
    grokbotId: input.grokbotId ?? `bot-${draft.stageId}`,
    ...(draft.deliverableId ? { deliverableId: draft.deliverableId } : {}),
    ...(draft.outputKind ? { outputKind: draft.outputKind } : {}),
  };
}

export function addItemToTemplate(
  template: TemplateDocument,
  item: ChecklistItem,
  afterItemId?: string,
): TemplateDocument {
  if (template.items.some((entry) => entry.id === item.id)) {
    throw new Error(`Checklist item ${item.id} is already in this template`);
  }
  if (!template.stages.some((stage) => stage.id === item.stageId)) {
    throw new Error("That ARBV stage is not in this template");
  }
  const next = structuredClone(template);
  if (!afterItemId) {
    next.items.push(item);
    return next;
  }
  const index = next.items.findIndex((entry) => entry.id === afterItemId);
  if (index === -1) {
    next.items.push(item);
    return next;
  }
  next.items.splice(index + 1, 0, item);
  return next;
}

export function updateItemInTemplate(
  template: TemplateDocument,
  itemId: string,
  patch: ChecklistItemPatch,
): TemplateDocument {
  const next = structuredClone(template);
  const item = next.items.find((entry) => entry.id === itemId);
  if (!item) {
    throw new Error("Checklist item is not in this template");
  }
  const draft = validateItemDraft({
    ...draftFromItem(item),
    ...patch,
  });
  if (!next.stages.some((stage) => stage.id === draft.stageId)) {
    throw new Error("That ARBV stage is not in this template");
  }
  item.title = draft.title;
  item.detail = draft.detail;
  item.references = draft.references;
  item.resources = draft.resources;
  item.required = draft.required;
  item.appliesTo = draft.appliesTo;
  item.stageId = draft.stageId;
  if (draft.deliverableId) {
    item.deliverableId = draft.deliverableId;
  } else {
    delete item.deliverableId;
  }
  if (draft.outputKind) {
    item.outputKind = draft.outputKind;
  } else {
    delete item.outputKind;
  }
  return next;
}

export function removeItemFromTemplate(
  template: TemplateDocument,
  itemId: string,
): TemplateDocument {
  if (!template.items.some((entry) => entry.id === itemId)) {
    throw new Error("Checklist item is not in this template");
  }
  if (template.items.length <= 1) {
    throw new Error("A template must keep at least one check");
  }
  const next = structuredClone(template);
  next.items = next.items.filter((entry) => entry.id !== itemId);
  return next;
}

export function moveItemAmongSiblings(
  template: TemplateDocument,
  siblingIds: string[],
  itemId: string,
  direction: MoveDirection,
): TemplateDocument {
  const present = siblingIds.filter((id) =>
    template.items.some((entry) => entry.id === id),
  );
  const position = present.indexOf(itemId);
  if (position === -1) {
    throw new Error("Checklist item is not in this list");
  }
  const swapWith = direction === "up" ? position - 1 : position + 1;
  if (swapWith < 0 || swapWith >= present.length) {
    return structuredClone(template);
  }
  const nextOrder = [...present];
  const current = nextOrder[position];
  const neighbour = nextOrder[swapWith];
  if (!current || !neighbour) {
    return structuredClone(template);
  }
  nextOrder[position] = neighbour;
  nextOrder[swapWith] = current;
  return reorderSiblingSlots(template, nextOrder);
}

export function arrayMove<T>(list: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) {
    return list;
  }
  const next = [...list];
  const [entry] = next.splice(from, 1);
  if (entry === undefined) {
    return list;
  }
  next.splice(to, 0, entry);
  return next;
}

export function siblingOrder(template: TemplateDocument, siblingIds: string[]): string[] {
  return template.items
    .filter((item) => siblingIds.includes(item.id))
    .map((item) => item.id);
}

export function reorderItemsAmongSiblings(
  template: TemplateDocument,
  nextOrder: string[],
): TemplateDocument {
  const present = nextOrder.filter((id) =>
    template.items.some((entry) => entry.id === id),
  );
  if (present.length === 0) {
    return structuredClone(template);
  }
  const current = siblingOrder(template, present);
  if (current.join("\n") === present.join("\n")) {
    return structuredClone(template);
  }
  return reorderSiblingSlots(template, present);
}

function reorderSiblingSlots(
  template: TemplateDocument,
  nextOrder: string[],
): TemplateDocument {
  const byId = new Map(template.items.map((item) => [item.id, item]));
  const queue = [...nextOrder];
  return {
    ...structuredClone(template),
    items: template.items.map((item) => {
      if (!nextOrder.includes(item.id)) {
        return structuredClone(item);
      }
      const nextId = queue.shift();
      const nextItem = nextId ? byId.get(nextId) : undefined;
      if (!nextItem) {
        return structuredClone(item);
      }
      return structuredClone(nextItem);
    }),
  };
}

export function bumpJobVersion(version: string): string {
  const match = version.match(/^(.*)-job\.(\d+)$/);
  if (match) {
    return `${match[1]}-job.${Number(match[2]) + 1}`;
  }
  const base = version.replace(/-draft\.\d+$/, "");
  return `${base}-job.1`;
}

function sameStringList(left: string[] | undefined, right: string[] | undefined): boolean {
  return (left ?? []).join("\n") === (right ?? []).join("\n");
}

function sameResources(
  left: ChecklistResource[] | undefined,
  right: ChecklistResource[] | undefined,
): boolean {
  return JSON.stringify(left ?? []) === JSON.stringify(right ?? []);
}

function itemToChangeBase(item: ChecklistItem): Pick<
  TemplateItemChange,
  | "itemId"
  | "title"
  | "beforeTitle"
  | "afterTitle"
  | "beforeDetail"
  | "afterDetail"
  | "beforeReferences"
  | "afterReferences"
> {
  return {
    itemId: item.id,
    title: item.title,
    beforeTitle: item.title,
    afterTitle: item.title,
    beforeDetail: item.detail,
    afterDetail: item.detail,
    beforeReferences: [...item.references],
    afterReferences: [...item.references],
  };
}

export function changeFromAddedItem(
  item: ChecklistItem,
  index: number,
): TemplateItemChange {
  return {
    ...itemToChangeBase(item),
    kind: "add",
    beforeTitle: "",
    beforeDetail: "",
    beforeReferences: [],
    afterStageId: item.stageId,
    afterDeliverableId: item.deliverableId ?? null,
    afterRequired: item.required,
    afterAppliesTo: [...item.appliesTo],
    afterResources: item.resources.map((entry) => ({ ...entry })),
    afterOutputKind: item.outputKind ?? null,
    afterIndex: index,
  };
}

export function changeFromRemovedItem(
  item: ChecklistItem,
  index: number,
): TemplateItemChange {
  return {
    ...itemToChangeBase(item),
    kind: "remove",
    afterTitle: "",
    afterDetail: "",
    afterReferences: [],
    beforeStageId: item.stageId,
    beforeDeliverableId: item.deliverableId ?? null,
    beforeRequired: item.required,
    beforeAppliesTo: [...item.appliesTo],
    beforeResources: item.resources.map((entry) => ({ ...entry })),
    beforeOutputKind: item.outputKind ?? null,
    beforeIndex: index,
  };
}

export function diffTemplateItems(
  before: TemplateDocument,
  after: TemplateDocument,
): TemplateItemChange[] {
  const beforeById = new Map(before.items.map((item) => [item.id, item]));
  const afterById = new Map(after.items.map((item) => [item.id, item]));
  const changes: TemplateItemChange[] = [];

  after.items.forEach((item, index) => {
    if (!beforeById.has(item.id)) {
      changes.push(changeFromAddedItem(item, index));
    }
  });
  before.items.forEach((item, index) => {
    if (!afterById.has(item.id)) {
      changes.push(changeFromRemovedItem(item, index));
    }
  });
  after.items.forEach((item, afterIndex) => {
    const previous = beforeById.get(item.id);
    if (!previous) {
      return;
    }
    const beforeIndex = before.items.findIndex((entry) => entry.id === item.id);
    const fieldChanged =
      previous.title !== item.title ||
      previous.detail !== item.detail ||
      !sameStringList(previous.references, item.references) ||
      previous.stageId !== item.stageId ||
      (previous.deliverableId ?? "") !== (item.deliverableId ?? "") ||
      previous.required !== item.required ||
      !sameStringList(previous.appliesTo, item.appliesTo) ||
      !sameResources(previous.resources, item.resources) ||
      (previous.outputKind ?? "") !== (item.outputKind ?? "");
    const moved = beforeIndex !== afterIndex;
    if (!fieldChanged && !moved) {
      return;
    }
    changes.push({
      itemId: item.id,
      title: item.title,
      kind: fieldChanged ? "edit" : "move",
      beforeTitle: previous.title,
      afterTitle: item.title,
      beforeDetail: previous.detail,
      afterDetail: item.detail,
      beforeReferences: [...previous.references],
      afterReferences: [...item.references],
      beforeStageId: previous.stageId,
      afterStageId: item.stageId,
      beforeDeliverableId: previous.deliverableId ?? null,
      afterDeliverableId: item.deliverableId ?? null,
      beforeRequired: previous.required,
      afterRequired: item.required,
      beforeAppliesTo: [...previous.appliesTo],
      afterAppliesTo: [...item.appliesTo],
      beforeResources: previous.resources.map((entry) => ({ ...entry })),
      afterResources: item.resources.map((entry) => ({ ...entry })),
      beforeOutputKind: previous.outputKind ?? null,
      afterOutputKind: item.outputKind ?? null,
      beforeIndex,
      afterIndex,
    });
  });
  return changes;
}

export function applyItemChangeToTemplate(
  template: TemplateDocument,
  change: TemplateItemChange,
  published?: TemplateDocument,
): TemplateDocument {
  const next = structuredClone(template);
  const kind = changeKind(change);
  switch (kind) {
    case "add": {
      if (next.items.some((entry) => entry.id === change.itemId)) {
        applyFieldsToItem(
          next.items.find((entry) => entry.id === change.itemId),
          change,
        );
        return next;
      }
      const publishedItem = published?.items.find(
        (entry) => entry.id === change.itemId,
      );
      const item = publishedItem
        ? structuredClone(publishedItem)
        : itemFromChange(change);
      if (typeof change.afterIndex === "number") {
        next.items.splice(change.afterIndex, 0, item);
      } else {
        next.items.push(item);
      }
      return next;
    }
    case "remove": {
      next.items = next.items.filter((entry) => entry.id !== change.itemId);
      return next;
    }
    case "move": {
      const currentIndex = next.items.findIndex(
        (entry) => entry.id === change.itemId,
      );
      if (currentIndex === -1 || typeof change.afterIndex !== "number") {
        return next;
      }
      const [moved] = next.items.splice(currentIndex, 1);
      if (!moved) {
        return next;
      }
      const insertAt = Math.max(
        0,
        Math.min(change.afterIndex, next.items.length),
      );
      next.items.splice(insertAt, 0, moved);
      return next;
    }
    case "wording":
    case "edit": {
      let item = next.items.find((entry) => entry.id === change.itemId);
      if (!item) {
        const publishedItem = published?.items.find(
          (entry) => entry.id === change.itemId,
        );
        if (!publishedItem) {
          throw new Error(
            `Checklist item ${change.itemId} is not in the published template`,
          );
        }
        item = structuredClone(publishedItem);
        next.items.push(item);
      }
      applyFieldsToItem(item, change);
      return next;
    }
    default:
      return assertNever(kind, `Unknown template change: ${String(kind)}`);
  }
}

function itemFromChange(change: TemplateItemChange): ChecklistItem {
  return buildChecklistItem({
    id: change.itemId,
    draft: {
      title: change.afterTitle || change.title,
      detail: change.afterDetail,
      references: change.afterReferences,
      resources: change.afterResources ?? [],
      required: change.afterRequired ?? true,
      appliesTo: change.afterAppliesTo ?? [...TYPOLOGIES],
      stageId: change.afterStageId ?? "pre-design",
      deliverableId: change.afterDeliverableId ?? undefined,
      outputKind: (change.afterOutputKind ?? undefined) as OutputKind | undefined,
    },
  });
}

function applyFieldsToItem(
  item: ChecklistItem | undefined,
  change: TemplateItemChange,
): void {
  if (!item) {
    return;
  }
  item.title = change.afterTitle;
  item.detail = change.afterDetail;
  item.references = [...change.afterReferences];
  if (change.afterStageId) {
    item.stageId = change.afterStageId;
  }
  if (change.afterDeliverableId !== undefined) {
    if (change.afterDeliverableId) {
      item.deliverableId = change.afterDeliverableId;
    } else {
      delete item.deliverableId;
    }
  }
  if (change.afterRequired !== undefined) {
    item.required = change.afterRequired;
  }
  if (change.afterAppliesTo) {
    item.appliesTo = [...change.afterAppliesTo];
  }
  if (change.afterResources) {
    item.resources = change.afterResources.map((entry) => ({ ...entry }));
  }
  if (change.afterOutputKind !== undefined) {
    if (change.afterOutputKind) {
      item.outputKind = change.afterOutputKind;
    } else {
      delete item.outputKind;
    }
  }
}

export function changeNeedsRecheck(change: TemplateItemChange): boolean {
  const kind = changeKind(change);
  switch (kind) {
    case "move":
    case "remove":
      return false;
    case "wording":
    case "add":
    case "edit":
      return true;
    default:
      return assertNever(kind, `Unknown template change: ${String(kind)}`);
  }
}

export function promoteItemCopy(item: ChecklistItem): ChecklistItem {
  return {
    ...structuredClone(item),
    id: newTemplateItemId(),
  };
}
