"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  emptyItemDraft,
  parseLineList,
  parseResourceLines,
  resourceLines,
  type ChecklistItemDraft,
} from "@/lib/template/checklist-crud";
import {
  OUTPUT_KINDS,
  isOutputKind,
  outputKindLabel,
} from "@/lib/template/output-lens";
import { TYPOLOGIES, typologyLabel, type TemplateDocument } from "@/lib/types";

export function ChecklistItemForm({
  template,
  initial,
  submitLabel,
  pending,
  onSubmit,
  onCancel,
}: {
  template: TemplateDocument;
  initial: ChecklistItemDraft;
  submitLabel: string;
  pending?: boolean;
  onSubmit: (draft: ChecklistItemDraft) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial.title);
  const [detail, setDetail] = useState(initial.detail);
  const [references, setReferences] = useState(initial.references.join("\n"));
  const [resources, setResources] = useState(resourceLines(initial.resources));
  const [required, setRequired] = useState(initial.required);
  const [appliesTo, setAppliesTo] = useState(initial.appliesTo);
  const [stageId, setStageId] = useState(initial.stageId);
  const [deliverableId, setDeliverableId] = useState(initial.deliverableId ?? "");
  const [outputKind, setOutputKind] = useState(initial.outputKind ?? "");
  const deliverables = (template.deliverables ?? []).filter(
    (entry) => entry.stageId === stageId,
  );

  function submit(event: React.FormEvent) {
    event.preventDefault();
    onSubmit({
      title,
      detail,
      references: parseLineList(references),
      resources: parseResourceLines(resources),
      required,
      appliesTo,
      stageId,
      deliverableId: deliverableId || undefined,
      outputKind: isOutputKind(outputKind) ? outputKind : undefined,
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <Field label="Title" htmlFor="check-title">
        <Input
          id="check-title"
          required
          className="min-h-11"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </Field>
      <Field label="What must be established" htmlFor="check-detail">
        <Textarea
          id="check-detail"
          className="min-h-24 text-base"
          value={detail}
          onChange={(event) => setDetail(event.target.value)}
        />
      </Field>
      <Field label="Sources (one per line)" htmlFor="check-refs">
        <Textarea
          id="check-refs"
          className="min-h-20 text-base"
          value={references}
          onChange={(event) => setReferences(event.target.value)}
        />
      </Field>
      <Field label="Resources (Label | https://…)" htmlFor="check-resources">
        <Textarea
          id="check-resources"
          className="min-h-20 text-base"
          value={resources}
          onChange={(event) => setResources(event.target.value)}
        />
      </Field>
      <label className="flex min-h-11 items-center gap-2">
        <Checkbox
          checked={required}
          onCheckedChange={(value) => setRequired(value === true)}
        />
        <span className="text-sm">Required</span>
      </label>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Applies to</legend>
        <div className="grid grid-cols-1 gap-1 sm:grid-cols-3">
          {TYPOLOGIES.map((typology) => (
            <label key={typology} className="flex min-h-11 items-center gap-2">
              <Checkbox
                checked={appliesTo.includes(typology)}
                onCheckedChange={(value) => {
                  setAppliesTo((current) =>
                    value === true
                      ? [...current, typology]
                      : current.filter((entry) => entry !== typology),
                  );
                }}
              />
              <span className="text-sm">{typologyLabel(typology)}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <Field label="ARBV stage" htmlFor="check-stage">
        <select
          id="check-stage"
          className="min-h-11 w-full rounded-lg border border-input bg-background px-3 text-base dark:bg-input/30"
          value={stageId}
          onChange={(event) => {
            setStageId(event.target.value);
            setDeliverableId("");
          }}
        >
          {template.stages.map((stage) => (
            <option key={stage.id} value={stage.id}>
              {String(stage.number).padStart(2, "0")} {stage.title}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Drawing or document" htmlFor="check-deliverable">
        <select
          id="check-deliverable"
          className="min-h-11 w-full rounded-lg border border-input bg-background px-3 text-base dark:bg-input/30"
          value={deliverableId}
          onChange={(event) => setDeliverableId(event.target.value)}
        >
          <option value="">Stage checks (no drawing)</option>
          {deliverables.map((deliverable) => (
            <option key={deliverable.id} value={deliverable.id}>
              {deliverable.title}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Output document list" htmlFor="check-output">
        <select
          id="check-output"
          className="min-h-11 w-full rounded-lg border border-input bg-background px-3 text-base dark:bg-input/30"
          value={outputKind}
          onChange={(event) => setOutputKind(event.target.value)}
        >
          <option value="">Stage view only</option>
          {OUTPUT_KINDS.map((kind) => (
            <option key={kind} value={kind}>
              {outputKindLabel(kind)}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Button type="submit" className="min-h-11" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          disabled={pending}
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

export function newSectionDraft(input: {
  stageId: string;
  appliesTo: ChecklistItemDraft["appliesTo"];
  deliverableId?: string;
  outputKind?: ChecklistItemDraft["outputKind"];
}): ChecklistItemDraft {
  return emptyItemDraft(input);
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
