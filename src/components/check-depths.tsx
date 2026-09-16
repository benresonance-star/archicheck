"use client";

import { useState, type ReactNode } from "react";
import { DragHandle, reorderRowClass, usePointerReorder } from "@/components/check-reorder";
import { ItemResources } from "@/components/item-resources";
import { SourceCitations } from "@/components/source-citations";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  checkSignalLabel,
  checkSignalVariant,
  checkUnderstanding,
  findingsForItem,
  itemRestrictionParts,
  rowShowsSignal,
  templateCheckSignal,
  type CheckSignal,
  type RequirementDot,
} from "@/lib/check-depths";
import { cn } from "@/lib/utils";
import {
  checklistIssueKindLabel,
  findingResultLabel,
  statusLabel,
  type AttachmentMeta,
  type ChecklistItem,
  type FindingDocument,
  type ItemStatus,
} from "@/lib/types";

function SignalBadge({ signal }: { signal: CheckSignal }) {
  return (
    <Badge variant={checkSignalVariant(signal)} className="shrink-0">
      {checkSignalLabel(signal)}
    </Badge>
  );
}

function DepthQuestion({
  question,
  children,
}: {
  question: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h3 className="font-heading text-base font-semibold leading-snug">
        {question}
      </h3>
      <div className="text-sm leading-relaxed break-words">{children}</div>
    </section>
  );
}

function RequirementDotList({
  dots,
  nested = false,
}: {
  dots: RequirementDot[];
  nested?: boolean;
}) {
  return (
    <ul
      className={cn(
        "list-disc space-y-1",
        nested ? "mt-1 pl-6" : "pl-4",
      )}
    >
      {dots.map((dot, index) => (
        <li key={`${index}-${dot.text}`}>
          {dot.text}
          {dot.children && dot.children.length > 0 ? (
            <RequirementDotList dots={dot.children} nested />
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function CheckBrowseRow({
  title,
  signal,
  leading,
  trailing,
  badge,
  rowId,
  active = false,
  onInspect,
}: {
  title: string;
  signal: CheckSignal;
  leading?: ReactNode;
  trailing?: ReactNode;
  badge?: ReactNode;
  rowId?: string;
  active?: boolean;
  onInspect: () => void;
}) {
  return (
    <div
      data-reorder-id={rowId}
      className={`flex items-center gap-2 py-1.5 ${reorderRowClass(active)}`}
    >
      {leading}
      <button
        type="button"
        aria-haspopup="dialog"
        className="flex min-h-10 min-w-0 flex-1 items-center gap-2 text-left"
        onClick={onInspect}
      >
        <span className="min-w-0 flex-1 text-sm font-medium leading-snug break-words">
          {title}
        </span>
        {badge}
        {rowShowsSignal(signal) ? <SignalBadge signal={signal} /> : null}
      </button>
      {trailing}
    </div>
  );
}

function UnderstandingBody({
  item,
  notes,
  files,
  status,
  ticked,
  findings,
  mode,
  actions,
  templateVersion,
  templateChecksum,
  previousStatus,
}: {
  item: ChecklistItem;
  notes: string;
  files: AttachmentMeta[];
  status?: ItemStatus;
  ticked?: boolean;
  findings?: FindingDocument[];
  mode: "project" | "template";
  actions?: ReactNode;
  templateVersion: string;
  templateChecksum: string;
  previousStatus?: ItemStatus;
}) {
  const [audit, setAudit] = useState(false);
  const understanding = checkUnderstanding({
    item,
    notes,
    files,
    status,
    ticked,
    findings,
    mode,
  });
  const itemFindings = findingsForItem(findings, item.id);
  const sourceRefs = item.assessment?.requirement.sourceRefs ?? [];
  const restrictions = itemRestrictionParts(item);

  return (
    <div className="space-y-6">
      {restrictions.length > 0 ? (
        <p className="text-sm leading-relaxed text-muted-foreground break-words">
          {restrictions.join(" · ")}
        </p>
      ) : null}
      <DepthQuestion question="What must be established?">
        <RequirementDotList dots={understanding.established} />
      </DepthQuestion>
      <DepthQuestion question="Why?">
        <RequirementDotList dots={understanding.why} />
      </DepthQuestion>
      <DepthQuestion question="What evidence exists?">
        <ul className="list-disc space-y-1 pl-4">
          {understanding.evidence.map((line, index) => (
            <li key={`${index}-${line}`}>{line}</li>
          ))}
        </ul>
      </DepthQuestion>
      <DepthQuestion question="What is the assessment?">
        <ul className="list-disc space-y-1 pl-4">
          {understanding.assessment.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        {understanding.method.length > 0 ? (
          <div className="mt-2 text-muted-foreground">
            <RequirementDotList dots={understanding.method} />
          </div>
        ) : null}
        {understanding.acceptanceCriteria.length > 0 ? (
          <ul className="mt-2 list-disc space-y-1 pl-4 text-muted-foreground">
            {understanding.acceptanceCriteria.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        ) : null}
      </DepthQuestion>
      {actions}
      <ItemResources resources={item.resources} />
      <button
        type="button"
        aria-expanded={audit}
        className="min-h-11 w-full rounded-lg border border-border px-3 text-left text-sm font-medium hover:bg-muted/50"
        onClick={() => setAudit((current) => !current)}
      >
        {audit ? "Hide audit" : "Audit"}
      </button>
      {audit ? (
        <div className="space-y-3 rounded-lg border border-border bg-muted/30 px-3 py-3">
          <DepthQuestion question="Exact source">
            {item.references.length === 0 && sourceRefs.length === 0 ? (
              <p className="text-muted-foreground">
                No source recorded on this item.
              </p>
            ) : (
              <SourceCitations references={item.references} />
            )}
            {sourceRefs.length > 0 ? (
              <ul className="mt-2 space-y-1">
                {sourceRefs.map((ref) => (
                  <li key={`${ref.citation}-${ref.url ?? ""}`}>
                    {ref.url ? (
                      <a
                        href={ref.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-link underline underline-offset-2"
                      >
                        {ref.citation}
                      </a>
                    ) : (
                      ref.citation
                    )}
                    {ref.version ? (
                      <span className="text-muted-foreground">
                        {" "}
                        ({ref.version})
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : null}
          </DepthQuestion>
          <DepthQuestion question="Template version">
            <p>
              {templateVersion}
              <span className="block break-all text-xs text-muted-foreground">
                {templateChecksum}
              </span>
            </p>
          </DepthQuestion>
          {item.assessment ? (
            <DepthQuestion question="Checking method">
              <p className="font-mono text-xs">{item.assessment.method.id}</p>
            </DepthQuestion>
          ) : null}
          {previousStatus ? (
            <DepthQuestion question="Previous status">
              <p>
                {statusLabel(previousStatus)}. Notes and attachments were not
                cleared.
              </p>
            </DepthQuestion>
          ) : null}
          <DepthQuestion question="Findings">
            {itemFindings.length === 0 ? (
              <p className="text-muted-foreground">
                No agent finding is on this check.
              </p>
            ) : (
              <ul className="space-y-3">
                {itemFindings.map((finding) => (
                  <li key={finding.id} className="space-y-1">
                    <p>
                      {findingResultLabel(finding.result)} ·{" "}
                      {finding.designRevision.label}
                    </p>
                    <p className="text-muted-foreground">{finding.summary}</p>
                    {finding.missingInputs.length > 0 ? (
                      <p className="text-muted-foreground">
                        Missing inputs: {finding.missingInputs.join(", ")}.
                      </p>
                    ) : null}
                    {finding.assumptions.length > 0 ? (
                      <p className="text-muted-foreground">
                        Assumptions: {finding.assumptions.join(" ")}
                      </p>
                    ) : null}
                    {finding.checklistIssue ? (
                      <p className="text-muted-foreground">
                        Checklist issue (
                        {checklistIssueKindLabel(finding.checklistIssue.kind)}
                        ): {finding.checklistIssue.detail}
                      </p>
                    ) : null}
                    <p className="text-xs text-muted-foreground">
                      Finding {finding.formatVersion} · {finding.createdAt}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </DepthQuestion>
        </div>
      ) : null}
    </div>
  );
}

function CheckRequirementSheet({
  item,
  open,
  onClose,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
  children,
}: {
  item: ChecklistItem | undefined;
  open: boolean;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  children: ReactNode;
}) {
  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          onClose();
        }
      }}
    >
      <SheetContent
        side="bottom"
        className="flex h-[92dvh] max-h-[92dvh] min-h-0 flex-col gap-0 overflow-hidden rounded-t-2xl pb-[env(safe-area-inset-bottom)] data-[side=bottom]:h-[92dvh] data-[side=bottom]:max-h-[92dvh] md:inset-y-0 md:right-0 md:left-auto md:h-full md:max-h-none md:w-[28rem] md:max-w-none md:rounded-none md:border-t-0 md:border-l md:data-[side=bottom]:h-full md:data-[side=bottom]:max-h-none"
      >
        <SheetHeader className="shrink-0 border-b border-border pr-12">
          <SheetTitle className="text-lg leading-snug break-words">
            {item?.title ?? "Check"}
          </SheetTitle>
          <SheetDescription>
            Requirement — inspect this check, then close to return to the list.
          </SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 py-4 [-webkit-overflow-scrolling:touch]">
          {item ? <div key={item.id}>{children}</div> : null}
        </div>
        <SheetFooter className="shrink-0 flex-row gap-2 border-t border-border">
          <Button
            type="button"
            variant="outline"
            className="min-h-11 flex-1"
            disabled={!hasPrev}
            onClick={onPrev}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            className="min-h-11 flex-1"
            disabled={!hasNext}
            onClick={onNext}
          >
            Next
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export function TemplateCheckList({
  items,
  ticks,
  onTicked,
  templateVersion,
  templateChecksum,
  reorder,
  onReorder,
  onEditItem,
  trailing,
}: {
  items: ChecklistItem[];
  ticks: Record<string, boolean>;
  onTicked: (itemId: string, ticked: boolean) => void;
  templateVersion: string;
  templateChecksum: string;
  reorder?: boolean;
  onReorder?: (nextIds: string[]) => void;
  onEditItem?: (itemId: string) => void;
  trailing?: ReactNode;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const itemIds = items.map((item) => item.id);
  const byId = new Map(items.map((item) => [item.id, item]));
  const drag = usePointerReorder({
    ids: itemIds,
    enabled: Boolean(reorder && onReorder),
    onCommit: (nextIds) => onReorder?.(nextIds),
  });
  const visible = (reorder ? drag.ids : itemIds)
    .map((id) => byId.get(id))
    .filter((item): item is ChecklistItem => item != null);
  const openIndex = visible.findIndex((item) => item.id === openId);
  const openItem = openIndex >= 0 ? visible[openIndex] : undefined;

  if (items.length === 0 && !trailing) {
    return (
      <p className="text-sm text-muted-foreground">No checks on this document.</p>
    );
  }

  return (
    <>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No checks on this document.</p>
      ) : (
        <ul className="divide-y divide-border">
          {visible.map((item) => (
            <li key={item.id}>
              <CheckBrowseRow
                title={item.title}
                signal={templateCheckSignal(Boolean(ticks[item.id]))}
                rowId={item.id}
                active={drag.activeId === item.id}
                onInspect={() => {
                  if (drag.consumeClick()) {
                    return;
                  }
                  setOpenId(item.id);
                }}
                leading={
                  <>
                    {reorder && onReorder ? (
                      <DragHandle
                        label={item.title}
                        onPointerDown={(event) => drag.start(item.id, event)}
                        onPointerMove={drag.move}
                        onPointerUp={drag.end}
                        onPointerCancel={drag.end}
                        onKeyDown={(event) => drag.handleKey(item.id, event)}
                      />
                    ) : null}
                    <Checkbox
                      className="size-5 shrink-0"
                      checked={Boolean(ticks[item.id])}
                      aria-label={`Tick ${item.title}`}
                      onCheckedChange={(value) => onTicked(item.id, value === true)}
                    />
                  </>
                }
                trailing={
                  reorder && onEditItem ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="min-h-11 px-3"
                      onClick={() => onEditItem(item.id)}
                    >
                      Edit
                    </Button>
                  ) : null
                }
              />
            </li>
          ))}
        </ul>
      )}
      {trailing}
      <CheckRequirementSheet
        item={openItem}
        open={openItem != null}
        onClose={() => setOpenId(null)}
        hasPrev={openIndex > 0}
        hasNext={openIndex >= 0 && openIndex < visible.length - 1}
        onPrev={() => {
          if (openIndex > 0) {
            setOpenId(visible[openIndex - 1]?.id ?? null);
          }
        }}
        onNext={() => {
          if (openIndex >= 0 && openIndex < visible.length - 1) {
            setOpenId(visible[openIndex + 1]?.id ?? null);
          }
        }}
      >
        {openItem ? (
          <UnderstandingBody
            item={openItem}
            notes=""
            files={[]}
            ticked={Boolean(ticks[openItem.id])}
            mode="template"
            templateVersion={templateVersion}
            templateChecksum={templateChecksum}
          />
        ) : null}
      </CheckRequirementSheet>
    </>
  );
}

export function ProjectRequirementBody({
  item,
  status,
  notes,
  files,
  findings,
  previousStatus,
  templateVersion,
  templateChecksum,
  pending,
  actions,
}: {
  item: ChecklistItem;
  status: ItemStatus;
  notes: string;
  files: AttachmentMeta[];
  findings?: FindingDocument[];
  previousStatus?: ItemStatus;
  templateVersion: string;
  templateChecksum: string;
  pending?: boolean;
  actions: ReactNode;
}) {
  return (
    <>
      <UnderstandingBody
        item={item}
        notes={notes}
        files={files}
        status={status}
        findings={findings}
        mode="project"
        actions={actions}
        templateVersion={templateVersion}
        templateChecksum={templateChecksum}
        previousStatus={previousStatus}
      />
      {pending ? (
        <p className="text-xs text-muted-foreground">Saving…</p>
      ) : null}
    </>
  );
}

export function ProjectRequirementSheet({
  item,
  items,
  open,
  onClose,
  onSelect,
  children,
}: {
  item: ChecklistItem | undefined;
  items: ChecklistItem[];
  open: boolean;
  onClose: () => void;
  onSelect: (itemId: string) => void;
  children: ReactNode;
}) {
  const openIndex = item ? items.findIndex((entry) => entry.id === item.id) : -1;
  return (
    <CheckRequirementSheet
      item={item}
      open={open}
      onClose={onClose}
      hasPrev={openIndex > 0}
      hasNext={openIndex >= 0 && openIndex < items.length - 1}
      onPrev={() => {
        const previous = items[openIndex - 1];
        if (previous) {
          onSelect(previous.id);
        }
      }}
      onNext={() => {
        const next = items[openIndex + 1];
        if (next) {
          onSelect(next.id);
        }
      }}
    >
      {children}
    </CheckRequirementSheet>
  );
}

