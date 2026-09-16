"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { addAttachment } from "@/lib/client-store";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { GrokbotPanel } from "@/components/grokbot-panel";
import { DeliverableHeading } from "@/components/deliverable-heading";
import {
  AttachmentFileList,
  ChecklistItemCard,
} from "@/components/checklist-item-card";
import type {
  ChecklistItem,
  GrokBotBrief,
  ProjectDocument,
  Stage,
  StageDeliverable,
  TemplateDocument,
} from "@/lib/types";
import { groupStageContent } from "@/lib/template/group-stage";

export function StageChecklist({
  project,
  template,
  stage,
  items,
  grokbot,
  prevHref,
  nextHref,
}: {
  project: ProjectDocument;
  template: TemplateDocument;
  stage: Stage;
  items: ChecklistItem[];
  grokbot?: GrokBotBrief;
  prevHref?: string;
  nextHref?: string;
}) {
  const router = useRouter();
  const [local, setLocal] = useState(project);
  const grouped = groupStageContent(
    template,
    stage.id,
    local.site.typology,
    items,
  );

  function onProject(next: ProjectDocument) {
    setLocal(next);
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
      {items.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No items for this typology</CardTitle>
            <CardDescription>
              This stage has no {local.site.typology} items in template{" "}
              {template.version}.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          {grouped.deliverables.map((entry) => (
            <DeliverableProjectBlock
              key={entry.deliverable.id}
              deliverable={entry.deliverable}
              items={entry.items}
              project={local}
              onProject={onProject}
            />
          ))}
          {grouped.processItems.length > 0 ? (
            <div className="space-y-3">
              <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Stage checks
              </h2>
              {grouped.processItems.map((item) => (
                <ChecklistItemCard
                  key={item.id}
                  item={item}
                  project={local}
                  onProject={onProject}
                />
              ))}
            </div>
          ) : null}
        </>
      )}
      {grokbot ? (
        <GrokbotPanel bot={grokbot} project={local} stage={stage} />
      ) : null}
    </div>
  );
}

function DeliverableProjectBlock({
  deliverable,
  items,
  project,
  onProject,
}: {
  deliverable: StageDeliverable;
  items: ChecklistItem[];
  project: ProjectDocument;
  onProject: (project: ProjectDocument) => void;
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
      onProject(next);
      toast.success("Drawing or document stored on this stage");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-muted/30 p-3">
      <DeliverableHeading deliverable={deliverable} />
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
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Associated checklist
      </p>
      {items.map((item) => (
        <ChecklistItemCard
          key={item.id}
          item={item}
          project={project}
          onProject={onProject}
        />
      ))}
    </div>
  );
}
