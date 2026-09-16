"use client";

import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  CheckBrowseRow,
  ProjectRequirementBody,
  ProjectRequirementSheet,
} from "@/components/check-depths";
import {
  ChecklistItemForm,
  newSectionDraft,
} from "@/components/checklist-item-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { projectItemSignal } from "@/lib/check-depths";
import {
  addProjectItem,
  addAttachment,
  downloadBytes,
  moveProjectItem,
  proposeJobItemPromotion,
  readAttachment,
  removeProjectItem,
  setAnswer,
  updateProjectItem,
} from "@/lib/client-store";
import { draftFromItem, type ChecklistItemDraft } from "@/lib/template/checklist-crud";
import type { OutputKind } from "@/lib/template/output-lens";
import type {
  AttachmentMeta,
  ChecklistItem,
  ItemStatus,
  ProjectDocument,
  TemplateDocument,
} from "@/lib/types";
import { ITEM_STATUSES, isJobOnlyItem, statusLabel } from "@/lib/types";

export function AttachmentFileList({
  projectId,
  files,
}: {
  projectId: string;
  files: AttachmentMeta[];
}) {
  return (
    <ul className="space-y-1 text-sm">
      {files.map((file) => (
        <li key={file.id}>
          <button
            type="button"
            className="underline underline-offset-2"
            onClick={() => {
              void (async () => {
                const row = await readAttachment(projectId, file.id);
                downloadBytes(
                  file.filename,
                  new Uint8Array(row.bytes),
                  file.mimeType,
                );
              })();
            }}
          >
            {file.filename}
          </button>{" "}
          <span className="text-muted-foreground">({file.size} bytes)</span>
        </li>
      ))}
    </ul>
  );
}

function ProjectInspectActions({
  item,
  project,
  template,
  onWorkspace,
  onEdit,
}: {
  item: ChecklistItem;
  project: ProjectDocument;
  template: TemplateDocument;
  onWorkspace: (next: {
    project: ProjectDocument;
    template: TemplateDocument;
  }) => void;
  onEdit: () => void;
}) {
  const answer = project.answers[item.id];
  const status = answer?.status ?? "todo";
  const notes = answer?.notes ?? "";
  const files = project.attachments.filter((file) => file.itemId === item.id);
  const [pending, setPending] = useState(false);
  const jobOnly = isJobOnlyItem(item);

  async function save(patch: { status?: ItemStatus; notes?: string }) {
    setPending(true);
    try {
      const next = await setAnswer(project.id, item.id, patch);
      onWorkspace({ project: next, template });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save");
    } finally {
      setPending(false);
    }
  }

  async function upload(file: File) {
    setPending(true);
    try {
      const next = await addAttachment({
        projectId: project.id,
        itemId: item.id,
        filename: file.name,
        mimeType: file.type,
        bytes: new Uint8Array(await file.arrayBuffer()),
      });
      onWorkspace({ project: next, template });
      toast.success("Attachment stored in the project package");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setPending(false);
    }
  }

  async function remove() {
    if (
      !window.confirm(
        "Remove this check from this job? Notes and attachments stay in the ZIP.",
      )
    ) {
      return;
    }
    setPending(true);
    try {
      onWorkspace(
        await removeProjectItem({ projectId: project.id, itemId: item.id }),
      );
      toast.success("Check removed from this job");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not remove");
    } finally {
      setPending(false);
    }
  }

  return (
    <ProjectRequirementBody
      item={item}
      status={status}
      notes={notes}
      files={files}
      findings={project.findings}
      previousStatus={answer?.previousStatus}
      templateVersion={project.template.version}
      templateChecksum={project.template.checksum}
      pending={pending}
      actions={
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor={`${item.id}-status`}>Status</Label>
            <select
              id={`${item.id}-status`}
              className="min-h-11 w-full rounded-lg border border-input bg-background px-3 text-base dark:bg-input/30"
              value={status}
              disabled={pending}
              onChange={(event) => {
                void save({ status: event.target.value as ItemStatus });
              }}
            >
              {ITEM_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {statusLabel(value)}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor={`${item.id}-notes`}>Notes</Label>
            <Textarea
              id={`${item.id}-notes`}
              className="min-h-24 text-base"
              defaultValue={notes}
              disabled={pending}
              onBlur={(event) => {
                if (event.target.value !== notes) {
                  void save({ notes: event.target.value });
                }
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${item.id}-file`}>Attachments</Label>
            <input
              id={`${item.id}-file`}
              type="file"
              className="block w-full text-sm file:mr-3 file:min-h-11 file:rounded-lg file:border file:border-border file:bg-secondary file:px-3"
              disabled={pending}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void upload(file);
                }
                event.target.value = "";
              }}
            />
            {files.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No files on this item.
              </p>
            ) : (
              <AttachmentFileList projectId={project.id} files={files} />
            )}
          </div>
          <div className="grid grid-cols-1 gap-2">
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              disabled={pending}
              onClick={onEdit}
            >
              Edit this check
            </Button>
            {jobOnly ? (
              <PromoteJobItemForm
                projectId={project.id}
                itemId={item.id}
                pending={pending}
                setPending={setPending}
              />
            ) : null}
            <Button
              type="button"
              variant="destructive"
              className="min-h-11"
              disabled={pending}
              onClick={() => void remove()}
            >
              Remove from this job
            </Button>
          </div>
        </div>
      }
    />
  );
}

function PromoteJobItemForm({
  projectId,
  itemId,
  pending,
  setPending,
}: {
  projectId: string;
  itemId: string;
  pending: boolean;
  setPending: (value: boolean) => void;
}) {
  const [sourceTitle, setSourceTitle] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");

  async function promote() {
    setPending(true);
    try {
      await proposeJobItemPromotion({
        projectId,
        itemId,
        sourceTitle,
        sourceUrl,
      });
      setSourceTitle("");
      setSourceUrl("");
      toast.success("Proposed for the live template. A reviewer still publishes.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not propose");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
      <p className="text-sm font-medium">Propose for all projects</p>
      <p className="text-sm text-muted-foreground">
        Sends this job-only check to the statewide board. Publishing it later
        updates the live template; this job is not rewritten.
      </p>
      <Input
        className="min-h-11"
        placeholder="Source name"
        value={sourceTitle}
        disabled={pending}
        onChange={(event) => setSourceTitle(event.target.value)}
      />
      <Input
        className="min-h-11"
        placeholder="https://"
        value={sourceUrl}
        disabled={pending}
        onChange={(event) => setSourceUrl(event.target.value)}
      />
      <Button
        type="button"
        variant="outline"
        className="min-h-11 w-full"
        disabled={pending}
        onClick={() => void promote()}
      >
        Submit for review
      </Button>
    </div>
  );
}

export type ProjectCheckSection = {
  stageId: string;
  deliverableId?: string;
  outputKind?: OutputKind;
};

export function ProjectCheckList({
  items,
  project,
  template,
  section,
  onWorkspace,
}: {
  items: ChecklistItem[];
  project: ProjectDocument;
  template: TemplateDocument;
  section: ProjectCheckSection;
  onWorkspace: (next: {
    project: ProjectDocument;
    template: TemplateDocument;
  }) => void;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [reorder, setReorder] = useState(false);
  const [editor, setEditor] = useState<
    { mode: "add" } | { mode: "edit"; itemId: string } | null
  >(null);
  const [pending, setPending] = useState(false);
  const openItem = items.find((item) => item.id === openId);
  const siblingIds = items.map((item) => item.id);
  const editingItem =
    editor?.mode === "edit"
      ? (template.items.find((item) => item.id === editor.itemId) ??
        items.find((item) => item.id === editor.itemId))
      : undefined;

  async function add(draft: ChecklistItemDraft) {
    setPending(true);
    try {
      const next = await addProjectItem({
        projectId: project.id,
        draft,
        afterItemId: siblingIds[siblingIds.length - 1],
      });
      onWorkspace(next);
      setEditor(null);
      toast.success("Check added on this job only");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add");
    } finally {
      setPending(false);
    }
  }

  async function saveEdit(itemId: string, draft: ChecklistItemDraft) {
    setPending(true);
    try {
      onWorkspace(
        await updateProjectItem({
          projectId: project.id,
          itemId,
          patch: draft,
        }),
      );
      setEditor(null);
      toast.success("Check updated on this job");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save");
    } finally {
      setPending(false);
    }
  }

  async function move(itemId: string, direction: "up" | "down") {
    setPending(true);
    try {
      onWorkspace(
        await moveProjectItem({
          projectId: project.id,
          itemId,
          siblingIds,
          direction,
        }),
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not move");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
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
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No checks in this list yet.</p>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((item, index) => (
            <li key={item.id}>
              <CheckBrowseRow
                title={item.title}
                signal={projectItemSignal(item, project)}
                onInspect={() => setOpenId(item.id)}
                badge={
                  isJobOnlyItem(item) ? (
                    <Badge variant="secondary" className="shrink-0">
                      Job
                    </Badge>
                  ) : null
                }
                trailing={
                  reorder ? (
                    <span className="flex shrink-0 gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-11"
                        disabled={pending || index === 0}
                        aria-label={`Move ${item.title} up`}
                        onClick={() => void move(item.id, "up")}
                      >
                        <ChevronUpIcon />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-11"
                        disabled={pending || index === items.length - 1}
                        aria-label={`Move ${item.title} down`}
                        onClick={() => void move(item.id, "down")}
                      >
                        <ChevronDownIcon />
                      </Button>
                    </span>
                  ) : null
                }
              />
            </li>
          ))}
        </ul>
      )}
      {reorder ? (
        <Button
          type="button"
          variant="outline"
          className="min-h-11 w-full"
          onClick={() => setEditor({ mode: "add" })}
        >
          Add check to this job
        </Button>
      ) : null}
      <ProjectRequirementSheet
        item={openItem}
        items={items}
        open={openItem != null && editor == null}
        onClose={() => setOpenId(null)}
        onSelect={setOpenId}
      >
        {openItem ? (
          <ProjectInspectActions
            key={openItem.id}
            item={openItem}
            project={project}
            template={template}
            onWorkspace={(next) => {
              onWorkspace(next);
              if (!next.template.items.some((entry) => entry.id === openItem.id)) {
                setOpenId(null);
              }
            }}
            onEdit={() => setEditor({ mode: "edit", itemId: openItem.id })}
          />
        ) : null}
      </ProjectRequirementSheet>
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
              {editor?.mode === "edit" ? "Edit check" : "Add check"}
            </SheetTitle>
            <SheetDescription>
              Changes apply to this job only. Existing projects keep their own
              snapshot until they adopt a published template.
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
                        appliesTo: [project.site.typology],
                        deliverableId: section.deliverableId,
                        outputKind: section.outputKind,
                      })
                }
                submitLabel={editor.mode === "edit" ? "Save on this job" : "Add to this job"}
                pending={pending}
                onCancel={() => setEditor(null)}
                onSubmit={(draft) => {
                  if (editor.mode === "edit") {
                    void saveEdit(editor.itemId, draft);
                  } else {
                    void add(draft);
                  }
                }}
              />
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
