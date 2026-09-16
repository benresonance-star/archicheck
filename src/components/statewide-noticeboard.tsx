"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
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
import { ScoutSection, SCOUT_HOME_OPEN_KEY } from "@/components/scout-section";
import {
  loadScoutReport,
  loadScoutSettings,
  patchScoutFinding,
  runStatewideScout,
} from "@/lib/client-store";
import {
  cadenceLabel,
  grokBotScoutBrief,
  runnerLabel,
  runnerSummary,
  STATEWIDE_BOARD_ID,
  type ScoutSettings,
} from "@/lib/scout/settings";
import {
  actionLabel,
  findingStatusLabel,
  isBlockedFinding,
  openFindingCount,
  scoutIsDue,
  type ScoutFinding,
  type ScoutReport,
} from "@/lib/scout/types";

export function StatewideNoticeboard({
  compact = false,
  collapsible = false,
}: {
  compact?: boolean;
  collapsible?: boolean;
}) {
  const [settings, setSettings] = useState<ScoutSettings | null>(null);
  const [report, setReport] = useState<ScoutReport | null>(null);
  const [running, setRunning] = useState(false);
  const [blockedOpen, setBlockedOpen] = useState(false);

  useEffect(() => {
    void (async () => {
      setSettings(await loadScoutSettings());
      setReport(await loadScoutReport(STATEWIDE_BOARD_ID));
    })();
  }, []);

  const cadenceDays = settings?.cadenceDays ?? 7;
  const due = scoutIsDue(report?.ranAt ?? null, cadenceDays);
  const open = openFindingCount(report);
  const alerts = useMemo(
    () =>
      (report?.findings ?? []).filter(
        (finding) => finding.action !== "no_change",
      ),
    [report],
  );
  const blocked = alerts.filter((finding) => isBlockedFinding(finding));
  const changes = alerts.filter((finding) => !isBlockedFinding(finding));
  const quiet = (report?.findings ?? []).filter(
    (finding) => finding.action === "no_change",
  );

  async function run() {
    setRunning(true);
    try {
      const next = await runStatewideScout();
      setReport(next);
      toast.success("Statewide scout finished");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Scout failed");
    } finally {
      setRunning(false);
    }
  }

  async function copyGrok() {
    if (!settings) {
      return;
    }
    try {
      await navigator.clipboard.writeText(grokBotScoutBrief(settings));
      toast.success("Grok Bot scout brief copied");
    } catch {
      toast.error("Copy failed");
    }
  }

  if (!settings) {
    return (
      <p className="text-sm text-muted-foreground">Loading noticeboard…</p>
    );
  }

  const badges = [
    due ? (report ? "Run due" : "Not run") : "Up to date",
    runnerLabel(settings.runner),
    changes.length ? `${changes.length} change${changes.length === 1 ? "" : "s"}` : "",
    blocked.length ? `${blocked.length} blocked` : "",
    open && !blocked.length && !changes.length ? `${open} open` : "",
  ].filter(Boolean);

  const body = (
    <>
      <p className="text-sm text-scout-foreground/80">
        {runnerSummary(settings.runner, settings.otherLabel)} Cadence:{" "}
        {cadenceLabel(settings.cadenceDays).toLowerCase()}.
      </p>
      <p className="text-sm text-scout-foreground/80">
        {report
          ? `Last hash-check ${new Date(report.ranAt).toLocaleString("en-AU", { timeZone: "Australia/Melbourne" })}`
          : "No statewide run on this phone yet."}
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button className="min-h-11" disabled={running} onClick={() => void run()}>
          {running ? "Scouting…" : "Check sites now"}
        </Button>
        {settings.runner === "grokbot" ? (
          <Button variant="outline" className="min-h-11" onClick={() => void copyGrok()}>
            Copy Grok Bot brief
          </Button>
        ) : null}
        {compact ? (
          <Button variant="outline" className="min-h-11" asChild>
            <Link href="/scout">Scout process</Link>
          </Button>
        ) : null}
      </div>
      {!report ? (
        <p className="text-sm text-scout-foreground/80">
          Statewide sources include NCC, ARBV, AIA, Master Builders Victoria, HIA,
          planning schemes and the Gazette. Edit the list under Scout process.
        </p>
      ) : alerts.length === 0 ? (
        <p className="text-sm text-scout-foreground/80">
          Noticeboard is quiet
          {quiet.length ? `: ${quiet.map((finding) => finding.sourceTitle).join(" · ")}` : "."}
        </p>
      ) : (
        <div className="space-y-4">
          {changes.length > 0 ? (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Changes to review</h3>
              <FindingList
                compact={compact}
                findings={changes}
                onReport={setReport}
              />
            </div>
          ) : null}
          {blocked.length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-scout-border bg-scout-foreground/5">
              <button
                type="button"
                className="flex min-h-12 w-full items-center justify-between gap-2 px-3 py-2 text-left"
                aria-expanded={blockedOpen}
                onClick={() => setBlockedOpen((value) => !value)}
              >
                <span className="text-sm font-medium">
                  Blocked from this server ({blocked.length})
                </span>
                <ChevronDown
                  className={`size-4 shrink-0 transition-transform ${blockedOpen ? "rotate-180" : ""}`}
                />
              </button>
              {blockedOpen ? (
                <div className="space-y-2 border-t border-scout-border p-3">
                  <p className="text-sm text-scout-foreground/80">
                    BPC and planning.vic.gov.au block automated checks. Open the
                    official page in Safari.
                  </p>
                  <FindingList
                    compact={compact}
                    findings={blocked}
                    onReport={setReport}
                  />
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      )}
    </>
  );

  if (!collapsible) {
    return <div className="space-y-4">{body}</div>;
  }

  return (
    <ScoutSection
      title="Statewide noticeboard"
      subtitle="NCC, ARBV, AIA, builders’ associations and planning. Tap to collapse."
      badges={badges}
      storageKey={compact ? SCOUT_HOME_OPEN_KEY : undefined}
      defaultOpen
    >
      {body}
    </ScoutSection>
  );
}

function FindingList({
  compact,
  findings,
  onReport,
}: {
  compact: boolean;
  findings: ScoutFinding[];
  onReport: (report: ScoutReport) => void;
}) {
  return (
    <ul className="space-y-3">
      {findings.map((finding) => (
        <li key={finding.id}>
          {compact ? (
            <CompactFinding finding={finding} />
          ) : (
            <BoardFinding finding={finding} onReport={onReport} />
          )}
        </li>
      ))}
    </ul>
  );
}

function CompactFinding({ finding }: { finding: ScoutFinding }) {
  return (
    <Card className="border-scout-border bg-scout-foreground/5">
      <CardHeader>
        <div className="flex flex-wrap gap-2">
          <Badge>{actionLabel(finding.action)}</Badge>
          <Badge variant="outline">{findingStatusLabel(finding.status)}</Badge>
        </div>
        <CardTitle className="text-lg">{finding.sourceTitle}</CardTitle>
        <CardDescription className="text-scout-foreground/80">
          {finding.flag}
        </CardDescription>
      </CardHeader>
      {finding.url ? (
        <CardContent>
          <Button className="min-h-11 w-full" asChild>
            <a href={finding.url} target="_blank" rel="noreferrer">
              Open source
            </a>
          </Button>
        </CardContent>
      ) : null}
    </Card>
  );
}

function BoardFinding({
  finding,
  onReport,
}: {
  finding: ScoutFinding;
  onReport: (report: ScoutReport) => void;
}) {
  async function setStatus(status: ScoutFinding["status"]) {
    try {
      onReport(await patchScoutFinding(STATEWIDE_BOARD_ID, finding.id, { status }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update");
    }
  }

  return (
    <Card className="border-scout-border bg-scout-foreground/5">
      <CardHeader>
        <div className="flex flex-wrap gap-2">
          <Badge>{actionLabel(finding.action)}</Badge>
          <Badge variant="outline">{findingStatusLabel(finding.status)}</Badge>
          {finding.hashChanged ? <Badge variant="destructive">Hash changed</Badge> : null}
        </div>
        <CardTitle className="text-lg">{finding.sourceTitle}</CardTitle>
        <CardDescription>{finding.flag}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {finding.url ? (
          <Button className="min-h-11 w-full sm:w-auto" asChild>
            <a href={finding.url} target="_blank" rel="noreferrer">
              Open source
            </a>
          </Button>
        ) : null}
        {finding.proposed?.detail ? (
          <p className="text-sm">{finding.proposed.detail}</p>
        ) : null}
        <p className="text-sm text-muted-foreground">
          To push wording into a project template, open that project’s Code scout.
        </p>
        {finding.status === "open" ? (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button variant="outline" className="min-h-11" onClick={() => void setStatus("flagged")}>
              Flag only
            </Button>
            <Button variant="ghost" className="min-h-11" onClick={() => void setStatus("dismissed")}>
              Dismiss
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
