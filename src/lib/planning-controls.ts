import { assertNever, type Site } from "@/lib/types";

export const PLANNING_PROPERTY_REPORT_URL =
  "https://www.planning.vic.gov.au/planning-schemes/planning-property-report";

export const VICPLAN_URL = "https://mapshare.vic.gov.au/vicplan/";

export const VPP_ORDINANCE_BASE =
  "https://planning-schemes.app.planning.vic.gov.au/Victoria%20Planning%20Provisions/ordinance";

export const PLANNING_CONTROLS_SOURCE = {
  label: "Victoria Planning Provisions",
  url: "https://planning-schemes.app.planning.vic.gov.au/Victoria%20Planning%20Provisions",
} as const;

export const ZONE_GROUPS = [
  "residential",
  "industrial",
  "commercial",
  "rural",
  "public-land",
  "special-purpose",
] as const;
export type ZoneGroup = (typeof ZONE_GROUPS)[number];

export const OVERLAY_GROUPS = [
  "environmental-landscape",
  "heritage-built-form",
  "land-management",
  "other",
] as const;
export type OverlayGroup = (typeof OVERLAY_GROUPS)[number];

export type PlanningControl = {
  code: string;
  title: string;
  clause: string | null;
  group: ZoneGroup | OverlayGroup;
};

function vppUrl(clause: string): string {
  return `${VPP_ORDINANCE_BASE}/${clause}`;
}

export function planningControlUrl(control: PlanningControl): string {
  return control.clause ? vppUrl(control.clause) : VICPLAN_URL;
}

export function zoneGroupLabel(group: ZoneGroup): string {
  switch (group) {
    case "residential":
      return "Residential";
    case "industrial":
      return "Industrial";
    case "commercial":
      return "Commercial";
    case "rural":
      return "Rural";
    case "public-land":
      return "Public land";
    case "special-purpose":
      return "Special purpose";
    default:
      return assertNever(group, `Unknown zone group: ${String(group)}`);
  }
}

export function overlayGroupLabel(group: OverlayGroup): string {
  switch (group) {
    case "environmental-landscape":
      return "Environmental and landscape";
    case "heritage-built-form":
      return "Heritage and built form";
    case "land-management":
      return "Land management";
    case "other":
      return "Other overlays";
    default:
      return assertNever(group, `Unknown overlay group: ${String(group)}`);
  }
}

/** Current VPP zones (clauses 32–37), plus Commonwealth land as mapped in VicPlan. */
export const PLANNING_ZONES: PlanningControl[] = [
  { code: "LDRZ", title: "Low Density Residential Zone", clause: "32.03", group: "residential" },
  { code: "MUZ", title: "Mixed Use Zone", clause: "32.04", group: "residential" },
  { code: "TZ", title: "Township Zone", clause: "32.05", group: "residential" },
  { code: "RGZ", title: "Residential Growth Zone", clause: "32.07", group: "residential" },
  { code: "GRZ", title: "General Residential Zone", clause: "32.08", group: "residential" },
  { code: "NRZ", title: "Neighbourhood Residential Zone", clause: "32.09", group: "residential" },
  { code: "HCTZ", title: "Housing Choice and Transport Zone", clause: "32.10", group: "residential" },
  { code: "IN1Z", title: "Industrial 1 Zone", clause: "33.01", group: "industrial" },
  { code: "IN2Z", title: "Industrial 2 Zone", clause: "33.02", group: "industrial" },
  { code: "IN3Z", title: "Industrial 3 Zone", clause: "33.03", group: "industrial" },
  { code: "C1Z", title: "Commercial 1 Zone", clause: "34.01", group: "commercial" },
  { code: "C2Z", title: "Commercial 2 Zone", clause: "34.02", group: "commercial" },
  { code: "C3Z", title: "Commercial 3 Zone", clause: "34.03", group: "commercial" },
  { code: "RLZ", title: "Rural Living Zone", clause: "35.03", group: "rural" },
  { code: "GWZ", title: "Green Wedge Zone", clause: "35.04", group: "rural" },
  { code: "GWAZ", title: "Green Wedge A Zone", clause: "35.05", group: "rural" },
  { code: "RCZ", title: "Rural Conservation Zone", clause: "35.06", group: "rural" },
  { code: "FZ", title: "Farming Zone", clause: "35.07", group: "rural" },
  { code: "RAZ", title: "Rural Activity Zone", clause: "35.08", group: "rural" },
  { code: "PUZ", title: "Public Use Zone", clause: "36.01", group: "public-land" },
  { code: "PPRZ", title: "Public Park and Recreation Zone", clause: "36.02", group: "public-land" },
  { code: "PCRZ", title: "Public Conservation and Resource Zone", clause: "36.03", group: "public-land" },
  { code: "TRZ", title: "Transport Zone", clause: "36.04", group: "public-land" },
  { code: "SUZ", title: "Special Use Zone", clause: "37.01", group: "special-purpose" },
  { code: "CDZ", title: "Comprehensive Development Zone", clause: "37.02", group: "special-purpose" },
  { code: "UFZ", title: "Urban Floodway Zone", clause: "37.03", group: "special-purpose" },
  { code: "CCZ", title: "Capital City Zone", clause: "37.04", group: "special-purpose" },
  { code: "DZ", title: "Docklands Zone", clause: "37.05", group: "special-purpose" },
  { code: "PDZ", title: "Priority Development Zone", clause: "37.06", group: "special-purpose" },
  { code: "UGZ", title: "Urban Growth Zone", clause: "37.07", group: "special-purpose" },
  { code: "ACZ", title: "Activity Centre Zone", clause: "37.08", group: "special-purpose" },
  { code: "PZ", title: "Port Zone", clause: "37.09", group: "special-purpose" },
  { code: "PRZ", title: "Precinct Zone", clause: "37.10", group: "special-purpose" },
  { code: "CA", title: "Commonwealth Land", clause: null, group: "special-purpose" },
];

/** Current VPP overlays (clauses 42–45) as mapped in VicPlan. */
export const PLANNING_OVERLAYS: PlanningControl[] = [
  { code: "ESO", title: "Environmental Significance Overlay", clause: "42.01", group: "environmental-landscape" },
  { code: "VPO", title: "Vegetation Protection Overlay", clause: "42.02", group: "environmental-landscape" },
  { code: "SLO", title: "Significant Landscape Overlay", clause: "42.03", group: "environmental-landscape" },
  { code: "HO", title: "Heritage Overlay", clause: "43.01", group: "heritage-built-form" },
  { code: "DDO", title: "Design and Development Overlay", clause: "43.02", group: "heritage-built-form" },
  { code: "IPO", title: "Incorporated Plan Overlay", clause: "43.03", group: "heritage-built-form" },
  { code: "DPO", title: "Development Plan Overlay", clause: "43.04", group: "heritage-built-form" },
  { code: "NCO", title: "Neighbourhood Character Overlay", clause: "43.05", group: "heritage-built-form" },
  { code: "BFO", title: "Built Form Overlay", clause: "43.06", group: "heritage-built-form" },
  { code: "EMO", title: "Erosion Management Overlay", clause: "44.01", group: "land-management" },
  { code: "SMO", title: "Salinity Management Overlay", clause: "44.02", group: "land-management" },
  { code: "FO", title: "Floodway Overlay", clause: "44.03", group: "land-management" },
  { code: "LSIO", title: "Land Subject to Inundation Overlay", clause: "44.04", group: "land-management" },
  { code: "SBO", title: "Special Building Overlay", clause: "44.05", group: "land-management" },
  { code: "BMO", title: "Bushfire Management Overlay", clause: "44.06", group: "land-management" },
  { code: "SRO", title: "State Resource Overlay", clause: "44.07", group: "land-management" },
  { code: "BAO", title: "Buffer Area Overlay", clause: "44.08", group: "land-management" },
  { code: "PAO", title: "Public Acquisition Overlay", clause: "45.01", group: "other" },
  { code: "AEO", title: "Airport Environs Overlay", clause: "45.02", group: "other" },
  { code: "EAO", title: "Environmental Audit Overlay", clause: "45.03", group: "other" },
  { code: "RXO", title: "Road Closure Overlay", clause: "45.04", group: "other" },
  { code: "RO", title: "Restructure Overlay", clause: "45.05", group: "other" },
  { code: "DCPO", title: "Development Contributions Plan Overlay", clause: "45.06", group: "other" },
  { code: "CLPO", title: "City Link Project Overlay", clause: "45.07", group: "other" },
  { code: "MAEO", title: "Melbourne Airport Environs Overlay", clause: "45.08", group: "other" },
  { code: "PO", title: "Parking Overlay", clause: "45.09", group: "other" },
  { code: "ICPO", title: "Infrastructure Contributions Plan Overlay", clause: "45.10", group: "other" },
  { code: "ICO", title: "Infrastructure Contributions Overlay", clause: "45.11", group: "other" },
  { code: "SCO", title: "Specific Controls Overlay", clause: "45.12", group: "other" },
];

function uniquePreserveOrder(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    if (seen.has(value)) {
      continue;
    }
    seen.add(value);
    out.push(value);
  }
  return out;
}

function splitCodes(value: string): string[] {
  return value
    .split(/[,;/]+/)
    .map((part) => part.trim().toUpperCase().replace(/\s+/g, ""))
    .filter(Boolean);
}

export function parentPlanningCode(
  raw: string,
  catalog: readonly PlanningControl[],
): string | undefined {
  const value = raw.trim().toUpperCase().replace(/\s+/g, "");
  if (!value) {
    return undefined;
  }
  const exact = catalog.find((control) => control.code === value);
  if (exact) {
    return exact.code;
  }
  const prefixed = catalog
    .filter(
      (control) =>
        value.startsWith(control.code) &&
        /^[0-9]/.test(value.slice(control.code.length)),
    )
    .sort((left, right) => right.code.length - left.code.length);
  return prefixed[0]?.code ?? value;
}

export function normalizePlanningCodes(
  values: string[],
  catalog: readonly PlanningControl[],
): string[] {
  const mapped = values.flatMap(splitCodes).map((code) => {
    return parentPlanningCode(code, catalog) ?? code;
  });
  return uniquePreserveOrder(mapped);
}

export function siteZoneCodes(site: Pick<Site, "zone" | "zones">): string[] {
  if (site.zones && site.zones.length > 0) {
    return normalizePlanningCodes(site.zones, PLANNING_ZONES);
  }
  return normalizePlanningCodes(site.zone ? [site.zone] : [], PLANNING_ZONES);
}

export function siteOverlayCodes(site: Pick<Site, "overlays">): string[] {
  return normalizePlanningCodes(site.overlays, PLANNING_OVERLAYS);
}

export function applyPlanningControls(
  site: Site,
  selection: { zones: string[]; overlays: string[] },
): Site {
  const zones = uniquePreserveOrder(selection.zones);
  return {
    ...site,
    zones,
    zone: zones.join(", "),
    overlays: uniquePreserveOrder(selection.overlays),
  };
}

export function formatPlanningCodes(codes: string[]): string {
  return codes.length > 0 ? codes.join(", ") : "None recorded";
}

export function extraPlanningCodes(
  selected: string[],
  catalog: readonly PlanningControl[],
): string[] {
  const known = new Set(catalog.map((control) => control.code));
  return selected.filter((code) => !known.has(code));
}

export function planningControlsInGroup<G extends string>(
  catalog: readonly PlanningControl[],
  group: G,
): PlanningControl[] {
  return catalog.filter((control) => control.group === group);
}
