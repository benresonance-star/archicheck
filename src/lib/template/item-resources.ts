import type { ChecklistResource } from "@/lib/types";

function link(label: string, url: string): ChecklistResource {
  return { label, url };
}

const ARBV = link("ARBV", "https://www.arbv.vic.gov.au/");
const ARBV_WORK = link(
  "ARBV — working as an architect",
  "https://www.arbv.vic.gov.au/working-architect",
);
const ARCHITECTS_ACT = link(
  "Architects Act 1991 (Vic)",
  "https://www.legislation.vic.gov.au/in-force/acts/architects-act-1991",
);
const LANDATA = link(
  "LANDATA / Land Use Victoria",
  "https://www.land.vic.gov.au/land-registration",
);
const VICPLAN = link("VicPlan maps", "https://mapshare.vic.gov.au/vicplan/");
const VPP = link(
  "Victorian planning schemes",
  "https://planning-schemes.app.planning.vic.gov.au/",
);
const CL54 = link(
  "VPP Clause 54",
  "https://planning-schemes.app.planning.vic.gov.au/All%20schemes/54",
);
const CL55 = link(
  "VPP Clause 55",
  "https://planning-schemes.app.planning.vic.gov.au/All%20schemes/55",
);
const CL5507 = link(
  "VPP Clause 55.07",
  "https://planning-schemes.app.planning.vic.gov.au/All%20schemes/55.07",
);
const CL58 = link(
  "VPP Clause 58",
  "https://planning-schemes.app.planning.vic.gov.au/All%20schemes/58",
);
const BADS = link(
  "Better Apartments Design Standards",
  "https://www.planning.vic.gov.au/guides-and-resources/guides/all-guides/better-apartments",
);
const CL5206 = link(
  "VPP Clause 52.06 (parking)",
  "https://planning-schemes.app.planning.vic.gov.au/All%20schemes/52.06",
);
const CL5318 = link(
  "VPP Clause 53.18 (stormwater)",
  "https://planning-schemes.app.planning.vic.gov.au/All%20schemes/53.18",
);
const PE_ACT = link(
  "Planning and Environment Act 1987 (Vic)",
  "https://www.legislation.vic.gov.au/in-force/acts/planning-and-environment-act-1987",
);
const BUILDING_ACT = link(
  "Building Act 1993 (Vic)",
  "https://www.legislation.vic.gov.au/in-force/acts/building-act-1993",
);
const BUILDING_REGS = link(
  "Building Regulations 2018 (Vic)",
  "https://www.legislation.vic.gov.au/in-force/statutory-rules/building-regulations-2018/007",
);
const NCC = link("NCC (ABCB)", "https://ncc.abcb.gov.au/");
const NATHERS = link("NatHERS", "https://www.nathers.gov.au/");
const BPC = link("Building and Plumbing Commission", "https://www.vba.vic.gov.au/");
const BPC_NCC = link(
  "NCC 2022 in Victoria (BPC)",
  "https://www.vba.vic.gov.au/building/regulatory-framework/ncc-2022",
);
const DBC = link(
  "Domestic Building Contracts Act 1995 (Vic)",
  "https://www.legislation.vic.gov.au/in-force/acts/domestic-building-contracts-act-1995",
);
const CONSUMER = link(
  "Consumer Affairs Victoria — building",
  "https://www.consumer.vic.gov.au/housing/building-and-renovating",
);
const SOP = link(
  "Security of Payment Act 2002 (Vic)",
  "https://www.legislation.vic.gov.au/in-force/acts/building-and-construction-industry-security-payment-act-2002",
);
const OC_ACT = link(
  "Owners Corporations Act 2006 (Vic)",
  "https://www.legislation.vic.gov.au/in-force/acts/owners-corporations-act-2006",
);
const SUBDIV = link(
  "Subdivision Act 1988 (Vic)",
  "https://www.legislation.vic.gov.au/in-force/acts/subdivision-act-1988",
);
const BOND = link(
  "Apartment developer bond",
  "https://www.vic.gov.au/new-bond-system-apartment-builders",
);
const MW = link("Melbourne Water", "https://www.melbournewater.com.au/");
const BESS = link("BESS", "https://bess.net.au/");
const STANDARDS = link("Standards Australia", "https://www.standards.org.au/");
const ATO_GST = link("ATO — GST", "https://www.ato.gov.au/businesses-and-organisations/gst-excise-and-indirect-taxes/gst");
const CFA = link(
  "CFA — building in a bushfire area",
  "https://www.cfa.vic.gov.au/plan-prepare/building-in-a-bushfire-prone-area",
);
const PLANNING_VIC = link(
  "planning.vic.gov.au",
  "https://www.planning.vic.gov.au/",
);

export const ITEM_RESOURCES: Record<string, ChecklistResource[]> = {
  "pd-arbv": [ARBV, ARCHITECTS_ACT],
  "pd-agreement": [ARBV_WORK, ARCHITECTS_ACT],
  "pd-brief": [ARBV_WORK],
  "pd-title": [LANDATA],
  "pd-oc": [OC_ACT, SUBDIV],
  "pd-planning-context": [VICPLAN, VPP],
  "pd-clauses": [CL54, CL55, CL58],
  "pd-bads": [BADS, CL5507, CL58],
  "pd-survey": [CL54, CL55],
  "pd-services": [MW, BUILDING_ACT],
  "pd-hazards": [CFA, BUILDING_REGS],
  "pd-budget": [ARBV_WORK, ATO_GST],
  "pd-neighbours": [CL54, CL55],
  "cd-site-analysis": [CL54, CL55],
  "cd-options": [ARBV_WORK],
  "cd-massing": [CL54, VPP],
  "cd-cl55": [CL55],
  "cd-canopy": [CL55],
  "cd-apartments": [BADS, CL5507, CL58],
  "cd-bads-communal": [BADS, CL58, CL5507],
  "cd-bads-pos": [BADS, CL58, CL5507],
  "cd-bads-layout": [BADS, CL58, CL5507],
  "cd-bads-depth": [BADS, CL58, CL5507],
  "cd-bads-setback": [BADS, CL58, CL5507],
  "cd-bads-storage": [BADS, CL58, CL5507],
  "cd-energy": [NCC, NATHERS],
  "cd-livable": [NCC, BPC_NCC],
  "cd-parking": [CL5206],
  "cd-signoff": [ARBV_WORK],
  "dd-gas": [PLANNING_VIC, VPP],
  "dd-consultants": [ARBV, ARCHITECTS_ACT],
  "dd-nathers": [NATHERS, NCC],
  "dd-storm": [CL5318, MW],
  "dd-amenity": [CL54, CL55],
  "dd-landscape": [CL55, CL58],
  "dd-bads-deep-soil": [BADS, CL58, CL5507],
  "dd-bess": [BESS],
  "dd-wind": [BADS, CL58],
  "dd-acoustic": [BADS, CL58],
  "dd-bads-entry": [BADS, CL58, CL5507],
  "dd-bads-vent": [BADS, CL58, CL5507],
  "dd-bads-materials": [BADS, CL58, CL5507],
  "dd-bads-access": [BADS, CL58, CL5507],
  "dd-waste": [CL55, CL58],
  "dd-client-lodge": [PE_ACT, PLANNING_VIC],
  "tp-need": [PE_ACT, PLANNING_VIC],
  "tp-cl54": [CL54],
  "tp-cl55": [CL55],
  "tp-cl58": [BADS, CL58],
  "tp-cl5507": [BADS, CL5507],
  "tp-nsd": [CL54, CL55],
  "tp-set": [PE_ACT, VPP],
  "tp-reports": [PE_ACT, PLANNING_VIC],
  "tp-lodge": [PE_ACT],
  "tp-rfi": [PE_ACT],
  "tp-permit": [PE_ACT],
  "tp-subdivision": [SUBDIV],
  "doc-tp-match": [PE_ACT, BUILDING_ACT],
  "doc-working": [NCC, BUILDING_ACT],
  "doc-ncc": [NCC, BPC_NCC],
  "doc-energy": [NATHERS, NCC],
  "doc-livable": [NCC],
  "doc-condensation": [NCC],
  "doc-structure": [NCC, BUILDING_ACT],
  "doc-waterproofing": [STANDARDS],
  "doc-part5": [BUILDING_REGS],
  "doc-manual": [BUILDING_REGS, BUILDING_ACT],
  "tn-set": [DBC, CONSUMER],
  "tn-rfi": [DBC, ARBV_WORK],
  "tn-compare": [DBC, CONSUMER],
  "tn-builder": [BPC, DBC],
  "tn-contract": [DBC, CONSUMER],
  "tn-rbs": [BUILDING_ACT, BPC],
  "ca-permit": [BUILDING_ACT, BPC],
  "ca-inspections": [BUILDING_REGS, BPC],
  "ca-meetings": [ARBV_WORK],
  "ca-variations": [DBC, SOP],
  "ca-claims": [DBC, SOP],
  "ca-oc": [BUILDING_ACT, BPC],
  "ca-bond": [BOND, BPC],
  "ca-oc-setup": [OC_ACT, SUBDIV],
  "pc-inspect": [DBC, ARBV_WORK],
  "pc-list": [DBC, BUILDING_ACT],
  "pc-handover": [BUILDING_ACT, BUILDING_REGS],
  "pc-certificate": [DBC],
  "dlp-period": [DBC, CONSUMER],
  "dlp-track": [ARBV_WORK],
  "dlp-bond-prelim": [BOND],
  "dlp-bond-final": [BOND],
  "dlp-close": [DBC],
  "fc-inspect": [DBC, ARBV_WORK],
  "fc-issue": [DBC, CONSUMER],
  "fc-security": [DBC, SOP],
  "fc-archive": [ARBV_WORK, ARCHITECTS_ACT],
  "poe-survey": [ARBV, NCC],
  "poe-energy": [NATHERS, NCC],
  "poe-landscape": [CL55, CL58],
  "poe-lessons": [ARBV_WORK],
};

export function resourcesForItem(itemId: string): ChecklistResource[] {
  return ITEM_RESOURCES[itemId] ?? [];
}
