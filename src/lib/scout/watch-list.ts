import type { Typology } from "@/lib/types";

export type WatchSource = {
  id: string;
  title: string;
  url: string;
  scope: "statewide";
  itemIds: string[];
  flag: string;
  proposedDetail: string;
  appliesTo: Typology[];
};

export const STATEWIDE_SOURCES: WatchSource[] = [
  {
    id: "vpp-amendments",
    title: "Victorian planning scheme amendments (all schemes)",
    url: "https://planning-schemes.app.planning.vic.gov.au/All%20schemes/amendments",
    scope: "statewide",
    itemIds: ["pd-planning-context", "pd-clauses", "tp-need"],
    flag: "Read the latest statewide (VC) amendments. Tick planning-context and applicable-clause items if a VC amendment touches Clause 54, 55 or 58.",
    proposedDetail:
      "Statewide planning scheme amendments have moved. Recheck zone, overlays and whether Clause 54, 55 or 58 still applies before the next lodgement.",
    appliesTo: ["house", "townhouse", "apartment"],
  },
  {
    id: "townhouse-code",
    title: "Townhouse and Low-Rise Code (Clause 55)",
    url: "https://www.planning.vic.gov.au/guides-and-resources/guides/all-guides/residential-development/townhouse-and-low-rise-code",
    scope: "statewide",
    itemIds: ["cd-cl55", "tp-cl55", "cd-canopy"],
    flag: "Read the Townhouse and Low-Rise Code page. Tick Clause 55 and tree-canopy items if deemed-to-comply standards or canopy percentages changed.",
    proposedDetail:
      "Clause 55 / Townhouse and Low-Rise Code guidance has changed. Recheck deemed-to-comply standards, setbacks, and the 10%/20% tree canopy rule before freezing townhouse massing.",
    appliesTo: ["townhouse"],
  },
  {
    id: "better-apartments",
    title: "Better Apartments Design Standards",
    url: "https://www.planning.vic.gov.au/guides-and-resources/guides/all-guides/better-apartments",
    scope: "statewide",
    itemIds: ["cd-apartments", "tp-cl58", "dd-landscape"],
    flag: "Read Better Apartments. Tick apartment-mix and Clause 55.07/58 items if landscaping, wind or internal amenity standards moved.",
    proposedDetail:
      "Better Apartments / Clause 55.07 or 58 guidance has changed. Recheck communal open space, deep soil, wind and apartment layout standards.",
    appliesTo: ["apartment"],
  },
  {
    id: "ncc-vic",
    title: "NCC 2022 in Victoria (BPC)",
    url: "https://www.vba.vic.gov.au/building/regulatory-framework/ncc-2022",
    scope: "statewide",
    itemIds: ["cd-energy", "doc-ncc", "doc-energy", "doc-livable", "doc-condensation"],
    flag: "Read the BPC NCC 2022 page. Tick 7-star, livable housing and condensation documentation items if commencement or Vic variations changed.",
    proposedDetail:
      "Victorian NCC 2022 guidance has changed. Confirm 7-star NatHERS, whole-of-home, livable housing and condensation provisions still match the building-permit set.",
    appliesTo: ["house", "townhouse", "apartment"],
  },
  {
    id: "developer-bond",
    title: "Apartment developer bond (Buyer Protections)",
    url: "https://www.vic.gov.au/new-bond-system-apartment-builders",
    scope: "statewide",
    itemIds: ["ca-bond", "dlp-bond-prelim", "dlp-bond-final"],
    flag: "Read the developer bond page. Tick bond and 15–18 / 21–24 month inspection items if storey threshold or 1 July 2027 timing moved.",
    proposedDetail:
      "The apartment developer bond scheme page has changed. Recheck whether this building (storeys and building-permit date) must lodge a 2% bond with the BPC before occupancy.",
    appliesTo: ["apartment"],
  },
  {
    id: "arbv-process",
    title: "ARBV architectural process",
    url: "https://www.arbv.vic.gov.au/working-architect",
    scope: "statewide",
    itemIds: ["pd-arbv", "pd-agreement", "fc-archive"],
    flag: "Read the ARBV process page. Tick registration, client–architect agreement and archive items if the published stages or conduct duties changed.",
    proposedDetail:
      "ARBV published process or conduct guidance has changed. Confirm a written client–architect agreement is still required before work, and that records must be kept through final certificate.",
    appliesTo: ["house", "townhouse", "apartment"],
  },
  {
    id: "gazette",
    title: "Victoria Government Gazette",
    url: "https://www.gazette.vic.gov.au/",
    scope: "statewide",
    itemIds: ["tp-need", "ca-permit"],
    flag: "Scan recent gazettes for planning and building commencement notices. Tick planning-permit-required and building-permit items if a notice names this scheme or the Building Regulations.",
    proposedDetail:
      "A Gazette notice may have commenced a planning or building change. Confirm commencement dates before treating the current checklist wording as current law.",
    appliesTo: ["house", "townhouse", "apartment"],
  },
];

export type PreviousSnapshot = {
  sourceId: string;
  sha256: string;
};
