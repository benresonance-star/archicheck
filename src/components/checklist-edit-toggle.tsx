"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export function editToggleClass(editing: boolean): string {
  return editing
    ? "border-edit-border bg-edit text-edit-foreground"
    : "border-border bg-card";
}

export function editListClass(editing: boolean): string {
  return editing
    ? "border-edit-border bg-edit text-edit-foreground"
    : "border-border bg-muted/30";
}

export function editPageClass(editing: boolean): string {
  return editing
    ? "rounded-2xl border border-edit-border bg-edit/80 p-3 sm:p-4"
    : "";
}

export function ChecklistEditToggle({
  editing,
  onChange,
}: {
  editing: boolean;
  onChange: (editing: boolean) => void;
}) {
  return (
    <div
      className={cn(
        "flex min-h-11 items-center justify-between gap-3 rounded-xl border px-3",
        editToggleClass(editing),
      )}
    >
      <Label htmlFor="checklist-edit" className="text-sm font-medium">
        {editing ? "Editing" : "Edit checks"}
      </Label>
      <Switch
        id="checklist-edit"
        checked={editing}
        onCheckedChange={onChange}
        aria-label={editing ? "Stop editing checks" : "Edit checks"}
      />
    </div>
  );
}
