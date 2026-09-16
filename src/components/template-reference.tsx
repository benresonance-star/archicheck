"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChecklistLensToggle,
  type ChecklistLens,
} from "@/components/checklist-lens-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ItemResources } from "@/components/item-resources";
import { SourceCitations } from "@/components/source-citations";
import { ItemAssessmentNote } from "@/components/item-assessment-note";
import { DeliverableHeading } from "@/components/deliverable-heading";
import { BUNDLED_TEMPLATE } from "@/lib/template/vic-residential";
import {
  emptyTemplateTicks,
  groupedTemplateStages,
  loadTemplateTicks,
  referenceProgress,
  saveTemplateTicks,
  type TemplateStageGroup,
  type TemplateTicks,
} from "@/lib/template-reference";
import {
  groupedOutputDocuments,
  type OutputLensGroup,
} from "@/lib/template/output-lens";
import { typologyLabel, type ChecklistItem, type Typology } from "@/lib/types";
import { TYPOLOGY_ORDER, typologyMeta } from "@/lib/typology";

export function TemplateReference({
  typology: lockedTypology,
  stageId,
  initialTypology = "house",
  showStartProject = true,
}: {
  typology?: Typology;
  stageId?: string;
  initialTypology?: Typology;
  showStartProject?: boolean;
}) {
  const [selected, setSelected] = useState<Typology>(
    lockedTypology ?? initialTypology,
  );
  const [ticks, setTicks] = useState<TemplateTicks>(emptyTemplateTicks);
  const [lens, setLens] = useState<ChecklistLens>("document");

  useEffect(() => {
    setTicks(loadTemplateTicks());
  }, []);

  useEffect(() => {
    if (lockedTypology) {
      setSelected(lockedTypology);
    }
  }, [lockedTypology]);

  const typology = lockedTypology ?? selected;
  const groups = useMemo(
    () => groupedTemplateStages(BUNDLED_TEMPLATE, typology),
    [typology],
  );
  const scrollYRef = useRef(0);

  function rememberScroll() {
    scrollYRef.current = window.scrollY;
  }

  function restoreScroll() {
    const top = scrollYRef.current;
    const restore = () => {
      window.scrollTo({ top, left: 0, behavior: "auto" });
    };
    restore();
    requestAnimationFrame(() => {
      restore();
      requestAnimationFrame(restore);
    });
  }

  const visibleGroups = stageId
    ? groups.filter((group) => group.stage.id === stageId)
    : groups;
  const documentGroups = useMemo(
    () => groupedOutputDocuments(BUNDLED_TEMPLATE, typology),
    [typology],
  );
  const allItems = useMemo(
    () => visibleGroups.flatMap((group) => group.items),
    [visibleGroups],
  );
  const progress = referenceProgress(allItems, ticks[typology]);
  const meta = typologyMeta(typology);

  function setTicked(itemId: string, ticked: boolean) {
    setTicks((current) => {
      const next: TemplateTicks = {
        house: { ...current.house },
        townhouse: { ...current.townhouse },
        apartment: { ...current.apartment },
      };
      if (ticked) {
        next[typology][itemId] = true;
      } else {
        delete next[typology][itemId];
      }
      saveTemplateTicks(next);
      return next;
    });
  }

  function clearTypology() {
    setTicks((current) => {
      const next: TemplateTicks = {
        house: { ...current.house },
        townhouse: { ...current.townhouse },
        apartment: { ...current.apartment },
      };
      next[typology] = {};
      saveTemplateTicks(next);
      return next;
    });
  }

  return (
    <section className="space-y-4">
      {lockedTypology ? null : (
        <div className="grid grid-cols-3 gap-2">
          {TYPOLOGY_ORDER.map((id) => {
            const count = groupedTemplateStages(BUNDLED_TEMPLATE, id).reduce(
              (sum, group) => sum + group.items.length,
              0,
            );
            const done = referenceProgress(
              groupedTemplateStages(BUNDLED_TEMPLATE, id).flatMap(
                (group) => group.items,
              ),
              ticks[id],
            ).done;
            return (
              <Button
                key={id}
                type="button"
                variant={id === typology ? "default" : "outline"}
                className="min-h-11 flex-col gap-0 px-2 text-xs sm:text-sm"
                aria-pressed={id === typology}
                onPointerDown={rememberScroll}
                onClick={() => {
                  setSelected(id);
                  restoreScroll();
                }}
              >
                <span>{typologyLabel(id)}</span>
                <span className="font-normal opacity-80">
                  {done}/{count}
                </span>
              </Button>
            );
          })}
        </div>
      )}
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Bundled template {BUNDLED_TEMPLATE.version} · {meta.clause}. Ticks
          stay on this phone as a quick reference. They are not a project and
          are not stored in a ZIP.
        </p>
        <p className="text-sm">
          {progress.done} of {progress.total} {meta.title.toLowerCase()} items
          ticked.
        </p>
      </div>
      {stageId ? null : (
        <ChecklistLensToggle lens={lens} onChange={setLens} />
      )}
      {visibleGroups.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No generic items for this view.
        </p>
      ) : stageId ? (
        <StageReferenceLists
          group={visibleGroups[0]}
          ticks={ticks[typology]}
          onTicked={setTicked}
        />
      ) : lens === "document" ? (
        <DocumentLensLists
          groups={documentGroups}
          typology={typology}
          ticks={ticks[typology]}
          onTicked={setTicked}
          rememberScroll={rememberScroll}
          restoreScroll={restoreScroll}
        />
      ) : (
        <Accordion
          type="multiple"
          defaultValue={[]}
          onValueChange={restoreScroll}
          className="rounded-2xl border border-border bg-card px-3 [overflow-anchor:none]"
        >
          {visibleGroups.map((group) => {
            const stageProgress = referenceProgress(
              group.items,
              ticks[typology],
            );
            return (
              <AccordionItem
                key={group.stage.id}
                value={group.stage.id}
                className="[overflow-anchor:none]"
              >
                <AccordionTrigger
                  className="min-h-12 scroll-mt-[calc(env(safe-area-inset-top)+4.5rem)] py-3 text-base hover:no-underline"
                  onPointerDown={(event) => {
                    rememberScroll();
                    if (event.pointerType !== "mouse") {
                      event.currentTarget.focus({ preventScroll: true });
                    }
                  }}
                  onKeyDown={rememberScroll}
                >
                  <span className="flex min-w-0 flex-1 items-center justify-between gap-3 pr-2">
                    <span className="min-w-0">
                      <span className="block font-heading text-lg leading-tight">
                        {String(group.stage.number).padStart(2, "0")}{" "}
                        {group.stage.title}
                      </span>
                      <span className="block text-sm font-normal text-muted-foreground">
                        {group.stage.summary}
                      </span>
                    </span>
                    <Badge variant="secondary" className="shrink-0">
                      {stageProgress.done}/{stageProgress.total}
                    </Badge>
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pb-2">
                    <StageReferenceLists
                      group={group}
                      ticks={ticks[typology]}
                      onTicked={setTicked}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        {showStartProject ? (
          <Button className="min-h-11" asChild>
            <Link href={`/t/${typology}/new`}>
              New {meta.title.toLowerCase()} project
            </Link>
          </Button>
        ) : null}
        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          disabled={progress.done === 0}
          onClick={clearTypology}
        >
          Clear {meta.title.toLowerCase()} ticks
        </Button>
      </div>
    </section>
  );
}

function DocumentLensLists({
  groups,
  typology,
  ticks,
  onTicked,
  rememberScroll,
  restoreScroll,
}: {
  groups: OutputLensGroup[];
  typology: Typology;
  ticks: Record<string, boolean>;
  onTicked: (itemId: string, ticked: boolean) => void;
  rememberScroll: () => void;
  restoreScroll: () => void;
}) {
  return (
    <Accordion
      type="multiple"
      defaultValue={[]}
      onValueChange={restoreScroll}
      className="rounded-2xl border border-border bg-card px-3 [overflow-anchor:none]"
      key={typology}
    >
      {groups.map((group) => {
        const progress = referenceProgress(group.items, ticks);
        return (
          <AccordionItem
            key={group.kind}
            value={group.kind}
            className="[overflow-anchor:none]"
          >
            <AccordionTrigger
              className="min-h-12 scroll-mt-[calc(env(safe-area-inset-top)+4.5rem)] py-3 text-base hover:no-underline"
              onPointerDown={(event) => {
                rememberScroll();
                if (event.pointerType !== "mouse") {
                  event.currentTarget.focus({ preventScroll: true });
                }
              }}
              onKeyDown={rememberScroll}
            >
              <span className="flex min-w-0 flex-1 items-center justify-between gap-3 pr-2">
                <span className="min-w-0">
                  <span className="block font-heading text-lg leading-tight">
                    {group.title}
                  </span>
                  <span className="block text-sm font-normal text-muted-foreground">
                    {group.summary}
                  </span>
                </span>
                <Badge variant="secondary" className="shrink-0">
                  {progress.done}/{progress.total}
                </Badge>
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pb-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Associated checklist
                </p>
                <ul className="space-y-2">
                  {group.items.map((item) => {
                    const stage = BUNDLED_TEMPLATE.stages.find(
                      (entry) => entry.id === item.stageId,
                    );
                    return (
                      <li key={item.id}>
                        <ReferenceItem
                          title={item.title}
                          detail={item.detail}
                          required={item.required}
                          references={item.references}
                          resources={item.resources}
                          assessment={item.assessment}
                          stageLabel={
                            stage
                              ? `${String(stage.number).padStart(2, "0")} ${stage.title}`
                              : undefined
                          }
                          ticked={Boolean(ticks[item.id])}
                          onTicked={(value) => onTicked(item.id, value)}
                        />
                      </li>
                    );
                  })}
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}

function StageReferenceLists({
  group,
  ticks,
  onTicked,
}: {
  group: TemplateStageGroup;
  ticks: Record<string, boolean>;
  onTicked: (itemId: string, ticked: boolean) => void;
}) {
  return (
    <div className="space-y-4">
      {group.deliverables.map((entry) => (
        <div
          key={entry.deliverable.id}
          className="space-y-2 rounded-xl border border-border bg-muted/40 p-3"
        >
          <DeliverableHeading deliverable={entry.deliverable} />
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Associated checklist
          </p>
          <ul className="space-y-2">
            {entry.items.map((item) => (
              <li key={item.id}>
                <ReferenceItem
                  title={item.title}
                  detail={item.detail}
                  required={item.required}
                  references={item.references}
                  resources={item.resources}
                  assessment={item.assessment}
                  ticked={Boolean(ticks[item.id])}
                  onTicked={(value) => onTicked(item.id, value)}
                />
              </li>
            ))}
          </ul>
        </div>
      ))}
      {group.processItems.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Stage checks
          </p>
          <ul className="space-y-2">
            {group.processItems.map((item) => (
              <li key={item.id}>
                <ReferenceItem
                  title={item.title}
                  detail={item.detail}
                  required={item.required}
                  references={item.references}
                  resources={item.resources}
                  assessment={item.assessment}
                  ticked={Boolean(ticks[item.id])}
                  onTicked={(value) => onTicked(item.id, value)}
                />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function ReferenceItem({
  title,
  detail,
  required,
  references,
  resources,
  assessment,
  stageLabel,
  ticked,
  onTicked,
}: {
  title: string;
  detail: string;
  required: boolean;
  references: string[];
  resources: ChecklistItem["resources"];
  assessment: ChecklistItem["assessment"];
  stageLabel?: string;
  ticked: boolean;
  onTicked: (ticked: boolean) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-background px-3 py-3">
      <label className="flex min-h-11 cursor-pointer items-start gap-3">
        <Checkbox
          className="mt-0.5 size-5"
          checked={ticked}
          onCheckedChange={(value) => onTicked(value === true)}
        />
        <span className="min-w-0 flex-1">
          <span className="flex items-start justify-between gap-2">
            <span className="font-medium leading-snug">{title}</span>
            {required ? null : (
              <Badge variant="outline" className="shrink-0">
                Optional
              </Badge>
            )}
          </span>
          {stageLabel ? (
            <span className="mt-1 block text-xs text-muted-foreground">
              {stageLabel}
            </span>
          ) : null}
          <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
            {detail}
          </span>
        </span>
      </label>
      <div className="mt-2 space-y-2 pl-8">
        <SourceCitations references={references} />
        <ItemAssessmentNote assessment={assessment} />
        <ItemResources resources={resources} />
      </div>
    </div>
  );
}
