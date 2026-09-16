import type { FindingDocument, TemplateDocument } from "@/lib/types";
import { FINDING_FORMAT, FINDING_FORMAT_VERSION } from "@/lib/types";
import { BUNDLED_TEMPLATE } from "@/lib/template/vic-residential";

export const EXAMPLE_FINDING_ID = "e7c0d5a2-4b91-4f3e-9c1a-8a6b2f0d4e11";
export const EXAMPLE_ITEM_ID = "cd-bads-pos";

export function exampleFinding(
  template: TemplateDocument = BUNDLED_TEMPLATE,
): FindingDocument {
  return {
    format: FINDING_FORMAT,
    formatVersion: FINDING_FORMAT_VERSION,
    id: EXAMPLE_FINDING_ID,
    createdAt: "2026-09-16T08:00:00.000Z",
    itemId: EXAMPLE_ITEM_ID,
    checklist: {
      id: template.id,
      version: template.version,
      checksum: template.checksum,
    },
    designRevision: {
      id: "ext-concept-rev-a",
      label: "Concept sketch set Rev A",
      capturedAt: "2026-09-15T00:00:00.000Z",
    },
    result: "insufficient_information",
    summary:
      "Cannot confirm BADS private open space for every dwelling: condenser locations are not shown on the concept plans.",
    affectedElements: [
      { id: "apt-b1", type: "dwelling", label: "Type B1 two-bed" },
      { type: "balcony", label: "Type B1 living balcony" },
    ],
    evidence: [
      {
        id: "ev-plans",
        inputId: "floor-plans",
        description: "Concept floor plans show balcony outlines with some dimensions.",
        present: true,
        location: "SK-01",
      },
      {
        id: "ev-schedule",
        inputId: "dwelling-schedule",
        description: "Dwelling mix lists Type B1 as two-bedroom, south-facing living.",
        present: true,
        location: "SK-00 schedule",
      },
      {
        id: "ev-condensers",
        inputId: "condenser-locations",
        description: "Outdoor units are not marked on the concept set.",
        present: false,
      },
    ],
    assumptions: [
      "Typology is apartment and Clause 58.05-3 applies.",
      "No dwelling is above 40 m, so the living-room area substitution is not used.",
    ],
    missingInputs: ["condenser-locations"],
    checklistIssue: {
      kind: "ambiguity",
      itemId: EXAMPLE_ITEM_ID,
      detail:
        "The item says 'above about 40 m' without stating whether height is measured to the balcony floor or the top of the building.",
      suggestedChange: {
        detail:
          "Give every dwelling secluded private open space to the BADS table (area and minimum dimension). Add 1.5 m² if a condenser sits on the balcony. South-facing living balconies may be 1.2 m deep; north-facing may be 1.7 m. Where building height to the highest balcony serving a dwelling is more than 40 m, extra living-room area may substitute for balcony area per the BADS table.",
      },
    },
  };
}
