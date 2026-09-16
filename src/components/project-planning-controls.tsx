"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  PlanningControlsFields,
  PlanningReportLinks,
} from "@/components/planning-controls-fields";
import { Button } from "@/components/ui/button";
import { updateSite } from "@/lib/client-store";
import {
  applyPlanningControls,
  formatPlanningCodes,
  siteOverlayCodes,
  siteZoneCodes,
} from "@/lib/planning-controls";
import type { ProjectDocument } from "@/lib/types";

export function ProjectPlanningControls({
  project,
  onProject,
}: {
  project: ProjectDocument;
  onProject: (project: ProjectDocument) => void;
}) {
  const [zones, setZones] = useState(() => siteZoneCodes(project.site));
  const [overlays, setOverlays] = useState(() => siteOverlayCodes(project.site));
  const [pending, setPending] = useState(false);

  async function save() {
    setPending(true);
    try {
      const next = await updateSite(
        project.id,
        applyPlanningControls(project.site, { zones, overlays }),
      );
      onProject(next);
      toast.success("Zones and overlays saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="space-y-3">
      <h2 className="font-heading text-2xl">Zone and overlays</h2>
      <p className="text-sm">
        <span className="font-medium">Zones</span> {formatPlanningCodes(zones)}
      </p>
      <p className="text-sm">
        <span className="font-medium">Overlays</span>{" "}
        {formatPlanningCodes(overlays)}
      </p>
      <PlanningReportLinks />
      <details className="rounded-2xl border border-border bg-card px-3 py-2">
        <summary className="min-h-11 cursor-pointer list-inside font-medium">
          Change zones and overlays
        </summary>
        <div className="space-y-4 pb-3 pt-2">
          <PlanningControlsFields
            zones={zones}
            overlays={overlays}
            onZonesChange={setZones}
            onOverlaysChange={setOverlays}
            showIntro={false}
          />
          <Button
            type="button"
            className="min-h-11 w-full"
            disabled={pending}
            onClick={() => void save()}
          >
            {pending ? "Saving…" : "Save zones and overlays"}
          </Button>
        </div>
      </details>
    </section>
  );
}
