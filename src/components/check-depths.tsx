"use client";

import { useState, type ReactNode } from "react";
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
} from "@/lib/check-depths";
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
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {question}
      </p>
      <div className="text-sm leading-relaxed break-words">{children}</div>
    </div>
  );
}

export function CheckBrowseRow({
  title,
  signal,
  leading,
  onInspect,
}: {
  title: string;
  signal: CheckSignal;
  leading?: ReactNode;
  onInspect: () => void;
}) {
  return (
    <div className="flex items-center gap-3 py-1.5">
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
        {rowShowsSignal(signal) ? <SignalBadge signal={signal} /> : null}
      </button>
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
    <>
      {restrictions.length > 0 ? (
        <p className="text-xs leading-relaxed text-muted-foreground break-words">
          {restrictions.join(" · ")}
        </p>
      ) : null}
      <DepthQuestion question="What must be established?">
        <ul className="list-disc space-y-1 pl-4">
          {understanding.established.map((line, index) => (
            <li key={`${index}-${line}`}>{line}</li>
          ))}
        </ul>
      </DepthQuestion>
      <DepthQuestion question="Why?">
        <ul className="list-disc space-y-1 pl-4">
          {understanding.why.map((line, index) => (
            <li key={`${index}-${line}`}>{line}</li>
          ))}
        </ul>
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
          <ul className="mt-2 list-disc space-y-1 pl-4 text-muted-foreground">
            {understanding.method.map((line, index) => (
              <li key={`${index}-${line}`}>{line}</li>
            ))}
          </ul>
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
    </>
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
        className="h-[92dvh] max-h-[92dvh] gap-0 overflow-hidden rounded-t-2xl pb-[env(safe-area-inset-bottom)] md:inset-y-0 md:right-0 md:left-auto md:h-full md:max-h-none md:w-[28rem] md:max-w-none md:rounded-none md:border-t-0 md:border-l"
      >
        <SheetHeader className="border-b border-border pr-12">
          <SheetTitle className="text-lg leading-snug break-words">
            {item?.title ?? "Check"}
          </SheetTitle>
          <SheetDescription>
            Requirement — inspect this check, then close to return to the list.
          </SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {item ? <div key={item.id}>{children}</div> : null}
        </div>
        <SheetFooter className="flex-row gap-2 border-t border-border">
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
}: {
  items: ChecklistItem[];
  ticks: Record<string, boolean>;
  onTicked: (itemId: string, ticked: boolean) => void;
  templateVersion: string;
  templateChecksum: string;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const openIndex = items.findIndex((item) => item.id === openId);
  const openItem = openIndex >= 0 ? items[openIndex] : undefined;

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No checks on this document.</p>
    );
  }

  return (
    <>
      <ul className="divide-y divide-border">
        {items.map((item) => (
          <li key={item.id}>
            <CheckBrowseRow
              title={item.title}
              signal={templateCheckSignal(Boolean(ticks[item.id]))}
              onInspect={() => setOpenId(item.id)}
              leading={
                <Checkbox
                  className="size-5 shrink-0"
                  checked={Boolean(ticks[item.id])}
                  aria-label={`Tick ${item.title}`}
                  onCheckedChange={(value) => onTicked(item.id, value === true)}
                />
              }
            />
          </li>
        ))}
      </ul>
      <CheckRequirementSheet
        item={openItem}
        open={openItem != null}
        onClose={() => setOpenId(null)}
        hasPrev={openIndex > 0}
        hasNext={openIndex >= 0 && openIndex < items.length - 1}
        onPrev={() => {
          if (openIndex > 0) {
            setOpenId(items[openIndex - 1]?.id ?? null);
          }
        }}
        onNext={() => {
          if (openIndex >= 0 && openIndex < items.length - 1) {
            setOpenId(items[openIndex + 1]?.id ?? null);
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

