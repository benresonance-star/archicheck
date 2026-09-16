"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export function ChecklistEditToggle({
  editing,
  onChange,
}: {
  editing: boolean;
  onChange: (editing: boolean) => void;
}) {
  return (
    <div className="flex min-h-11 items-center justify-between gap-3 rounded-xl border border-border bg-card px-3">
      <Label htmlFor="checklist-edit" className="text-sm font-medium">
        Edit checks
      </Label>
      <Switch
        id="checklist-edit"
        checked={editing}
        onCheckedChange={onChange}
        aria-label="Edit checks"
      />
    </div>
  );
}
