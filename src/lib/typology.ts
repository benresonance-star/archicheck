import type { Typology } from "@/lib/types";
import { assertNever, isTypology } from "@/lib/types";

export function parseTypologyParam(value: string): Typology | null {
  return isTypology(value) ? value : null;
}


export type TypologyMeta = {
  id: Typology;
  title: string;
  clause: string;
  blurb: string;
  nccClass: string;
  notes: string[];
};

export function typologyMeta(typology: Typology): TypologyMeta {
  switch (typology) {
    case "house":
      return {
        id: "house",
        title: "House",
        clause: "Clause 54 (if a planning permit is required)",
        blurb:
          "Single dwellings and small second dwellings. Many lots without overlays go straight to a building permit; Part 5 siting still applies.",
        nccClass: "Class 1a",
        notes: [
          "Garden area and neighbourhood character in GRZ/NRZ",
          "Report and consent if Part 5 siting is varied without a planning permit",
          "NCC 2022 7-star NatHERS and livable housing from 1 May 2024",
        ],
      };
    case "townhouse":
      return {
        id: "townhouse",
        title: "Townhouse",
        clause: "Clause 55 — Townhouse and Low-Rise Code",
        blurb:
          "Two or more dwellings on a lot, including townhouses and apartments up to three storeys. Deemed-to-comply standards from 31 March 2025.",
        nccClass: "Class 1a or Class 2 depending on configuration",
        notes: [
          "Tree canopy 10% (≤1,000 m²) or 20% (>1,000 m²)",
          "Subdivision, common property and owners corporation",
          "Almost always a planning permit plus a building permit",
        ],
      };
    case "apartment":
      return {
        id: "apartment",
        title: "Apartment",
        clause: "Clause 55.07 (<5 storeys) or Clause 58 (5+ storeys)",
        blurb:
          "Better Apartments Design Standards, occupancy before move-in, and the 2% developer bond for buildings over three storeys when the building permit is issued from 1 July 2027.",
        nccClass: "Class 2",
        notes: [
          "Livable housing on at least 50% of dwellings",
          "Wind, waste, acoustic and communal open space as storeys increase",
          "Occupancy permit before residents move in",
        ],
      };
    default:
      return assertNever(typology, `Unknown typology: ${String(typology)}`);
  }
}

export const TYPOLOGY_ORDER: Typology[] = ["house", "townhouse", "apartment"];
