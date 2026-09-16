"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { addAttachment } from "@/lib/client-store";
import { editListClass } from "@/components/checklist-edit-toggle";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { projectListRollup } from "@/lib/check-depths";
import { Label } from "@/components/ui/label";
import { GrokbotPanel } from "@/components/grokbot-panel";
import {
  DeliverableHeading,
  StageChecksHeading,
} from "@/components/deliverable-heading";
import {
  AttachmentFileList,
  ProjectCheckList,
} from "@/components/checklist-item-card";
import {
  groupStageContent,
  stageContentSections,
} from "@/lib/template/group-stage";
import {
  assertNever,
  itemsForTypology,
  type ChecklistItem,
  type GrokBotBrief,
  type ProjectDocument,
  type Stage,
  type StageDeliverable,
  type TemplateDocument,
} from "@/lib/types";

export function StageChecklist({
  project,
  template,
  stage,
  grokbot,
  prevHref,
  nextHref,
  editing = false,
  onWorkspace,
}: {
  project: ProjectDocument;
  template: TemplateDocument;
  stage: Stage;
  grokbot?: GrokBotBrief;
  prevHref?: string;
  nextHref?: string;
  editing?: boolean;
  onWorkspace?: (next: {
    project: ProjectDocument;
    template: TemplateDocument;
  }) => void;
}) {
  const router = useRouter();
  const [workspace, setWorkspace] = useState({ project, template });
  const items = itemsForTypology(
    workspace.template.items,
    workspace.project.site.typology,
  ).filter((item) => item.stageId === stage.id);
  const grouped = groupStageContent(
    workspace.template,
    stage.id,
    workspace.project.site.typology,
    items,
  );

  function apply(next: { project: ProjectDocument; template: TemplateDocument }) {
    setWorkspace(next);
    onWorkspace?.(next);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {prevHref ? (
          <Button variant="outline" className="min-h-11" asChild>
            <a href={prevHref}>Previous stage</a>
          </Button>
        ) : null}
        {nextHref ? (
          <Button variant="outline" className="min-h-11" asChild>
            <a href={nextHref}>Next stage</a>
          </Button>
        ) : null}
      </div>
      {stageContentSections(grouped, { includeEmptyStageChecks: editing }).map(
        (section) => {
          switch (section.kind) {
            case "stage-checks":
              return (
                <div
                  key="stage-checks"
                  className={cn(
                    "space-y-3 rounded-2xl border p-3",
                    editListClass(editing),
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <StageChecksHeading />
                    <Badge variant="outline" className="shrink-0">
                      {projectListRollup(section.items, workspace.project)}
                    </Badge>
                  </div>
                  <ProjectCheckList
                    items={section.items}
                    project={workspace.project}
                    template={workspace.template}
                    section={{ stageId: stage.id }}
                    editing={editing}
                    onWorkspace={apply}
                  />
                </div>
              );
            case "deliverable":
              return (
                <DeliverableProjectBlock
                  key={section.deliverable.id}
                  deliverable={section.deliverable}
                  items={section.items}
                  project={workspace.project}
                  template={workspace.template}
                  editing={editing}
                  onWorkspace={apply}
                />
              );
            default:
              return assertNever(
                section,
                `Unknown stage section: ${String(section)}`,
              );
          }
        },
      )}
      {grokbot ? (
        <GrokbotPanel bot={grokbot} project={workspace.project} stage={stage} />
      ) : null}
    </div>
  );
}

function DeliverableProjectBlock({
  deliverable,
  items,
  project,
  template,
  editing,
  onWorkspace,
}: {
  deliverable: StageDeliverable;
  items: ChecklistItem[];
  project: ProjectDocument;
  template: TemplateDocument;
  editing: boolean;
  onWorkspace: (next: {
    project: ProjectDocument;
    template: TemplateDocument;
  }) => void;
}) {
  const files = project.attachments.filter(
    (file) => file.deliverableId === deliverable.id,
  );
  const [pending, setPending] = useState(false);

  async function upload(file: File) {
    setPending(true);
    try {
      const next = await addAttachment({
        projectId: project.id,
        itemId: null,
        deliverableId: deliverable.id,
        filename: file.name,
        mimeType: file.type,
        bytes: new Uint8Array(await file.arrayBuffer()),
      });
      onWorkspace({ project: next, template });
      toast.success("Drawing or document stored on this stage");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div
      className={cn(
        "space-y-3 rounded-2xl border p-3",
        editListClass(editing),
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <DeliverableHeading deliverable={deliverable} />
        <Badge variant="outline" className="shrink-0">
          {projectListRollup(items, project)}
        </Badge>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${deliverable.id}-file`}>File on this stage</Label>
        <input
          id={`${deliverable.id}-file`}
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
            No file stored yet. PDF or image of the drawing or document.
          </p>
        ) : (
          <AttachmentFileList projectId={project.id} files={files} />
        )}
      </div>
      <ProjectCheckList
        items={items}
        project={project}
        template={template}
        section={{
          stageId: deliverable.stageId,
          deliverableId: deliverable.id,
        }}
        editing={editing}
        onWorkspace={onWorkspace}
      />
    </div>
  );
}
