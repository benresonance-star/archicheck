import assert from "node:assert/strict";
import test from "node:test";
import { queryChecklistItems } from "../src/lib/agent/query";
import {
  flattenStagedDocuments,
  groupedOutputDocuments,
  outputKindForItem,
} from "../src/lib/template/output-lens";
import { BUNDLED_TEMPLATE } from "../src/lib/template/vic-residential";
import { itemsForTypology } from "../src/lib/types";

test("every bundled item maps to one output document", () => {
  for (const item of BUNDLED_TEMPLATE.items) {
    assert.ok(outputKindForItem(item), item.id);
  }
});

test("document lens is broken into stages and keeps planning drawings off the contract set", () => {
  for (const typology of ["house", "townhouse", "apartment"] as const) {
    const groups = groupedOutputDocuments(BUNDLED_TEMPLATE, typology);
    assert.deepEqual(
      groups.map((group) => group.stage.id),
      BUNDLED_TEMPLATE.stages.map((stage) => stage.id),
    );
    const stageIds = groups.map((group) => group.stage.id);
    assert.ok(stageIds.includes("town-planning"), `${typology} town-planning`);
    assert.ok(stageIds.includes("documentation"), `${typology} documentation`);

    const planning = groups.find((group) => group.stage.id === "town-planning");
    const contract = groups.find((group) => group.stage.id === "documentation");
    assert.ok(planning);
    assert.ok(contract);

    const planningPlans = planning.documents.find((doc) => doc.kind === "plans");
    const contractPlans = contract.documents.find((doc) => doc.kind === "plans");
    assert.ok(planningPlans, `${typology} planning plans`);
    assert.ok(contractPlans, `${typology} contract plans`);
    assert.equal(planningPlans.title, "Plans");
    assert.equal(contractPlans.title, "Plans");
    assert.equal(planning.stage.title, "Town planning");
    assert.equal(contract.stage.title, "Construction documentation");
    assert.ok(
      planningPlans.items.every((item) => item.stageId === "town-planning"),
    );
    assert.ok(
      contractPlans.items.every((item) => item.stageId === "documentation"),
    );

    const kinds = flattenStagedDocuments(groups).map((entry) => entry.kind);
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

    const mapped = flattenStagedDocuments(groups).flatMap((entry) => entry.items);
    const applicable = itemsForTypology(BUNDLED_TEMPLATE.items, typology);
    assert.equal(mapped.length, applicable.length);
    assert.equal(new Set(mapped.map((item) => item.id)).size, applicable.length);
  }
});

test("apartment planning plans include BADS checks that houses omit", () => {
  const housePlans = groupedOutputDocuments(BUNDLED_TEMPLATE, "house")
    .find((group) => group.stage.id === "concept")
    ?.documents.find((doc) => doc.kind === "plans");
  const apartmentPlans = groupedOutputDocuments(BUNDLED_TEMPLATE, "apartment")
    .find((group) => group.stage.id === "concept")
    ?.documents.find((doc) => doc.kind === "plans");
  assert.equal(
    housePlans?.items.some((item) => item.id === "cd-bads-pos"),
    false,
  );
  assert.equal(
    apartmentPlans?.items.some((item) => item.id === "cd-bads-pos"),
    true,
  );
});

test("query can filter by output document kind", () => {
  const result = queryChecklistItems(BUNDLED_TEMPLATE, {
    typology: "house",
    outputKind: "rcp",
  });
  assert.ok(result.items.length >= 3);
  assert.ok(result.items.every((item) => item.id.startsWith("dw-cd-rcp-")));
});
