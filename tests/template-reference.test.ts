import assert from "node:assert/strict";
import test from "node:test";
import {
  emptyTemplateTicks,
  groupedTemplateStages,
  parseTemplateTicks,
  referenceProgress,
} from "../src/lib/template-reference";
import { BUNDLED_TEMPLATE } from "../src/lib/template/vic-residential";

test("every bundled checklist item cites a source and helper resources", () => {
  for (const item of BUNDLED_TEMPLATE.items) {
    assert.ok(item.references.length > 0, item.id);
    assert.ok(
      item.references.every((value) => value.trim().length > 0),
      item.id,
    );
    assert.ok(item.resources.length > 0, item.id);
    assert.ok(
      item.resources.every(
        (resource) =>
          resource.label.trim().length > 0 &&
          resource.url.startsWith("https://"),
      ),
      item.id,
    );
  }
  assert.equal(BUNDLED_TEMPLATE.version, "1.0.4");
  const nccNotes = BUNDLED_TEMPLATE.items.find((item) => item.id === "doc-ncc");
  assert.equal(nccNotes?.title, "NCC 2025 compliance notes");
  assert.ok(nccNotes?.detail.includes("1 May 2026"));
});

test("generic templates expose checkable items for every typology and stage", () => {
  for (const typology of ["house", "townhouse", "apartment"] as const) {
    const groups = groupedTemplateStages(BUNDLED_TEMPLATE, typology);
    assert.equal(groups.length, BUNDLED_TEMPLATE.stages.length);
    const items = groups.flatMap((group) => group.items);
    assert.ok(items.length >= 70, typology);
    assert.ok(items.every((item) => item.appliesTo.includes(typology)));
    assert.ok(items.every((item) => item.references.length > 0));
    assert.ok(items.every((item) => item.resources.length > 0));
  }
});

test("apartment template includes developer-bond items that houses omit", () => {
  const houseIds = groupedTemplateStages(BUNDLED_TEMPLATE, "house")
    .flatMap((group) => group.items)
    .map((item) => item.id);
  const apartmentIds = groupedTemplateStages(BUNDLED_TEMPLATE, "apartment")
    .flatMap((group) => group.items)
    .map((item) => item.id);
  assert.equal(houseIds.includes("ca-bond"), false);
  assert.equal(apartmentIds.includes("ca-bond"), true);
});

test("apartment checklist lists BADS requirements that houses omit", () => {
  const houseIds = groupedTemplateStages(BUNDLED_TEMPLATE, "house")
    .flatMap((group) => group.items)
    .map((item) => item.id);
  const apartmentItems = groupedTemplateStages(
    BUNDLED_TEMPLATE,
    "apartment",
  ).flatMap((group) => group.items);
  const apartmentIds = apartmentItems.map((item) => item.id);
  const badsIds = [
    "pd-bads",
    "cd-apartments",
    "cd-bads-communal",
    "cd-bads-pos",
    "cd-bads-layout",
    "cd-bads-depth",
    "cd-bads-setback",
    "cd-bads-storage",
    "dd-bads-deep-soil",
    "dd-bads-entry",
    "dd-bads-vent",
    "dd-bads-materials",
    "dd-bads-access",
    "tp-cl58",
    "tp-cl5507",
  ];
  for (const id of badsIds) {
    assert.equal(houseIds.includes(id), false, id);
    assert.equal(apartmentIds.includes(id), true, id);
  }
  const titles = apartmentItems.map((item) => item.title);
  assert.ok(titles.filter((title) => title.includes("BADS")).length >= 12);
});

test("template tick parse keeps only true flags per typology", () => {
  const ticks = parseTemplateTicks({
    house: { "pd-arbv": true, "pd-title": false },
    townhouse: { "cd-cl55": true },
    extra: { nope: true },
  });
  assert.deepEqual(ticks.house, { "pd-arbv": true });
  assert.deepEqual(ticks.townhouse, { "cd-cl55": true });
  assert.deepEqual(ticks.apartment, {});
  const empty = parseTemplateTicks(null);
  assert.deepEqual(empty, emptyTemplateTicks());
});

test("reference progress counts ticked items only", () => {
  const items = groupedTemplateStages(BUNDLED_TEMPLATE, "townhouse")[0].items;
  const progress = referenceProgress(items, { [items[0].id]: true });
  assert.equal(progress.total, items.length);
  assert.equal(progress.done, 1);
});
