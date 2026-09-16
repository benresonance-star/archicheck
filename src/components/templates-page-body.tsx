"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ChecklistEditToggle } from "@/components/checklist-edit-toggle";
import { FindingComparison } from "@/components/finding-comparison";
import { TemplateReference } from "@/components/template-reference";
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
import { loadLiveTemplate, publishLiveTemplateEdits } from "@/lib/client-store";
import { diffTemplateItems } from "@/lib/template/checklist-crud";
import { BUNDLED_TEMPLATE } from "@/lib/template/vic-residential";
import type { TemplateDocument } from "@/lib/types";
import type { Typology } from "@/lib/types";

export function TemplatesPageBody({
  initialTypology,
}: {
  initialTypology: Typology;
}) {
  const [live, setLive] = useState<TemplateDocument>(BUNDLED_TEMPLATE);
  const [draft, setDraft] = useState<TemplateDocument | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [sourceTitle, setSourceTitle] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [pending, setPending] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    void loadLiveTemplate().then((row) => {
      setLive(row.template);
    });
  }, []);

  const working = draft ?? live;
  const changes = useMemo(
    () => (draft ? diffTemplateItems(live, draft) : []),
    [draft, live],
  );

  async function publish() {
    if (!draft) {
      return;
    }
    setPending(true);
    try {
      const published = await publishLiveTemplateEdits({
        draft,
        sourceTitle,
        sourceUrl,
      });
      setLive(published.template);
      setDraft(null);
      setReviewOpen(false);
      setSourceTitle("");
      setSourceUrl("");
      toast.success(
        `Published template ${published.template.version}. Existing jobs got an impact notice.`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not publish");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <ChecklistEditToggle editing={editing} onChange={setEditing} />
      {changes.length > 0 ? (
        <div className="space-y-2 rounded-xl border border-border bg-muted/40 p-3">
          <p className="text-sm font-medium">
            {changes.length} unpublished live-template change
            {changes.length === 1 ? "" : "s"}
          </p>
          <p className="text-sm text-muted-foreground">
            New projects will not see these until you publish. Existing jobs
            keep their snapshots and receive an impact notice.
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button
              type="button"
              className="min-h-11"
              onClick={() => setReviewOpen(true)}
            >
              Review and publish
            </Button>
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              onClick={() => setDraft(null)}
            >
              Discard draft
            </Button>
          </div>
        </div>
      ) : null}
      <TemplateReference
        initialTypology={initialTypology}
        template={working}
        editing={editing}
        onTemplate={setDraft}
      />
      <Sheet open={reviewOpen} onOpenChange={setReviewOpen}>
        <SheetContent
          side="bottom"
          className="h-[92dvh] max-h-[92dvh] gap-0 overflow-hidden rounded-t-2xl pb-[env(safe-area-inset-bottom)] md:inset-y-0 md:right-0 md:left-auto md:h-full md:max-h-none md:w-[28rem] md:max-w-none md:rounded-none md:border-t-0 md:border-l"
        >
          <SheetHeader className="border-b border-border pr-12">
            <SheetTitle>Publish live template</SheetTitle>
            <SheetDescription>
              Compare the draft with the current live template, then publish a
              new version. ARBV stages are not deleted.
            </SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
            <div className="space-y-1">
              <Label htmlFor="live-source-title">Source name</Label>
              <Input
                id="live-source-title"
                className="min-h-11"
                value={sourceTitle}
                onChange={(event) => setSourceTitle(event.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="live-source-url">Source URL</Label>
              <Input
                id="live-source-url"
                className="min-h-11"
                placeholder="https://"
                value={sourceUrl}
                onChange={(event) => setSourceUrl(event.target.value)}
              />
            </div>
            <FindingComparison rows={changes} />
            <Button
              type="button"
              className="min-h-11 w-full"
              disabled={pending}
              onClick={() => void publish()}
            >
              {pending ? "Publishing…" : "Publish new version"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
