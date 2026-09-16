import type { ItemAssessment } from "@/lib/types";
import { ITEM_ASSESSMENT_SCHEMA_VERSION } from "@/lib/types";

const BADS_URL =
  "https://www.planning.vic.gov.au/guides-and-resources/guides/all-guides/better-apartments";
const CL58_URL =
  "https://planning-schemes.app.planning.vic.gov.au/All%20schemes/58";
const CL5507_URL =
  "https://planning-schemes.app.planning.vic.gov.au/All%20schemes/55.07";

const CD_BADS_POS: ItemAssessment = {
  schemaVersion: ITEM_ASSESSMENT_SCHEMA_VERSION,
  requirement: {
    kind: "regulatory",
    statement:
      "Every apartment dwelling must have secluded private open space that meets the Better Apartments Design Standards table for area and minimum dimension (Clause 58.05-3 / 55.07-9).",
    version: "Clause 58.05-3 / 55.07-9",
    sourceRefs: [
      {
        citation: "Better Apartments Design Standards",
        url: BADS_URL,
        version: "current",
      },
      {
        citation: "VPP Clause 58.05-3",
        url: CL58_URL,
      },
      {
        citation: "VPP Clause 55.07-9",
        url: CL5507_URL,
      },
    ],
  },
  method: {
    id: "check-cd-bads-pos-table",
    description:
      "On the concept plans, measure secluded private open space and living-balcony depth for each dwelling type. Compare area and minimum dimension to the BADS private open space table. Add 1.5 m² where a condenser is shown on the balcony. Do not treat the requirement statement as the method: the table comparison is the check.",
    acceptanceCriteria: [
      "Every dwelling type has secluded private open space meeting the BADS minimum area and dimension for that type.",
      "Balconies that carry a condenser include the extra 1.5 m².",
      "South-facing living balconies are at least 1.2 m deep; north-facing living balconies are at least 1.7 m, unless the height substitution in the BADS table applies.",
    ],
  },
  applicability: {
    elementTypes: ["dwelling", "private_open_space", "balcony"],
    conditions:
      "Apartment developments assessed under Clause 58 or Clause 55.07. Mark not applicable on houses and townhouses.",
  },
  requiredInputs: [
    {
      id: "floor-plans",
      label: "Dwelling floor plans with balcony and private open space dimensions",
      kind: "drawing",
      required: true,
    },
    {
      id: "dwelling-schedule",
      label: "Dwelling-type schedule (bedrooms and orientation)",
      kind: "document",
      required: true,
    },
    {
      id: "condenser-locations",
      label: "Outdoor unit / condenser locations",
      kind: "drawing",
      required: true,
    },
  ],
  requiredEvidence: [
    {
      id: "pos-table",
      label: "Schedule comparing each dwelling type to the BADS private open space table",
      kind: "document",
    },
    {
      id: "dimensioned-balconies",
      label: "Dimensioned balcony or private open space on the plans",
      kind: "drawing",
    },
  ],
  humanReview: {
    required: true,
    reason:
      "North/south orientation and the substitution of living-room area above about 40 m need an architect or planner to confirm.",
  },
};

const ASSESSMENTS: Record<string, ItemAssessment> = {
  "cd-bads-pos": CD_BADS_POS,
  "dw-cd-north": {
    schemaVersion: ITEM_ASSESSMENT_SCHEMA_VERSION,
    requirement: {
      kind: "office_practice",
      statement:
        "North point on working drawings is solar north from the survey, not title north.",
      sourceRefs: [
        {
          citation: "Victorian Architects Code of Professional Conduct",
          url: "https://www.arbv.vic.gov.au/working-architect",
        },
      ],
    },
    method: {
      id: "check-dw-cd-north-survey",
      description:
        "Compare the north point on each architectural sheet with the survey north arrow and the title plan. Title north often differs from solar north.",
      acceptanceCriteria: [
        "Every working-drawing sheet shows solar north.",
        "The north point matches the survey, not the title-plan north, unless a note explains a deliberate difference.",
      ],
    },
    applicability: {
      elementTypes: ["drawing", "site"],
      conditions: "Working-drawing issue for a Victorian residential building permit.",
    },
    requiredInputs: [
      {
        id: "survey",
        label: "Site survey with solar north",
        kind: "drawing",
        required: true,
      },
      {
        id: "working-set",
        label: "Architectural working drawing set",
        kind: "drawing",
        required: true,
      },
    ],
    requiredEvidence: [
      {
        id: "north-match",
        label: "North point on a typical sheet matching the survey",
        kind: "drawing",
      },
    ],
    humanReview: {
      required: false,
    },
  },
};

export function assessmentForItem(itemId: string): ItemAssessment | undefined {
  return ASSESSMENTS[itemId];
}
