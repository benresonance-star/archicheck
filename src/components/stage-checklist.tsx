"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GrokbotPanel } from "@/components/grokbot-panel";
import type {
  ChecklistItem,
  GrokBotBrief,
  ItemStatus,
  ProjectDocument,
  Stage,
  TemplateDocument,
} from "@/lib/types";
import { ITEM_STATUSES, statusLabel } from "@/lib/types";

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
        items.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            project={local}
            onProject={(next) => {
              setLocal(next);
              router.refresh();
            }}
          />
        ))
      )}
      {grokbot ? (
        <GrokbotPanel bot={grokbot} project={local} stage={stage} />
      ) : null}
    </div>
  );
}

function ItemCard({
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
      const response = await fetch(
        `/api/projects/${project.id}/answers/${item.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        },
      );
      const data = (await response.json()) as {
        error?: string;
        project?: ProjectDocument;
      };
      if (!response.ok || !data.project) {
        throw new Error(data.error ?? "Could not save");
      }
      onProject(data.project);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save");
    } finally {
      setPending(false);
    }
  }

  async function upload(file: File) {
    setPending(true);
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("itemId", item.id);
      const response = await fetch(`/api/projects/${project.id}/attachments`, {
        method: "POST",
        body: form,
      });
      const data = (await response.json()) as {
        error?: string;
        project?: ProjectDocument;
      };
      if (!response.ok || !data.project) {
        throw new Error(data.error ?? "Upload failed");
      }
      onProject(data.project);
      toast.success("Attachment stored in the project JSON package");
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
          {item.required ? <Badge>Required</Badge> : <Badge variant="outline">Optional</Badge>}
        </div>
        <CardDescription>{item.detail}</CardDescription>
        {item.references.length > 0 ? (
          <p className="text-xs text-muted-foreground">
            {item.references.join(" · ")}
          </p>
        ) : null}
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
            <ul className="space-y-1 text-sm">
              {files.map((file) => (
                <li key={file.id}>
                  <a
                    className="underline underline-offset-2"
                    href={`/api/projects/${project.id}/attachments/${file.id}`}
                  >
                    {file.filename}
                  </a>{" "}
                  <span className="text-muted-foreground">
                    ({file.size} bytes)
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
