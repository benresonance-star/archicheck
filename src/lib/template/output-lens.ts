import type { ChecklistItem, TemplateDocument, Typology } from "@/lib/types";
import { assertNever, itemsForTypology } from "@/lib/types";

export const OUTPUT_KINDS = [
  "client-brief",
  "report",
  "site-plan",
  "demolition",
  "plans",
  "rcp",
  "elevations",
  "sections",
  "details",
  "roof-plan",
  "schedules",
  "specification",
  "drawing-standards",
  "record",
] as const;
export type OutputKind = (typeof OUTPUT_KINDS)[number];

export type OutputKindMeta = {
  id: OutputKind;
  title: string;
  summary: string;
};

export const OUTPUT_KIND_META: Record<OutputKind, Omit<OutputKindMeta, "id">> = {
  "client-brief": {
    title: "Client brief",
    summary: "Brief, sign-off and stage-change notes the client sees.",
  },
  report: {
    title: "Report",
    summary: "Planning, energy, amenity and compliance reports that sit beside the drawings.",
  },
  "site-plan": {
    title: "Site plan",
    summary: "Title, survey, set-out, landscape, parking and neighbouring interfaces.",
  },
  demolition: {
    title: "Demolition",
    summary: "Existing conditions, retain versus demolish, and protection works.",
  },
  plans: {
    title: "Plans",
    summary: "Floor plans, GA, massing and coordinated plan sets.",
  },
  rcp: {
    title: "RCP",
    summary: "Reflected ceiling plans — heights, lighting, mechanical and detection.",
  },
  elevations: {
    title: "Elevations",
    summary: "External faces, heights, openings and material expression.",
  },
  sections: {
    title: "Sections",
    summary: "Cut-throughs, stairs, levels and clearances.",
  },
  details: {
    title: "Details",
    summary: "Junctions, waterproofing, livable-housing and condensation build-ups.",
  },
  "roof-plan": {
    title: "Roof plan",
    summary: "Falls, gutters, plant, penetrations and safe access.",
  },
  schedules: {
    title: "Schedules",
    summary: "Doors, windows, hardware, materials and FFE.",
  },
  specification: {
    title: "Specification",
    summary: "Written spec that matches the drawing issue.",
  },
  "drawing-standards": {
    title: "Cover and drawing standards",
    summary: "Title block, north, scale, stamp, index and cross-referencing on every sheet.",
  },
  record: {
    title: "Record",
    summary: "Tender, contract administration, occupancy, defects and archive records.",
  },
};

const DELIVERABLE_OUTPUT_KIND: Record<string, OutputKind> = {
  "del-pd-site": "site-plan",
  "del-sk-concept": "plans",
  "del-dd-set": "plans",
  "del-tp-set": "plans",
  "del-cd-working": "drawing-standards",
  "del-cd-demo": "demolition",
  "del-cd-site": "site-plan",
  "del-cd-ga": "plans",
  "del-cd-rcp": "rcp",
  "del-cd-elev": "elevations",
  "del-cd-roof": "roof-plan",
  "del-cd-schedules": "schedules",
  "del-cd-spec": "specification",
  "del-tn-set": "record",
  "del-ca-ifc": "record",
  "del-pc-record": "record",
  "del-dlp-register": "record",
  "del-fc-pack": "record",
  "del-poe-record": "record",
};

const ITEM_OUTPUT_KIND: Record<string, OutputKind> = {
  "pd-arbv": "record",
  "pd-agreement": "client-brief",
  "pd-brief": "client-brief",
  "pd-title": "site-plan",
  "pd-oc": "report",
  "pd-planning-context": "report",
  "pd-clauses": "report",
  "pd-bads": "report",
  "pd-survey": "site-plan",
  "pd-services": "site-plan",
  "pd-hazards": "report",
  "pd-budget": "client-brief",
  "pd-neighbours": "report",
  "cd-site-analysis": "site-plan",
  "cd-options": "plans",
  "cd-massing": "plans",
  "cd-cl55": "plans",
  "cd-canopy": "plans",
  "cd-apartments": "plans",
  "cd-bads-communal": "plans",
  "cd-bads-pos": "plans",
  "cd-bads-layout": "plans",
  "cd-bads-depth": "plans",
  "cd-bads-setback": "plans",
  "cd-bads-storage": "plans",
  "cd-energy": "report",
  "cd-livable": "report",
  "cd-parking": "site-plan",
  "cd-signoff": "client-brief",
  "dd-gas": "plans",
  "dd-consultants": "record",
  "dd-nathers": "report",
  "dd-storm": "site-plan",
  "dd-amenity": "plans",
  "dd-landscape": "site-plan",
  "dd-bads-deep-soil": "site-plan",
  "dd-bess": "report",
  "dd-wind": "report",
  "dd-acoustic": "report",
  "dd-bads-entry": "plans",
  "dd-bads-vent": "plans",
  "dd-bads-materials": "elevations",
  "dd-bads-access": "plans",
  "dd-waste": "site-plan",
  "dd-client-lodge": "client-brief",
  "tp-need": "report",
  "tp-cl54": "report",
  "tp-cl55": "report",
  "tp-cl58": "report",
  "tp-cl5507": "report",
  "tp-nsd": "site-plan",
  "tp-set": "plans",
  "tp-reports": "report",
  "tp-lodge": "record",
  "tp-rfi": "record",
  "tp-permit": "record",
  "tp-subdivision": "record",
  "doc-tp-match": "plans",
  "doc-working": "drawing-standards",
  "doc-ncc": "report",
  "doc-energy": "report",
  "doc-livable": "details",
  "doc-condensation": "details",
  "doc-structure": "plans",
  "doc-waterproofing": "details",
  "doc-part5": "report",
  "doc-manual": "record",
  "doc-cd-brief": "client-brief",
  "doc-cd-conditions": "report",
  "doc-cd-nonconforming": "report",
  "doc-cd-closeout": "client-brief",
  "tn-set": "record",
  "tn-rfi": "record",
  "tn-compare": "record",
  "tn-builder": "record",
  "tn-contract": "record",
  "tn-rbs": "record",
  "ca-permit": "record",
  "ca-inspections": "record",
  "ca-meetings": "record",
  "ca-variations": "record",
  "ca-claims": "record",
  "ca-oc": "record",
  "ca-bond": "record",
  "ca-oc-setup": "record",
  "pc-inspect": "record",
  "pc-list": "record",
  "pc-handover": "record",
  "pc-certificate": "record",
  "dlp-period": "record",
  "dlp-track": "record",
  "dlp-bond-prelim": "record",
  "dlp-bond-final": "record",
  "dlp-close": "record",
  "fc-inspect": "record",
  "fc-issue": "record",
  "fc-security": "record",
  "fc-archive": "record",
  "poe-survey": "record",
  "poe-energy": "record",
  "poe-landscape": "record",
  "poe-lessons": "record",
  "dw-sk-titleblock": "drawing-standards",
  "dw-dd-index": "drawing-standards",
  "dw-dd-consult": "record",
  "dw-tp-title": "drawing-standards",
  "dw-tp-assessment": "report",
  "dw-tp-summary": "report",
  "dw-tp-neighbour": "site-plan",
  "dw-cd-elev-heights": "elevations",
  "dw-cd-elev-openings": "elevations",
  "dw-cd-elev-junctions": "details",
  "dw-cd-elev-stairs": "sections",
};

export function isOutputKind(value: string): value is OutputKind {
  return (OUTPUT_KINDS as readonly string[]).includes(value);
}

export function outputKindLabel(kind: OutputKind): string {
  switch (kind) {
    case "client-brief":
    case "report":
    case "site-plan":
    case "demolition":
    case "plans":
    case "rcp":
    case "elevations":
    case "sections":
    case "details":
    case "roof-plan":
    case "schedules":
    case "specification":
    case "drawing-standards":
    case "record":
      return OUTPUT_KIND_META[kind].title;
    default:
      return assertNever(kind, `Unknown output kind: ${String(kind)}`);
  }
}

export function outputKindForItem(item: ChecklistItem): OutputKind | undefined {
  const explicit = ITEM_OUTPUT_KIND[item.id];
  if (explicit) {
    return explicit;
  }
  if (item.deliverableId) {
    return DELIVERABLE_OUTPUT_KIND[item.deliverableId];
  }
  return undefined;
}

export type OutputLensGroup = {
  kind: OutputKind;
  title: string;
  summary: string;
  items: ChecklistItem[];
};

export function groupedOutputDocuments(
  template: TemplateDocument,
  typology: Typology,
): OutputLensGroup[] {
  const items = itemsForTypology(template.items, typology);
  const buckets = new Map<OutputKind, ChecklistItem[]>();
  for (const item of items) {
    const kind = outputKindForItem(item);
    if (!kind) {
      continue;
    }
    const list = buckets.get(kind) ?? [];
    list.push(item);
    buckets.set(kind, list);
  }
  return OUTPUT_KINDS.filter((kind) => (buckets.get(kind) ?? []).length > 0).map(
    (kind) => ({
      kind,
      title: OUTPUT_KIND_META[kind].title,
      summary: OUTPUT_KIND_META[kind].summary,
      items: buckets.get(kind) ?? [],
    }),
  );
}
