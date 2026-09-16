"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { loadScoutReport, loadScoutSettings } from "@/lib/client-store";
import { openFindingCount, scoutIsDue } from "@/lib/scout/types";

export function ScoutBanner({ projectId }: { projectId: string }) {
  const [label, setLabel] = useState("Scout");
  const [tone, setTone] = useState<"due" | "open" | "ok">("ok");

  useEffect(() => {
    void (async () => {
      const [report, settings] = await Promise.all([
        loadScoutReport(projectId),
        loadScoutSettings(),
      ]);
      const open = openFindingCount(report);
      const due = scoutIsDue(report?.ranAt ?? null, settings.cadenceDays);
      if (due) {
        setTone("due");
        setLabel(report ? "Scout due" : "Run scout");
      } else if (open > 0) {
        setTone("open");
        setLabel(`${open} scout ${open === 1 ? "finding" : "findings"}`);
      } else {
        setTone("ok");
        setLabel("Scout quiet");
      }
    })();
  }, [projectId]);

  return (
    <Button variant="outline" className="min-h-11 w-full" asChild>
      <Link href={`/p/${projectId}/scout`} className="flex items-center justify-center gap-2">
        Code scout
        <Badge variant={tone === "ok" ? "secondary" : "destructive"}>{label}</Badge>
      </Link>
    </Button>
  );
}