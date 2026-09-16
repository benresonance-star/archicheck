"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { addSourcedProposal } from "@/lib/client-store";
import { BUNDLED_TEMPLATE } from "@/lib/template/vic-residential";
import type { ScoutReport } from "@/lib/scout/types";
import type { TemplateDocument } from "@/lib/types";

export function SourcedProposalForm({
  template,
  onCreated,
}: {
  template: TemplateDocument;
  onCreated: (report: ScoutReport) => void;
}) {
  const items = template.items.length > 0 ? template.items : BUNDLED_TEMPLATE.items;
  const stages = template.stages.length > 0 ? template.stages : BUNDLED_TEMPLATE.stages;
  const [sourceTitle, setSourceTitle] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [flag, setFlag] = useState("");
  const [detail, setDetail] = useState("");
  const [itemId, setItemId] = useState(items[0]?.id ?? "");
  const [pending, setPending] = useState(false);
  const grouped = useMemo(
    () =>
      stages.map((stage) => ({
        stage,
        items: items.filter((item) => item.stageId === stage.id),
      })),
    [items, stages],
  );

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    try {
      const report = await addSourcedProposal({
        sourceTitle,
        sourceUrl,
        flag,
        itemIds: itemId ? [itemId] : [],
        detail,
      });
      onCreated(report);
      setSourceTitle("");
      setSourceUrl("");
      setFlag("");
      setDetail("");
      toast.success("Proposal is ready for comparison");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={(event) => void submit(event)}
      className="space-y-3 rounded-xl border border-border bg-card p-3"
    >
      <div>
        <p className="text-sm font-medium">Sourced proposal</p>
        <p className="text-sm text-muted-foreground">
          Record a wording change from a Grok Bot, Cursor scout, or a person.
          A reviewer still has to compare and publish before any project changes.
        </p>
      </div>
      <Field label="Source name" htmlFor="proposal-title">
        <Input
          id="proposal-title"
          required
          className="min-h-11"
          placeholder="e.g. NCC 2025 Housing Provisions"
          value={sourceTitle}
          onChange={(event) => setSourceTitle(event.target.value)}
        />
      </Field>
      <Field label="Source URL" htmlFor="proposal-url">
        <Input
          id="proposal-url"
          required
          className="min-h-11"
          placeholder="https://"
          value={sourceUrl}
          onChange={(event) => setSourceUrl(event.target.value)}
        />
      </Field>
      <Field label="Checklist item" htmlFor="proposal-item">
        <select
          id="proposal-item"
          className="min-h-11 w-full rounded-lg border border-input bg-background px-3 text-base dark:bg-input/30"
          value={itemId}
          onChange={(event) => setItemId(event.target.value)}
        >
          {grouped.map((group) => (
            <optgroup key={group.stage.id} label={`${group.stage.number}. ${group.stage.title}`}>
              {group.items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </Field>
      <Field label="Why it changed" htmlFor="proposal-flag">
        <Input
          id="proposal-flag"
          className="min-h-11"
          placeholder="e.g. Hash change on Clause 55"
          value={flag}
          onChange={(event) => setFlag(event.target.value)}
        />
      </Field>
      <Field label="Proposed wording" htmlFor="proposal-detail">
        <Textarea
          id="proposal-detail"
          required
          className="min-h-24 text-base"
          value={detail}
          onChange={(event) => setDetail(event.target.value)}
        />
      </Field>
      <Button type="submit" className="min-h-11 w-full" disabled={pending}>
        {pending ? "Saving…" : "Submit for review"}
      </Button>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
