import { TYPOLOGIES, type Typology } from "@/lib/types";

export const SOURCE_CATEGORIES = [
  "ncc",
  "planning",
  "arbv",
  "aia",
  "builders",
  "gazette",
  "consumer",
  "other",
] as const;
export type SourceCategory = (typeof SOURCE_CATEGORIES)[number];

export type WatchSource = {
  id: string;
  title: string;
  url: string;
  scope: "statewide";
  category: SourceCategory;
  enabled: boolean;
  builtin: boolean;
  itemIds: string[];
  flag: string;
  proposedDetail: string;
  appliesTo: Typology[];
};

const ALL: Typology[] = [...TYPOLOGIES];

function builtin(source: Omit<WatchSource, "scope" | "enabled" | "builtin">): WatchSource {
  return {
    ...source,
    scope: "statewide",
    enabled: true,
    builtin: true,
  };
}

export const DEFAULT_WATCH_SOURCES: WatchSource[] = [
  builtin({
    id: "vpp-amendments",
    title: "Victorian planning scheme amendments (all schemes)",
    url: "https://planning-schemes.app.planning.vic.gov.au/All%20schemes/amendments",
    category: "planning",
    itemIds: ["pd-planning-context", "pd-clauses", "tp-need"],
    flag: "Read the latest statewide (VC) amendments. Tick planning-context and applicable-clause items if a VC amendment touches Clause 54, 55 or 58.",
    proposedDetail:
      "Statewide planning scheme amendments have moved. Recheck zone, overlays and whether Clause 54, 55 or 58 still applies before the next lodgement.",
    appliesTo: ALL,
  }),
  builtin({
    id: "ncc-vic",
    title: "NCC 2022 in Victoria (BPC)",
    url: "https://www.vba.vic.gov.au/building/regulatory-framework/ncc-2022",
    category: "ncc",
    itemIds: ["cd-energy", "doc-ncc", "doc-energy", "doc-livable", "doc-condensation"],
    flag: "Victorian NCC 2022 commencement, 7-star NatHERS, livable housing and condensation / Vic variations.",
    proposedDetail:
      "Victorian NCC 2022 guidance has changed. Confirm 7-star NatHERS, whole-of-home, livable housing and condensation provisions still match the building-permit set.",
    appliesTo: ALL,
  }),
  builtin({
    id: "ncc-abcb",
    title: "National Construction Code (ABCB)",
    url: "https://ncc.abcb.gov.au/",
    category: "ncc",
    itemIds: ["cd-energy", "doc-ncc", "doc-energy"],
    flag: "National NCC editions, adoption dates and ABCB notices that Victoria may pick up.",
    proposedDetail:
      "ABCB has updated NCC guidance. Confirm which edition and Victorian variations apply to this permit set before freezing documentation.",
    appliesTo: ALL,
  }),
  builtin({
    id: "ncc-abcb-2025",
    title: "NCC 2025 hub (ABCB)",
    url: "https://ncc.abcb.gov.au/ncc-2025",
    category: "ncc",
    itemIds: ["cd-energy", "doc-ncc", "doc-energy"],
    flag: "NCC 2025 release, notices and state/territory adoption dates that Victoria may follow.",
    proposedDetail:
      "The NCC 2025 hub has changed. Confirm Victorian adoption timing before treating NCC 2022 as the last word on this permit set.",
    appliesTo: ALL,
  }),
  builtin({
    id: "vic-building-regs",
    title: "Victorian Building Regulations 2018",
    url: "https://www.legislation.vic.gov.au/in-force/statutory-rules/building-regulations-2018/007",
    category: "ncc",
    itemIds: ["ca-permit", "doc-ncc"],
    flag: "Gazetted Building Regulations (the legal hook for NCC in Victoria). Hash-check works on this legislation page even when BPC pages block bots.",
    proposedDetail:
      "The Victorian Building Regulations page has changed. Recheck building-permit and NCC-adoption items.",
    appliesTo: ALL,
  }),
  builtin({
    id: "arbv-process",
    title: "ARBV architectural process",
    url: "https://www.arbv.vic.gov.au/working-architect",
    category: "arbv",
    itemIds: ["pd-arbv", "pd-agreement", "fc-archive"],
    flag: "ARBV published stages, client–architect agreement and record-keeping duties.",
    proposedDetail:
      "ARBV published process or conduct guidance has changed. Confirm a written client–architect agreement is still required before work, and that records must be kept through final certificate.",
    appliesTo: ALL,
  }),
  builtin({
    id: "arbv-home",
    title: "ARBV (registration and news)",
    url: "https://www.arbv.vic.gov.au/",
    category: "arbv",
    itemIds: ["pd-arbv"],
    flag: "Registration, complaints and news that affect who may use the title architect in Victoria.",
    proposedDetail:
      "ARBV has published a registration or conduct update. Confirm the nominated architect still meets ARBV requirements for this job.",
    appliesTo: ALL,
  }),
  builtin({
    id: "aia-vic",
    title: "Australian Institute of Architects — Victorian Chapter",
    url: "https://www.architecture.com.au/vic-chapter",
    category: "aia",
    itemIds: ["pd-arbv", "pd-agreement"],
    flag: "AIA Vic advocacy, practice notes and chapter positions on Victorian planning and building reform.",
    proposedDetail:
      "The AIA Victorian Chapter has published new practice or advocacy material. Recheck whether it changes how this practice briefs clients or lodges in Victoria.",
    appliesTo: ALL,
  }),
  builtin({
    id: "aia-national",
    title: "Australian Institute of Architects (national)",
    url: "https://www.architecture.com.au/",
    category: "aia",
    itemIds: ["pd-arbv"],
    flag: "National AIA policy, contracts and practice updates that flow into Victorian jobs.",
    proposedDetail:
      "AIA national guidance has changed. Confirm whether client agreements, procurement or advocacy positions affect this project.",
    appliesTo: ALL,
  }),
  builtin({
    id: "mbav",
    title: "Master Builders Victoria (policy and industry)",
    url: "https://www.mbav.com.au/policy-advocacy/",
    category: "builders",
    itemIds: ["ca-permit", "ca-inspections"],
    flag: "MBAV / MBV builder-side policy, contracts and industry notices that change how builders price or document Vic houses, townhouses and apartments.",
    proposedDetail:
      "Master Builders Victoria has updated policy or industry advice. Recheck builder contract, preliminaries and documentation expectations before tender.",
    appliesTo: ALL,
  }),
  builtin({
    id: "hia",
    title: "Housing Industry Association",
    url: "https://hia.com.au/",
    category: "builders",
    itemIds: ["ca-permit"],
    flag: "HIA notices on domestic building contracts, NCC adoption and housing policy in Victoria.",
    proposedDetail:
      "HIA has published an industry update. Recheck domestic-building contract and specification assumptions for this dwelling type.",
    appliesTo: ALL,
  }),
  builtin({
    id: "bpc-news",
    title: "Building and Plumbing Commission (news)",
    url: "https://www.vba.vic.gov.au/news",
    category: "ncc",
    itemIds: ["ca-permit", "doc-ncc"],
    flag: "BPC / former VBA news: practitioner duties, inspections, plumbing and building-permit practice.",
    proposedDetail:
      "The Building and Plumbing Commission has published a practice or news update. Recheck building-permit and inspection items.",
    appliesTo: ALL,
  }),
  builtin({
    id: "townhouse-code",
    title: "Townhouse and Low-Rise Code (Clause 55)",
    url: "https://planning-schemes.app.planning.vic.gov.au/All%20schemes/55",
    category: "planning",
    itemIds: ["cd-cl55", "tp-cl55", "cd-canopy"],
    flag: "Gazetted Clause 55 (Townhouse and Low-Rise Code): deemed-to-comply standards, setbacks and tree-canopy percentages.",
    proposedDetail:
      "Clause 55 / Townhouse and Low-Rise Code guidance has changed. Recheck deemed-to-comply standards, setbacks, and the 10%/20% tree canopy rule before freezing townhouse massing.",
    appliesTo: ["townhouse"],
  }),
  builtin({
    id: "better-apartments",
    title: "Better Apartments Design Standards",
    url: "https://planning-schemes.app.planning.vic.gov.au/All%20schemes/58",
    category: "planning",
    itemIds: [
      "pd-bads",
      "cd-apartments",
      "cd-bads-communal",
      "cd-bads-layout",
      "cd-bads-depth",
      "cd-bads-pos",
      "tp-cl58",
      "tp-cl5507",
      "dd-landscape",
      "dd-bads-deep-soil",
    ],
    flag: "Gazetted Better Apartments Design Standards (Clause 55.07 / 58): communal open space, deep soil, room depth, functional layout, wind and internal amenity.",
    proposedDetail:
      "Better Apartments / Clause 55.07 or 58 guidance has changed. Recheck communal open space, deep soil, wind and apartment layout standards.",
    appliesTo: ["apartment"],
  }),
  builtin({
    id: "developer-bond",
    title: "Apartment developer bond (Buyer Protections)",
    url: "https://www.vic.gov.au/new-bond-system-apartment-builders",
    category: "consumer",
    itemIds: ["ca-bond", "dlp-bond-prelim", "dlp-bond-final"],
    flag: "2% apartment developer bond, storey threshold and 1 July 2027 timing.",
    proposedDetail:
      "The apartment developer bond scheme page has changed. Recheck whether this building (storeys and building-permit date) must lodge a 2% bond with the BPC before occupancy.",
    appliesTo: ["apartment"],
  }),
  builtin({
    id: "gazette",
    title: "Victoria Government Gazette",
    url: "https://www.gazette.vic.gov.au/",
    category: "gazette",
    itemIds: ["tp-need", "ca-permit"],
    flag: "Gazettal of planning and building commencement notices, Building Regulations and scheme amendments.",
    proposedDetail:
      "A Gazette notice may have commenced a planning or building change. Confirm commencement dates before treating the current checklist wording as current law.",
    appliesTo: ALL,
  }),
];

/** @deprecated use DEFAULT_WATCH_SOURCES — kept for existing tests */
export const STATEWIDE_SOURCES = DEFAULT_WATCH_SOURCES;

export type PreviousSnapshot = {
  sourceId: string;
  sha256: string;
};

export function isSourceCategory(value: string): value is SourceCategory {
  return (SOURCE_CATEGORIES as readonly string[]).includes(value);
}

export function parseWatchSources(raw: unknown): WatchSource[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const sources: WatchSource[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") {
      continue;
    }
    const record = row as Record<string, unknown>;
    const url = typeof record.url === "string" ? record.url.trim() : "";
    if (!url.startsWith("https://") || sources.length >= 40) {
      continue;
    }
    const id =
      typeof record.id === "string" && record.id.trim()
        ? record.id.trim().slice(0, 80)
        : `custom-${sources.length}`;
    const appliesTo = Array.isArray(record.appliesTo)
      ? record.appliesTo.filter(
          (value): value is Typology =>
            value === "house" || value === "townhouse" || value === "apartment",
        )
      : ALL;
    const category =
      typeof record.category === "string" && isSourceCategory(record.category)
        ? record.category
        : "other";
    sources.push({
      id,
      title:
        typeof record.title === "string" && record.title.trim()
          ? record.title.trim().slice(0, 160)
          : url,
      url,
      scope: "statewide",
      category,
      enabled: record.enabled !== false,
      builtin: record.builtin === true,
      itemIds: Array.isArray(record.itemIds)
        ? record.itemIds.filter((value): value is string => typeof value === "string")
        : [],
      flag: typeof record.flag === "string" ? record.flag : "",
      proposedDetail:
        typeof record.proposedDetail === "string" ? record.proposedDetail : "",
      appliesTo: appliesTo.length > 0 ? appliesTo : ALL,
    });
  }
  return sources;
}
