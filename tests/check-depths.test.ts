import assert from "node:assert/strict";
import test from "node:test";
import { exampleFinding, EXAMPLE_ITEM_ID } from "../src/lib/agent/example";
import {
  checkSignalLabel,
  checkUnderstanding,
  deriveCheckSignal,
  itemRestrictionParts,
  requiredEvidenceMissing,
  templateCheckSignal,
} from "../src/lib/check-depths";
import { BUNDLED_TEMPLATE } from "../src/lib/template/vic-residential";

const bads = BUNDLED_TEMPLATE.items.find((item) => item.id === EXAMPLE_ITEM_ID);
const agreement = BUNDLED_TEMPLATE.items.find((item) => item.id === "pd-agreement");

test("apartment BADS item carries restriction chips on the signal row", () => {
  assert.ok(bads);
  const parts = itemRestrictionParts(bads);
  assert.ok(parts.includes("Apartment only"));
  assert.ok(parts.includes("Regulatory"));
  assert.ok(parts.some((part) => part.includes("58")));
});

test("a house-and-all required item has no optional or typology restriction", () => {
  assert.ok(agreement);
  assert.equal(agreement.required, true);
  assert.deepEqual(agreement.appliesTo, ["house", "townhouse", "apartment"]);
  assert.deepEqual(itemRestrictionParts(agreement), []);
});

test("template ticks are only to do or done", () => {
  assert.equal(templateCheckSignal(false), "todo");
  assert.equal(templateCheckSignal(true), "done");
  assert.equal(checkSignalLabel("evidence_missing"), "Evidence missing");
});

test("needs recheck wins over missing evidence", () => {
  assert.ok(bads);
  assert.equal(
    deriveCheckSignal({
      item: bads,
      status: "needs_recheck",
      notes: "",
      files: [],
    }),
    "needs_recheck",
  );
});

test("not applicable is not evidence missing", () => {
  assert.ok(bads);
  assert.equal(
    deriveCheckSignal({
      item: bads,
      status: "not_applicable",
      notes: "",
      files: [],
    }),
    "not_applicable",
  );
});

test("required evidence is missing until a note or file is on the item", () => {
  assert.ok(bads);
  assert.equal(
    requiredEvidenceMissing({ item: bads, notes: "", files: [] }),
    true,
  );
  assert.equal(
    deriveCheckSignal({
      item: bads,
      status: "todo",
      notes: "",
      files: [],
    }),
    "evidence_missing",
  );
  assert.equal(
    requiredEvidenceMissing({
      item: bads,
      notes: "Balcony schedule on SK-01",
      files: [],
    }),
    false,
  );
  assert.equal(
    deriveCheckSignal({
      item: bads,
      status: "todo",
      notes: "Balcony schedule on SK-01",
      files: [],
    }),
    "todo",
  );
});

test("items without assessment stay on ordinary status", () => {
  assert.ok(agreement);
  assert.equal(agreement.assessment, undefined);
  assert.equal(
    deriveCheckSignal({
      item: agreement,
      status: "todo",
      notes: "",
      files: [],
    }),
    "todo",
  );
  assert.equal(
    deriveCheckSignal({
      item: agreement,
      status: "done",
      notes: "",
      files: [],
    }),
    "done",
  );
});

test("an insufficient-information finding is evidence missing", () => {
  assert.ok(bads);
  const finding = exampleFinding();
  assert.equal(
    deriveCheckSignal({
      item: bads,
      status: "in_progress",
      notes: "Plans attached",
      files: [
        {
          id: "att-1",
          itemId: bads.id,
          filename: "SK-01.pdf",
          mimeType: "application/pdf",
          size: 12,
          sha256: "abc",
          addedAt: "2026-09-16T08:00:00.000Z",
        },
      ],
      findings: [finding],
    }),
    "evidence_missing",
  );
});

test("understanding uses the requirement statement, not the how-to title", () => {
  assert.ok(bads);
  const view = checkUnderstanding({
    item: bads,
    notes: "",
    files: [],
    status: "todo",
    findings: [exampleFinding()],
    mode: "project",
  });
  assert.match(view.established, /secluded private open space/i);
  assert.match(view.why, /Regulatory requirement/);
  assert.ok(view.evidence.some((line) => /missing/i.test(line)));
  assert.ok(view.assessment.some((line) => /Insufficient information/.test(line)));
  assert.ok(view.method);
});

test("template understanding does not claim project evidence", () => {
  assert.ok(agreement);
  const view = checkUnderstanding({
    item: agreement,
    notes: "",
    files: [],
    ticked: false,
    mode: "template",
  });
  assert.ok(view.evidence[0]?.includes("phone reference"));
  assert.equal(view.assessment[0], "Not ticked yet.");
});
