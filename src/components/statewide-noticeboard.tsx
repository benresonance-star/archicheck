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
  openFindingCount,
  scoutIsDue,
  type ScoutFinding,
  type ScoutReport,
} from "@/lib/scout/types";

export function StatewideNoticeboard({ compact = false }: { compact?: boolean }) {
  const [settings, setSettings] = useState<ScoutSettings | null>(null);
  const [report, setReport] = useState<ScoutReport | null>(null);
  const [running, setRunning] = useState(false);

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

  const shown = compact ? alerts.slice(0, 4) : alerts;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={due ? "destructive" : "secondary"}>
          {due ? (report ? `${cadenceLabel(cadenceDays)} run due` : "Not run yet") : "Up to date"}
        </Badge>
        <Badge variant="outline">{runnerLabel(settings.runner)}</Badge>
        {open ? <Badge>{open} open</Badge> : null}
      </div>
      <p className="text-sm text-muted-foreground">
        {runnerSummary(settings.runner, settings.otherLabel)} Cadence:{" "}
        {cadenceLabel(settings.cadenceDays).toLowerCase()}.
      </p>
      <p className="text-sm text-muted-foreground">
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
        <p className="text-sm text-muted-foreground">
          Statewide sources include NCC, ARBV, AIA, Master Builders Victoria, HIA,
          planning schemes and the Gazette. Edit the list under Scout process.
        </p>
      ) : shown.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Noticeboard is quiet
          {quiet.length ? `: ${quiet.map((finding) => finding.sourceTitle).join(" · ")}` : "."}
        </p>
      ) : (
        <ul className="space-y-3">
          {shown.map((finding) => (
            <li key={finding.id}>
              {compact ? (
                <CompactFinding finding={finding} />
              ) : (
                <BoardFinding
                  finding={finding}
                  onReport={setReport}
                />
              )}
            </li>
          ))}
        </ul>
      )}
      {compact && alerts.length > 4 ? (
        <p className="text-sm text-muted-foreground">
          <Link className="underline underline-offset-2" href="/scout">
            {alerts.length - 4} more on the full noticeboard
          </Link>
        </p>
      ) : null}
    </section>
  );
}

function CompactFinding({ finding }: { finding: ScoutFinding }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap gap-2">
          <Badge>{actionLabel(finding.action)}</Badge>
          <Badge variant="outline">{findingStatusLabel(finding.status)}</Badge>
        </div>
        <CardTitle className="text-lg">{finding.sourceTitle}</CardTitle>
        <CardDescription>{finding.flag}</CardDescription>
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
    <Card>
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
            <a
              href={finding.url}
              target="_blank"
              rel="noreferrer"
            >
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
