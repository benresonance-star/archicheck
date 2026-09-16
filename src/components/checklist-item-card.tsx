"use client";

import { useState } from "react";
import { toast } from "sonner";
import { addAttachment, downloadBytes, readAttachment, setAnswer } from "@/lib/client-store";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ItemResources } from "@/components/item-resources";
import { SourceCitations } from "@/components/source-citations";
import { ItemAssessmentNote } from "@/components/item-assessment-note";
import type {
  AttachmentMeta,
  ChecklistItem,
  ItemStatus,
  ProjectDocument,
} from "@/lib/types";
import { ITEM_STATUSES, statusLabel } from "@/lib/types";

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

export function ChecklistItemCard({
  item,
  project,
  onProject,
}: {
  item: ChecklistItem;
  project: ProjectDocument;
  onProject: (project: ProjectDocument) => void;
}) {
  const answer = project.answers[item.id];
  const status = answer?.status ?? "todo";
  const notes = answer?.notes ?? "";
  const files = project.attachments.filter((file) => file.itemId === item.id);
  const [pending, setPending] = useState(false);

  async function save(patch: { status?: ItemStatus; notes?: string }) {
    setPending(true);
    try {
      const next = await setAnswer(project.id, item.id, patch);
      onProject(next);
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
      onProject(next);
      toast.success("Attachment stored in the project package");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg leading-snug">{item.title}</CardTitle>
          <div className="flex shrink-0 flex-wrap justify-end gap-1">
            {status === "needs_recheck" ? (
              <Badge variant="destructive">Needs recheck</Badge>
            ) : null}
            {item.required ? <Badge>Required</Badge> : <Badge variant="outline">Optional</Badge>}
          </div>
        </div>
        <CardDescription>{item.detail}</CardDescription>
        {answer?.previousStatus ? (
          <p className="text-xs text-muted-foreground">
            Previous status kept on file: {statusLabel(answer.previousStatus)}.
            Notes and attachments were not cleared.
          </p>
        ) : null}
        <div className="space-y-2">
          <SourceCitations references={item.references} />
          <ItemAssessmentNote assessment={item.assessment} />
          <ItemResources resources={item.resources} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
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
            <p className="text-sm text-muted-foreground">No files on this item.</p>
          ) : (
            <AttachmentFileList projectId={project.id} files={files} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
