"use client";

import { useState } from "react";
import { toast } from "sonner";
import { TemplateCheckList } from "@/components/check-depths";
import {
  ChecklistItemForm,
  newSectionDraft,
} from "@/components/checklist-item-form";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  addItemToTemplate,
  buildChecklistItem,
  draftFromItem,
  reorderItemsAmongSiblings,
  newTemplateItemId,
  removeItemFromTemplate,
  updateItemInTemplate,
  type ChecklistItemDraft,
} from "@/lib/template/checklist-crud";
import type { OutputKind } from "@/lib/template/output-lens";
import type { ChecklistItem, TemplateDocument, Typology } from "@/lib/types";

export function ReferenceCheckList({
  items,
  ticks,
  onTicked,
  template,
  typology,
  section,
  onTemplate,
}: {
  items: ChecklistItem[];
  ticks: Record<string, boolean>;
  onTicked: (itemId: string, ticked: boolean) => void;
  template: TemplateDocument;
  typology: Typology;
  section: {
    stageId: string;
    deliverableId?: string;
    outputKind?: OutputKind;
  };
  onTemplate?: (next: TemplateDocument) => void;
}) {
  const [reorder, setReorder] = useState(false);
  const [editor, setEditor] = useState<
    { mode: "add" } | { mode: "edit"; itemId: string } | null
  >(null);
  const siblingIds = items.map((item) => item.id);
  const editingItem =
    editor?.mode === "edit"
      ? template.items.find((item) => item.id === editor.itemId)
      : undefined;
  const editable = onTemplate != null;

  function applyAdd(draft: ChecklistItemDraft) {
    if (!onTemplate) {
      return;
    }
    try {
      onTemplate(
        addItemToTemplate(
          template,
          buildChecklistItem({ id: newTemplateItemId(), draft }),
          siblingIds[siblingIds.length - 1],
        ),
      );
      setEditor(null);
      toast.success("Draft updated. Review and publish to affect new projects.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add");
    }
  }

  function applyEdit(itemId: string, draft: ChecklistItemDraft) {
    if (!onTemplate) {
      return;
    }
    try {
      onTemplate(updateItemInTemplate(template, itemId, draft));
      setEditor(null);
      toast.success("Draft updated. Review and publish to affect new projects.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save");
    }
  }

  return (
    <div className="space-y-2">
      {editable ? (
        <div className="flex justify-end">
          <Button
            type="button"
            variant={reorder ? "default" : "outline"}
            className="min-h-11"
            aria-pressed={reorder}
            onClick={() => setReorder((current) => !current)}
          >
            {reorder ? "Done reordering" : "Reorder / add"}
          </Button>
        </div>
      ) : null}
      <TemplateCheckList
        items={items}
        ticks={ticks}
        onTicked={onTicked}
        templateVersion={template.version}
        templateChecksum={template.checksum}
        reorder={editable && reorder}
        onReorder={(nextIds) => {
          if (!onTemplate) {
            return;
          }
          try {
            onTemplate(reorderItemsAmongSiblings(template, nextIds));
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Could not move");
          }
        }}
        onEditItem={
          editable
            ? (itemId) => setEditor({ mode: "edit", itemId })
            : undefined
        }
        trailing={
          editable && reorder ? (
            <Button
              type="button"
              variant="outline"
              className="min-h-11 w-full"
              onClick={() => setEditor({ mode: "add" })}
            >
              Add check to live template
            </Button>
          ) : null
        }
      />
      <Sheet
        open={editor != null}
        onOpenChange={(next) => {
          if (!next) {
            setEditor(null);
          }
        }}
      >
        <SheetContent
          side="bottom"
          className="h-[92dvh] max-h-[92dvh] gap-0 overflow-hidden rounded-t-2xl pb-[env(safe-area-inset-bottom)] md:inset-y-0 md:right-0 md:left-auto md:h-full md:max-h-none md:w-[28rem] md:max-w-none md:rounded-none md:border-t-0 md:border-l"
        >
          <SheetHeader className="border-b border-border pr-12">
            <SheetTitle>
              {editor?.mode === "edit" ? "Edit live check" : "Add live check"}
            </SheetTitle>
            <SheetDescription>
              Draft only. Review and publish to bump the live template. Existing
              jobs get an impact notice.
            </SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            {editor ? (
              <ChecklistItemForm
                key={editor.mode === "edit" ? editor.itemId : "add"}
                template={template}
                initial={
                  editor.mode === "edit" && editingItem
                    ? draftFromItem(editingItem)
                    : newSectionDraft({
                        stageId: section.stageId,
                        appliesTo: [typology],
                        deliverableId: section.deliverableId,
                        outputKind: section.outputKind,
                      })
                }
                submitLabel={
                  editor.mode === "edit" ? "Save draft" : "Add to draft"
                }
                onCancel={() => setEditor(null)}
                onSubmit={(draft) => {
                  if (editor.mode === "edit") {
                    applyEdit(editor.itemId, draft);
                  } else {
                    applyAdd(draft);
                  }
                }}
              />
            ) : null}
            {editor?.mode === "edit" ? (
              <Button
                type="button"
                variant="destructive"
                className="mt-3 min-h-11 w-full"
                onClick={() => {
                  if (!onTemplate || editor.mode !== "edit") {
                    return;
                  }
                  if (
                    !window.confirm(
                      "Remove this check from the live template draft?",
                    )
                  ) {
                    return;
                  }
                  try {
                    onTemplate(removeItemFromTemplate(template, editor.itemId));
                    setEditor(null);
                    toast.success("Removed from the draft.");
                  } catch (error) {
                    toast.error(
                      error instanceof Error ? error.message : "Could not remove",
                    );
                  }
                }}
              >
                Remove from draft
              </Button>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
