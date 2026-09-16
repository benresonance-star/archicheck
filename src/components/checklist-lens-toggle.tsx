"use client";

import { Button } from "@/components/ui/button";
import { assertNever } from "@/lib/types";

export const CHECKLIST_LENSES = ["document", "stage"] as const;
export type ChecklistLens = (typeof CHECKLIST_LENSES)[number];

export function checklistLensSummary(lens: ChecklistLens): string {
  switch (lens) {
    case "document":
      return "Checks grouped by output document — plans, RCP, elevations, sections, details, schedules, specification, brief and reports.";
    case "stage":
      return "Checks grouped by ARBV stage.";
    default:
      return assertNever(lens, `Unknown checklist lens: ${String(lens)}`);
  }
}

export function ChecklistLensToggle({
  lens,
  onChange,
}: {
  lens: ChecklistLens;
  onChange: (lens: ChecklistLens) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <Button
        type="button"
        variant={lens === "document" ? "default" : "outline"}
        className="min-h-11"
        aria-pressed={lens === "document"}
        onClick={() => onChange("document")}
      >
        By document
      </Button>
      <Button
        type="button"
        variant={lens === "stage" ? "default" : "outline"}
        className="min-h-11"
        aria-pressed={lens === "stage"}
        onClick={() => onChange("stage")}
      >
        By stage
      </Button>
    </div>
  );
}
