import assert from "node:assert/strict";
import test from "node:test";
import { queryChecklistItems } from "../src/lib/agent/query";
import {
  groupedOutputDocuments,
  itemsGroupedByStage,
  outputKindForItem,
} from "../src/lib/template/output-lens";
import { BUNDLED_TEMPLATE } from "../src/lib/template/vic-residential";
import { itemsForTypology } from "../src/lib/types";

test("every bundled item maps to one output document", () => {
  for (const item of BUNDLED_TEMPLATE.items) {
    assert.ok(outputKindForItem(item), item.id);
  }
});

test("document lens lists plans, RCP, elevations, sections, details and spec per typology", () => {
  for (const typology of ["house", "townhouse", "apartment"] as const) {
    const groups = groupedOutputDocuments(BUNDLED_TEMPLATE, typology);
    const kinds = groups.map((group) => group.kind);
    for (const kind of [
      "client-brief",
      "report",
      "site-plan",
      "plans",
      "rcp",
      "elevations",
      "sections",
      "details",
      "schedules",
      "specification",
    ] as const) {
      assert.ok(kinds.includes(kind), `${typology} ${kind}`);
    }
    const mapped = groups.flatMap((group) => group.items);
    const applicable = itemsForTypology(BUNDLED_TEMPLATE.items, typology);
    assert.equal(mapped.length, applicable.length);
    assert.equal(new Set(mapped.map((item) => item.id)).size, applicable.length);
  }
});

test("apartment document lens includes BADS plan checks that houses omit", () => {
  const housePlans = groupedOutputDocuments(BUNDLED_TEMPLATE, "house").find(
    (group) => group.kind === "plans",
  );
  const apartmentPlans = groupedOutputDocuments(
    BUNDLED_TEMPLATE,
    "apartment",
  ).find((group) => group.kind === "plans");
  assert.equal(housePlans?.items.some((item) => item.id === "cd-bads-pos"), false);
  assert.equal(
    apartmentPlans?.items.some((item) => item.id === "cd-bads-pos"),
    true,
  );
});

test("document items stay grouped under their ARBV stage", () => {
  const plans = groupedOutputDocuments(BUNDLED_TEMPLATE, "house").find(
    (group) => group.kind === "plans",
  );
  assert.ok(plans);
  const byStage = itemsGroupedByStage(BUNDLED_TEMPLATE, plans.items);
  assert.ok(byStage.length >= 2);
  assert.equal(
    byStage.reduce((sum, group) => sum + group.items.length, 0),
    plans.items.length,
  );
  assert.ok(byStage.every((group) => group.stage.id.length > 0));
});

test("query can filter by output document kind", () => {
  const result = queryChecklistItems(BUNDLED_TEMPLATE, {
    typology: "house",
    outputKind: "rcp",
  });
  assert.ok(result.items.length >= 3);
  assert.ok(result.items.every((item) => item.id.startsWith("dw-cd-rcp-")));
});
