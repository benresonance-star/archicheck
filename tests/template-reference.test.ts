import assert from "node:assert/strict";
import test from "node:test";
import {
  emptyTemplateTicks,
  groupedTemplateStages,
  parseTemplateTicks,
  referenceProgress,
} from "../src/lib/template-reference";
import { BUNDLED_TEMPLATE } from "../src/lib/template/vic-residential";

test("every bundled checklist item cites at least one source", () => {
  for (const item of BUNDLED_TEMPLATE.items) {
    assert.ok(item.references.length > 0, item.id);
    assert.ok(
      item.references.every((value) => value.trim().length > 0),
      item.id,
    );
  }
  assert.equal(BUNDLED_TEMPLATE.version, "1.0.1");
});

test("generic templates expose checkable items for every typology and stage", () => {
  for (const typology of ["house", "townhouse", "apartment"] as const) {
    const groups = groupedTemplateStages(BUNDLED_TEMPLATE, typology);
    assert.equal(groups.length, BUNDLED_TEMPLATE.stages.length);
    const items = groups.flatMap((group) => group.items);
    assert.ok(items.length >= 70, typology);
    assert.ok(items.every((item) => item.appliesTo.includes(typology)));
    assert.ok(items.every((item) => item.references.length > 0));
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
