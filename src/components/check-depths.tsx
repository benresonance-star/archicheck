"use client";

import { ChevronDownIcon, ChevronUpIcon, PaperclipIcon } from "lucide-react";
import { useState, type ReactNode } from "react";
import { ItemResources } from "@/components/item-resources";
import { SourceCitations } from "@/components/source-citations";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  checkSignalLabel,
  checkSignalVariant,
  checkUnderstanding,
  deriveCheckSignal,
  findingsForItem,
  itemRestrictionParts,
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

function CheckDepthCard({
  title,
  restrictions,
  signal,
  hasFiles,
  leading,
  children,
}: {
  title: string;
  restrictions: string[];
  signal: CheckSignal;
  hasFiles: boolean;
  leading?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <article className="overflow-visible rounded-xl border border-border bg-background">
      <div className="flex items-start gap-2 px-3 py-3">
        {leading}
        <button
          type="button"
          aria-expanded={open}
          className="flex min-h-11 min-w-0 flex-1 items-start gap-2 text-left"
          onClick={() => setOpen((current) => !current)}
        >
          <span className="min-w-0 flex-1">
            <span className="block font-medium leading-snug break-words">
              {title}
            </span>
            <span className="mt-1 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs leading-relaxed text-muted-foreground break-words">
                {restrictions.length > 0
                  ? restrictions.join(" · ")
                  : "No extra restriction"}
              </span>
              <span className="flex shrink-0 items-center gap-1.5">
                {hasFiles ? (
                  <PaperclipIcon
                    className="size-3.5 text-muted-foreground"
                    aria-hidden
                  />
                ) : null}
                <SignalBadge signal={signal} />
              </span>
            </span>
          </span>
          {open ? (
            <ChevronUpIcon className="mt-1 size-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronDownIcon className="mt-1 size-4 shrink-0 text-muted-foreground" />
          )}
        </button>
      </div>
      {open ? (
        <div className="overflow-visible space-y-3 border-t border-border px-3 py-3">
          {children}
        </div>
      ) : null}
    </article>
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

  return (
    <>
      <DepthQuestion question="What must be established?">
        <p>{understanding.established}</p>
      </DepthQuestion>
      <DepthQuestion question="Why?">
        <p>{understanding.why}</p>
      </DepthQuestion>
      <DepthQuestion question="What evidence exists?">
        <ul className="list-disc space-y-1 pl-4">
          {understanding.evidence.map((line, index) => (
            <li key={`${index}-${line}`}>{line}</li>
          ))}
        </ul>
      </DepthQuestion>
      <DepthQuestion question="What is the assessment?">
        <ul className="space-y-1">
          {understanding.assessment.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        {understanding.method ? (
          <p className="mt-2 text-muted-foreground">{understanding.method}</p>
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

export function TemplateCheckDepths({
  item,
  ticked,
  onTicked,
  templateVersion,
  templateChecksum,
}: {
  item: ChecklistItem;
  ticked: boolean;
  onTicked: (ticked: boolean) => void;
  templateVersion: string;
  templateChecksum: string;
}) {
  return (
    <CheckDepthCard
      title={item.title}
      restrictions={itemRestrictionParts(item)}
      signal={templateCheckSignal(ticked)}
      hasFiles={false}
      leading={
        <Checkbox
          className="mt-1 size-5 shrink-0"
          checked={ticked}
          aria-label={`Tick ${item.title}`}
          onCheckedChange={(value) => onTicked(value === true)}
        />
      }
    >
      <UnderstandingBody
        item={item}
        notes=""
        files={[]}
        ticked={ticked}
        mode="template"
        templateVersion={templateVersion}
        templateChecksum={templateChecksum}
      />
    </CheckDepthCard>
  );
}

export function ProjectCheckDepths({
  item,
  status,
  notes,
  files,
  findings,
  previousStatus,
  templateVersion,
  templateChecksum,
  pending,
  leading,
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
  leading?: ReactNode;
  actions: ReactNode;
}) {
  return (
    <CheckDepthCard
      title={item.title}
      restrictions={itemRestrictionParts(item)}
      signal={deriveCheckSignal({
        item,
        status,
        notes,
        files,
        findings,
      })}
      hasFiles={files.length > 0}
      leading={leading}
    >
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
    </CheckDepthCard>
  );
}
