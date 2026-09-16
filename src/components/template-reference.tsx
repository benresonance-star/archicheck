"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { BUNDLED_TEMPLATE } from "@/lib/template/vic-residential";
import {
  emptyTemplateTicks,
  groupedTemplateStages,
  loadTemplateTicks,
  referenceProgress,
  saveTemplateTicks,
  type TemplateTicks,
} from "@/lib/template-reference";
import { typologyLabel, type Typology } from "@/lib/types";
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
  const visibleGroups = stageId
    ? groups.filter((group) => group.stage.id === stageId)
    : groups;
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
                onClick={() => setSelected(id)}
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
      {visibleGroups.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No generic items for this view.
        </p>
      ) : stageId ? (
        <ul className="space-y-2">
          {visibleGroups[0]?.items.map((item) => (
            <li key={item.id}>
              <ReferenceItem
                title={item.title}
                detail={item.detail}
                required={item.required}
                ticked={Boolean(ticks[typology][item.id])}
                onTicked={(value) => setTicked(item.id, value)}
              />
            </li>
          ))}
        </ul>
      ) : (
        <Accordion
          type="single"
          collapsible
          defaultValue={visibleGroups[0]?.stage.id}
          className="rounded-2xl border border-border bg-card px-3"
        >
          {visibleGroups.map((group) => {
            const stageProgress = referenceProgress(
              group.items,
              ticks[typology],
            );
            return (
              <AccordionItem key={group.stage.id} value={group.stage.id}>
                <AccordionTrigger className="min-h-12 py-3 text-base hover:no-underline">
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
                  <ul className="space-y-2 pb-2">
                    {group.items.map((item) => (
                      <li key={item.id}>
                        <ReferenceItem
                          title={item.title}
                          detail={item.detail}
                          required={item.required}
                          ticked={Boolean(ticks[typology][item.id])}
                          onTicked={(value) => setTicked(item.id, value)}
                        />
                      </li>
                    ))}
                  </ul>
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

function ReferenceItem({
  title,
  detail,
  required,
  ticked,
  onTicked,
}: {
  title: string;
  detail: string;
  required: boolean;
  ticked: boolean;
  onTicked: (ticked: boolean) => void;
}) {
  return (
    <label className="flex min-h-14 cursor-pointer items-start gap-3 rounded-xl border border-border bg-background px-3 py-3">
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
        <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
          {detail}
        </span>
      </span>
    </label>
  );
}
