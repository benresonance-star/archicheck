"use client";

import { useMemo, useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { FindingComparison } from "@/components/finding-comparison";
import { adoptImpact, dismissImpact } from "@/lib/client-store";
import type { ImpactNotice, ProjectDocument, TemplateDocument } from "@/lib/types";

export function ImpactNoticeCard({
  projectId,
  notice,
  onProject,
}: {
  projectId: string;
  notice: ImpactNotice;
  onProject: (next: {
    project: ProjectDocument;
    template: TemplateDocument;
  }) => void;
}) {
  const open = notice.status === "open";
  const [selected, setSelected] = useState<string[]>(
    () => notice.changes.map((change) => change.itemId),
  );
  const [pending, setPending] = useState(false);
  const rows = useMemo(
    () => notice.changes.filter((change) => selected.includes(change.itemId)),
    [notice.changes, selected],
  );

  async function adopt() {
    if (selected.length === 0) {
      toast.error("Select at least one change to adopt");
      return;
    }
    setPending(true);
    try {
      const next = await adoptImpact({
        projectId,
        noticeId: notice.id,
        selectedItemIds: selected,
      });
      onProject(next);
      toast.success(
        "Selected checks now need recheck. Notes and attachments were kept.",
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not adopt");
    } finally {
      setPending(false);
    }
  }

  async function dismiss() {
    setPending(true);
    try {
      onProject(
        await dismissImpact({
          projectId,
          noticeId: notice.id,
        }),
      );
      toast.success("Impact notice dismissed. This job stays on its current wording.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not dismiss");
    } finally {
      setPending(false);
    }
  }

  const statusLabel =
    notice.status === "open"
      ? "Impact notice"
      : notice.status === "adopted"
        ? "Adopted"
        : "Dismissed";

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap gap-2">
          <Badge variant={open ? "destructive" : "outline"}>{statusLabel}</Badge>
          <Badge variant="outline">
            {notice.fromVersion} → {notice.toVersion}
          </Badge>
        </div>
        <CardTitle className="text-lg">{notice.sourceTitle}</CardTitle>
        <CardDescription>
          Template {notice.toVersion} is published. Choose which wording this job
          should take. Answers, notes and attachments stay on the item; adopted
          checks become Needs recheck.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {notice.sourceUrl ? (
          <Button className="min-h-11 w-full sm:w-auto" asChild>
            <a href={notice.sourceUrl} target="_blank" rel="noreferrer">
              Open source
            </a>
          </Button>
        ) : null}
        {open ? (
          <ul className="space-y-2">
            {notice.changes.map((change) => {
              const checked = selected.includes(change.itemId);
              return (
                <li key={change.itemId}>
                  <label className="flex min-h-11 items-start gap-2">
                    <Checkbox
                      className="mt-1"
                      checked={checked}
                      onCheckedChange={(value) => {
                        setSelected((current) =>
                          value === true
                            ? [...current, change.itemId]
                            : current.filter((id) => id !== change.itemId),
                        );
                      }}
                    />
                    <span className="text-sm leading-snug">{change.title}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            {notice.changes.filter((change) => change.adopted).length} of{" "}
            {notice.changes.length} changes adopted.
          </p>
        )}
        <FindingComparison rows={open ? rows : notice.changes} />
        {open ? (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button className="min-h-11" disabled={pending} onClick={() => void adopt()}>
              {pending ? "Saving…" : "Adopt selected"}
            </Button>
            <Button
              variant="outline"
              className="min-h-11"
              disabled={pending}
              onClick={() => void dismiss()}
            >
              Dismiss
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
