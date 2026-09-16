"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FindingComparison } from "@/components/finding-comparison";
import {
  adoptFindingOnProject,
  patchScoutFinding,
  publishFinding,
  runProjectScout,
  updateMunicipality,
} from "@/lib/client-store";
import { MUNICIPALITIES, resolveMunicipality } from "@/lib/scout/municipalities";
import {
  findingActionBadge,
  findingDisplayFlag,
  findingStatusLabel,
  isBlockedFinding,
  type ScoutFinding,
  type ScoutReport,
} from "@/lib/scout/types";
import { comparisonRows } from "@/lib/template/publish";
import type { TemplateDocument } from "@/lib/types";

export function ScoutInbox({
  projectId,
  template,
  municipality,
  report,
  onMunicipality,
  onReport,
}: {
  projectId: string;
  template: TemplateDocument;
  municipality: string;
  report: ScoutReport | null;
  onMunicipality: (municipality: string) => void;
  onReport: (report: ScoutReport) => void;
}) {
  const [running, setRunning] = useState(false);
  const [municipalityDraft, setMunicipalityDraft] = useState(municipality);
  const [savingMunicipality, setSavingMunicipality] = useState(false);
  const resolved = resolveMunicipality(municipality);

  useEffect(() => {
    setMunicipalityDraft(municipality);
  }, [municipality]);

  async function run() {
    setRunning(true);
    try {
      const next = await runProjectScout(projectId);
      onReport(next);
      toast.success("Scout finished");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Scout failed");
    } finally {
      setRunning(false);
    }
  }

  const statewide = report?.findings.filter((finding) => finding.scope === "statewide") ?? [];
  const local = report?.findings.filter((finding) => finding.scope !== "statewide") ?? [];

  async function saveMunicipality() {
    setSavingMunicipality(true);
    try {
      const project = await updateMunicipality(projectId, municipalityDraft);
      onMunicipality(project.site.municipality);
      toast.success(
        resolveMunicipality(project.site.municipality)
          ? "Municipality saved. Run scout to watch this council."
          : "Saved. Scout needs a known Victorian municipality name to watch C-amendments.",
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save");
    } finally {
      setSavingMunicipality(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="scout-municipality">Municipality</Label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id="scout-municipality"
            list="scout-municipalities"
            className="min-h-11"
            placeholder="e.g. Yarra"
            value={municipalityDraft}
            onChange={(event) => setMunicipalityDraft(event.target.value)}
          />
          <datalist id="scout-municipalities">
            {MUNICIPALITIES.map((row) => (
              <option key={row.schemeCode} value={row.name} />
            ))}
          </datalist>
          <Button
            variant="outline"
            className="min-h-11"
            disabled={savingMunicipality || municipalityDraft.trim() === municipality}
            onClick={() => void saveMunicipality()}
          >
            {savingMunicipality ? "Saving…" : "Save"}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          {resolved
            ? `Local watch: ${resolved.name} planning scheme amendments.`
            : "Statewide sources still run. Set a Victorian municipality to watch that council’s C-amendments."}
        </p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {report
            ? `Last run ${new Date(report.ranAt).toLocaleString("en-AU", { timeZone: "Australia/Melbourne" })} · ${report.localConfigured ? report.municipality : "local watch not configured"}`
            : "No run yet. Statewide sources plus this project’s municipality."}
        </p>
        <Button className="min-h-11" disabled={running} onClick={() => void run()}>
          {running ? "Scouting…" : report ? "Run scout again" : "Run scout"}
        </Button>
      </div>
      {!report ? (
        <p className="text-sm text-muted-foreground">
          This is a practice aid, not legal advice. Scout flags source
          changes. A person drafts any wording change; publishing still needs
          human approval.
        </p>
      ) : (
        <>
          <section className="space-y-3">
            <h2 className="font-heading text-2xl">Statewide</h2>
            {statewide.filter((finding) => finding.action !== "no_change").map((finding) => (
              <FindingCard
                key={finding.id}
                projectId={projectId}
                template={template}
                finding={finding}
                onReport={onReport}
              />
            ))}
            <QuietList
              title="Statewide quiet"
              findings={statewide.filter((finding) => finding.action === "no_change")}
            />
          </section>
          <section className="space-y-3">
            <h2 className="font-heading text-2xl">Municipality</h2>
            {local.filter((finding) => finding.action !== "no_change").map((finding) => (
              <FindingCard
                key={finding.id}
                projectId={projectId}
                template={template}
                finding={finding}
                onReport={onReport}
              />
            ))}
            <QuietList
              title="Local quiet"
              findings={local.filter((finding) => finding.action === "no_change")}
            />
          </section>
        </>
      )}
    </div>
  );
}

function QuietList({
  title,
  findings,
}: {
  title: string;
  findings: ScoutFinding[];
}) {
  if (findings.length === 0) {
    return null;
  }
  return (
    <p className="text-sm text-muted-foreground">
      {title}: {findings.map((finding) => finding.sourceTitle).join(" · ")}
    </p>
  );
}

function FindingCard({
  projectId,
  template,
  finding,
  onReport,
}: {
  projectId: string;
  template: TemplateDocument;
  finding: ScoutFinding;
  onReport: (report: ScoutReport) => void;
}) {
  const [detail, setDetail] = useState(finding.proposed?.detail ?? "");
  const busy = finding.status !== "open";
  const stageLinks = useMemo(
    () =>
      finding.itemIds.map((itemId) => {
        const item = template.items.find((entry) => entry.id === itemId);
        return {
          itemId,
          title: item?.title ?? itemId,
          href: item ? `/p/${projectId}/s/${item.stageId}` : `/p/${projectId}`,
        };
      }),
    [finding.itemIds, projectId, template.items],
  );

  async function flagOnly() {
    try {
      onReport(
        await patchScoutFinding(projectId, finding.id, { status: "flagged" }),
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update");
    }
  }

  async function dismiss() {
    try {
      onReport(
        await patchScoutFinding(projectId, finding.id, { status: "dismissed" }),
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update");
    }
  }

  async function accept() {
    if (!finding.proposed) {
      toast.error("No proposed wording on this finding");
      return;
    }
    const proposed = { ...finding.proposed, detail };
    try {
      if (finding.scope === "statewide") {
        const next = await publishFinding({
          reportId: projectId,
          finding,
          proposed,
        });
        onReport(next.report);
        toast.success(
          `Published template ${next.release.toVersion}. This job has an impact notice to adopt.`,
        );
        return;
      }
      const next = await adoptFindingOnProject({
        projectId,
        finding,
        proposed,
      });
      onReport(next.report);
      toast.success(
        "Wording adopted on this job. Affected checks need recheck; notes were kept.",
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not apply");
    }
  }

  const showAccept =
    Boolean(finding.proposed && detail.trim()) &&
    finding.action !== "no_change" &&
    finding.status === "open" &&
    !isBlockedFinding(finding);

  const blocked = isBlockedFinding(finding);
  const rows = comparisonRows(template, finding, {
    ...finding.proposed,
    detail,
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={blocked ? "outline" : "default"}>
            {findingActionBadge(finding)}
          </Badge>
          <Badge variant="outline">{finding.scope.replaceAll("_", " ")}</Badge>
          {blocked ? null : (
            <Badge variant="secondary">{findingStatusLabel(finding.status)}</Badge>
          )}
          {finding.hashChanged ? <Badge variant="destructive">Hash changed</Badge> : null}
          {finding.baseline ? <Badge variant="outline">Baseline</Badge> : null}
        </div>
        <CardTitle className="text-lg">{finding.sourceTitle}</CardTitle>
        <CardDescription>{findingDisplayFlag(finding)}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {finding.url ? (
          <Button className="min-h-11 w-full sm:w-auto" asChild>
            <a href={finding.url} target="_blank" rel="noreferrer">
              Open source
            </a>
          </Button>
        ) : null}
        {stageLinks.length > 0 ? (
          <div className="space-y-1">
            <p className="text-sm font-medium">Re-read these checks</p>
            <ul className="space-y-1 text-sm">
              {stageLinks.map((link) => (
                <li key={link.itemId}>
                  <Link className="underline underline-offset-2" href={link.href}>
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No checklist items for this typology on this source.
          </p>
        )}
        {blocked || !finding.proposed ? null : <FindingComparison rows={rows} />}
        {blocked || !finding.proposed?.detail ? null : (
          <div className="space-y-1">
            <Label htmlFor={`${finding.id}-proposed`}>Proposed wording</Label>
            <Textarea
              id={`${finding.id}-proposed`}
              className="min-h-24 text-base"
              value={detail}
              disabled={busy}
              onChange={(event) => setDetail(event.target.value)}
            />
          </div>
        )}
        {finding.status === "open" ? (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {showAccept ? (
              <Button className="min-h-11" onClick={() => void accept()}>
                {finding.scope === "statewide"
                  ? "Approve and publish"
                  : "Adopt on this job"}
              </Button>
            ) : null}
            <Button variant="outline" className="min-h-11" onClick={() => void flagOnly()}>
              Flag only
            </Button>
            <Button variant="ghost" className="min-h-11" onClick={() => void dismiss()}>
              Dismiss
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
