"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  extraPlanningCodes,
  overlayGroupLabel,
  OVERLAY_GROUPS,
  PLANNING_CONTROLS_SOURCE,
  PLANNING_OVERLAYS,
  PLANNING_PROPERTY_REPORT_URL,
  PLANNING_ZONES,
  planningControlUrl,
  planningControlsInGroup,
  VICPLAN_URL,
  zoneGroupLabel,
  ZONE_GROUPS,
  type PlanningControl,
} from "@/lib/planning-controls";

export function PlanningReportLinks() {
  return (
    <p className="text-sm leading-relaxed">
      Confirm the lot on the{" "}
      <a
        href={PLANNING_PROPERTY_REPORT_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-link underline underline-offset-2"
      >
        Vic planning property report
      </a>
      {" · "}
      <a
        href={VICPLAN_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-link underline underline-offset-2"
      >
        VicPlan map
      </a>
      . Tick every zone or overlay that applies. Split-zoned lots can have more
      than one of each. Codes follow the{" "}
      <a
        href={PLANNING_CONTROLS_SOURCE.url}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-link underline underline-offset-2"
      >
        {PLANNING_CONTROLS_SOURCE.label}
      </a>
      . Schedule numbers (GRZ2, HO327) sit on the report.
    </p>
  );
}

export function PlanningControlsFields({
  zones,
  overlays,
  onZonesChange,
  onOverlaysChange,
  showIntro = true,
}: {
  zones: string[];
  overlays: string[];
  onZonesChange: (zones: string[]) => void;
  onOverlaysChange: (overlays: string[]) => void;
  showIntro?: boolean;
}) {
  return (
    <div className="space-y-5">
      {showIntro ? <PlanningReportLinks /> : null}
      <ControlFieldset
        legend="Zones"
        catalog={PLANNING_ZONES}
        groups={ZONE_GROUPS}
        groupLabel={zoneGroupLabel}
        selected={zones}
        idPrefix="zone"
        onChange={onZonesChange}
      />
      <ControlFieldset
        legend="Overlays"
        catalog={PLANNING_OVERLAYS}
        groups={OVERLAY_GROUPS}
        groupLabel={overlayGroupLabel}
        selected={overlays}
        idPrefix="overlay"
        onChange={onOverlaysChange}
      />
    </div>
  );
}

function ControlFieldset<G extends string>({
  legend,
  catalog,
  groups,
  groupLabel,
  selected,
  idPrefix,
  onChange,
}: {
  legend: string;
  catalog: readonly PlanningControl[];
  groups: readonly G[];
  groupLabel: (group: G) => string;
  selected: string[];
  idPrefix: string;
  onChange: (next: string[]) => void;
}) {
  const extras = extraPlanningCodes(selected, catalog);
  return (
    <fieldset className="space-y-3 rounded-2xl border border-border bg-card px-3 py-3">
      <legend className="px-1 font-heading text-lg">{legend}</legend>
      {extras.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Also recorded on this project
          </p>
          {extras.map((code) => (
            <ControlRow
              key={`${idPrefix}-extra-${code}`}
              id={`${idPrefix}-${code}`}
              code={code}
              title="Recorded on an earlier save"
              sourceHref={PLANNING_CONTROLS_SOURCE.url}
              sourceLabel="VPP"
              checked={selected.includes(code)}
              onCheckedChange={(checked) =>
                onChange(toggleCode(selected, code, checked))
              }
            />
          ))}
        </div>
      ) : null}
      {groups.map((group) => {
        const controls = planningControlsInGroup(catalog, group);
        if (controls.length === 0) {
          return null;
        }
        return (
          <div key={String(group)} className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
              {groupLabel(group)}
            </p>
            <div className="space-y-1">
              {controls.map((control) => (
                <ControlRow
                  key={control.code}
                  id={`${idPrefix}-${control.code}`}
                  code={control.code}
                  title={control.title}
                  sourceHref={planningControlUrl(control)}
                  sourceLabel={control.clause ? `cl ${control.clause}` : "VicPlan"}
                  checked={selected.includes(control.code)}
                  onCheckedChange={(checked) =>
                    onChange(toggleCode(selected, control.code, checked))
                  }
                />
              ))}
            </div>
          </div>
        );
      })}
    </fieldset>
  );
}

function ControlRow({
  id,
  code,
  title,
  sourceHref,
  sourceLabel,
  checked,
  onCheckedChange,
}: {
  id: string;
  code: string;
  title: string;
  sourceHref: string;
  sourceLabel: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start gap-3 py-1">
      <Checkbox
        id={id}
        checked={checked}
        className="mt-1 size-5"
        onCheckedChange={(value) => onCheckedChange(value === true)}
      />
      <div className="min-h-11 flex-1 leading-snug">
        <Label htmlFor={id} className="font-normal">
          <span className="font-medium">{code}</span>
          {" — "}
          {title}
        </Label>
        {" · "}
        <a
          href={sourceHref}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-link underline underline-offset-2"
        >
          {sourceLabel}
        </a>
      </div>
    </div>
  );
}

function toggleCode(selected: string[], code: string, checked: boolean): string[] {
  if (checked) {
    return selected.includes(code) ? selected : [...selected, code];
  }
  return selected.filter((value) => value !== code);
}
