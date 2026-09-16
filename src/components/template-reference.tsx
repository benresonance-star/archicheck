"use client";

import Link from "next/link";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ChecklistLensToggle,
  type ChecklistLens,
} from "@/components/checklist-lens-toggle";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArbvStageHeader } from "@/components/arbv-stage-header";
import { TemplateCheckDepths } from "@/components/check-depths";
import {
  DeliverableHeading,
  StageChecksHeading,
} from "@/components/deliverable-heading";
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
import { stageContentSections } from "@/lib/template/group-stage";
import {
  groupedOutputDocuments,
  type StagedOutputLensGroup,
} from "@/lib/template/output-lens";
import {
  assertNever,
  typologyLabel,
  type Stage,
  type Typology,
} from "@/lib/types";
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
          rememberScroll={rememberScroll}
          restoreScroll={restoreScroll}
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
        <div className="space-y-4" key={typology}>
          {visibleGroups.map((group) => {
            const stageProgress = referenceProgress(
              group.items,
              ticks[typology],
            );
            return (
              <StagePanel
                key={group.stage.id}
                stage={group.stage}
                badge={
                  <Badge variant="secondary" className="shrink-0">
                    {stageProgress.done}/{stageProgress.total}
                  </Badge>
                }
                rememberScroll={rememberScroll}
                restoreScroll={restoreScroll}
              >
                <StageReferenceLists
                  group={group}
                  ticks={ticks[typology]}
                  onTicked={setTicked}
                  rememberScroll={rememberScroll}
                  restoreScroll={restoreScroll}
                />
              </StagePanel>
            );
          })}
        </div>
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

function CollapseSection({
  header,
  rememberScroll,
  restoreScroll,
  children,
  defaultOpen = false,
  className,
  triggerClassName,
}: {
  header: ReactNode;
  rememberScroll?: () => void;
  restoreScroll?: () => void;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section
      className={cn(
        "overflow-visible rounded-xl border border-border bg-background [overflow-anchor:none]",
        className,
      )}
    >
      <button
        type="button"
        aria-expanded={open}
        className={cn(
          "flex min-h-11 w-full items-start gap-2 px-3 py-3 text-left hover:bg-muted/50",
          open ? "rounded-t-xl border-b border-border" : "rounded-xl",
          triggerClassName,
        )}
        onPointerDown={(event) => {
          rememberScroll?.();
          if (event.pointerType !== "mouse") {
            event.currentTarget.focus({ preventScroll: true });
          }
        }}
        onKeyDown={rememberScroll}
        onClick={() => {
          setOpen((current) => !current);
          restoreScroll?.();
        }}
      >
        <span className="min-w-0 flex-1">{header}</span>
        {open ? (
          <ChevronUpIcon className="mt-1 size-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDownIcon className="mt-1 size-4 shrink-0 text-muted-foreground" />
        )}
      </button>
      {open ? (
        <div className="overflow-visible px-3 pb-3 pt-3">{children}</div>
      ) : null}
    </section>
  );
}

function StagePanel({
  stage,
  badge,
  rememberScroll,
  restoreScroll,
  children,
}: {
  stage: Stage;
  badge: ReactNode;
  rememberScroll: () => void;
  restoreScroll: () => void;
  children: ReactNode;
}) {
  return (
    <CollapseSection
      className="rounded-2xl bg-card"
      triggerClassName="min-h-14 bg-muted/70 text-base hover:bg-muted"
      header={<ArbvStageHeader stage={stage} badge={badge} />}
      rememberScroll={rememberScroll}
      restoreScroll={restoreScroll}
    >
      {children}
    </CollapseSection>
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
  groups: StagedOutputLensGroup[];
  typology: Typology;
  ticks: Record<string, boolean>;
  onTicked: (itemId: string, ticked: boolean) => void;
  rememberScroll: () => void;
  restoreScroll: () => void;
}) {
  return (
    <div className="space-y-4" key={typology}>
      {groups.map((group) => {
        const stageItems = group.documents.flatMap((document) => document.items);
        const stageProgress = referenceProgress(stageItems, ticks);
        return (
          <StagePanel
            key={group.stage.id}
            stage={group.stage}
            badge={
              <Badge variant="secondary" className="shrink-0">
                {stageProgress.done}/{stageProgress.total}
              </Badge>
            }
            rememberScroll={rememberScroll}
            restoreScroll={restoreScroll}
          >
            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Documents in this stage
              </p>
              {group.documents.map((document) => {
                const progress = referenceProgress(document.items, ticks);
                return (
                  <CollapseSection
                    key={`${group.stage.id}-${document.kind}`}
                    rememberScroll={rememberScroll}
                    restoreScroll={restoreScroll}
                    header={
                      <span className="flex items-start justify-between gap-3">
                        <span className="min-w-0">
                          <span className="block font-medium leading-tight break-words">
                            {document.title}
                          </span>
                          <span className="mt-1 block text-sm leading-relaxed text-muted-foreground break-words">
                            {document.summary}
                          </span>
                        </span>
                        <Badge variant="outline" className="shrink-0">
                          {progress.done}/{progress.total}
                        </Badge>
                      </span>
                    }
                  >
                    <div className="space-y-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Associated checklist
                      </p>
                      {document.items.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No checks on this document.
                        </p>
                      ) : (
                        <ul className="space-y-2">
                          {document.items.map((item) => (
                            <li key={item.id}>
                              <TemplateCheckDepths
                                item={item}
                                ticked={Boolean(ticks[item.id])}
                                onTicked={(value) => onTicked(item.id, value)}
                                templateVersion={BUNDLED_TEMPLATE.version}
                                templateChecksum={BUNDLED_TEMPLATE.checksum}
                              />
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </CollapseSection>
                );
              })}
            </div>
          </StagePanel>
        );
      })}
    </div>
  );
}

function StageReferenceLists({
  group,
  ticks,
  onTicked,
  rememberScroll,
  restoreScroll,
}: {
  group: TemplateStageGroup;
  ticks: Record<string, boolean>;
  onTicked: (itemId: string, ticked: boolean) => void;
  rememberScroll?: () => void;
  restoreScroll?: () => void;
}) {
  return (
    <div className="space-y-3">
      {stageContentSections(group).map((section) => {
        switch (section.kind) {
          case "stage-checks":
            return (
              <CollapseSection
                key="stage-checks"
                className="bg-muted/40"
                rememberScroll={rememberScroll}
                restoreScroll={restoreScroll}
                header={<StageChecksHeading />}
              >
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Associated checklist
                  </p>
                  <ul className="space-y-2">
                    {section.items.map((item) => (
                      <li key={item.id}>
                        <TemplateCheckDepths
                          item={item}
                          ticked={Boolean(ticks[item.id])}
                          onTicked={(value) => onTicked(item.id, value)}
                          templateVersion={BUNDLED_TEMPLATE.version}
                          templateChecksum={BUNDLED_TEMPLATE.checksum}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              </CollapseSection>
            );
          case "deliverable":
            return (
              <CollapseSection
                key={section.deliverable.id}
                className="bg-muted/40"
                rememberScroll={rememberScroll}
                restoreScroll={restoreScroll}
                header={<DeliverableHeading deliverable={section.deliverable} />}
              >
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Associated checklist
                  </p>
                  <ul className="space-y-2">
                    {section.items.map((item) => (
                      <li key={item.id}>
                        <TemplateCheckDepths
                          item={item}
                          ticked={Boolean(ticks[item.id])}
                          onTicked={(value) => onTicked(item.id, value)}
                          templateVersion={BUNDLED_TEMPLATE.version}
                          templateChecksum={BUNDLED_TEMPLATE.checksum}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              </CollapseSection>
            );
          default:
            return assertNever(
              section,
              `Unknown stage section: ${String(section)}`,
            );
        }
      })}
    </div>
  );
}
