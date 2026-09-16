import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { exampleFinding, EXAMPLE_ITEM_ID } from "../src/lib/agent/example";
import {
  applyFindingToAnswers,
  applyFindingToTemplate,
  appendFinding,
  checklistIssueToSourcedProposal,
} from "../src/lib/agent/findings";
import { queryChecklistItems } from "../src/lib/agent/query";
import { applyProposedToTemplate } from "../src/lib/scout/apply-wording";
import { BUNDLED_TEMPLATE } from "../src/lib/template/vic-residential";
import {
  createProject,
  exportProjectZip,
  importProjectZip,
  listProjects,
  loadProject,
  recordFinding,
  setAnswer,
} from "../src/lib/store";
import {
  validateFindingDocument,
  validateProjectDocument,
  validateTemplateDocument,
} from "../src/lib/validate";
import { unpackZip } from "../src/lib/zip-package";

test("example item keeps a stable id and separates requirement from method", () => {
  const item = BUNDLED_TEMPLATE.items.find((entry) => entry.id === EXAMPLE_ITEM_ID);
  assert.ok(item);
  assert.equal(item?.id, "cd-bads-pos");
  assert.ok(item?.assessment);
  assert.equal(item?.assessment?.schemaVersion, "1.0.0");
  assert.equal(item?.assessment?.requirement.kind, "regulatory");
  assert.equal(item?.assessment?.method.id, "check-cd-bads-pos-table");
  assert.notEqual(item?.assessment?.method.id, item?.id);
  assert.ok(item?.assessment?.applicability.elementTypes.includes("balcony"));
  assert.ok(
    item?.assessment?.requiredInputs.some((input) => input.id === "condenser-locations"),
  );
  assert.equal(item?.assessment?.humanReview.required, true);
  validateTemplateDocument(BUNDLED_TEMPLATE);
});

test("items without assessment still validate so older packages import", () => {
  const item = BUNDLED_TEMPLATE.items.find((entry) => entry.id === EXAMPLE_ITEM_ID);
  assert.ok(item?.assessment);
  const stripped = structuredClone(item);
  delete stripped.assessment;
  validateTemplateDocument({
    ...BUNDLED_TEMPLATE,
    items: BUNDLED_TEMPLATE.items.map((entry) =>
      entry.id === EXAMPLE_ITEM_ID ? stripped : entry,
    ),
  });
});

test("query returns the example item, missing inputs, and unstructured siblings", () => {
  const result = queryChecklistItems(BUNDLED_TEMPLATE, {
    typology: "apartment",
    stageId: "concept",
    elementType: "balcony",
    requirementKind: "regulatory",
    availableInputs: {
      "floor-plans": true,
      "dwelling-schedule": true,
    },
  });
  assert.equal(result.template.id, "vic-residential");
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0]?.id, EXAMPLE_ITEM_ID);
  const missing = result.missingInformation.find(
    (entry) => entry.itemId === EXAMPLE_ITEM_ID,
  );
  assert.ok(missing);
  assert.deepEqual(
    missing?.missingInputs.map((input) => input.id),
    ["condenser-locations"],
  );
  assert.equal(missing?.humanReviewRequired, true);
  assert.equal(result.unstructuredItems.length, 0);

  const house = queryChecklistItems(BUNDLED_TEMPLATE, {
    typology: "house",
    elementType: "balcony",
  });
  assert.equal(house.items.length, 0);

  const stage = queryChecklistItems(BUNDLED_TEMPLATE, {
    typology: "apartment",
    stageId: "concept",
  });
  assert.ok(stage.unstructuredItems.length > 0);
  assert.ok(stage.items.some((item) => item.id === EXAMPLE_ITEM_ID));
  assert.ok(stage.items.some((item) => !item.assessment));
});

test("example finding validates and does not rewrite answers or the template", () => {
  const finding = exampleFinding();
  validateFindingDocument(finding);
  assert.equal(finding.result, "insufficient_information");
  assert.equal(finding.itemId, EXAMPLE_ITEM_ID);
  assert.equal(finding.checklist.version, BUNDLED_TEMPLATE.version);
  assert.equal(finding.checklist.checksum, BUNDLED_TEMPLATE.checksum);
  assert.ok(finding.affectedElements.length > 0);
  assert.ok(finding.evidence.some((entry) => entry.present === false));
  assert.ok(finding.assumptions.length > 0);
  assert.equal(finding.checklistIssue?.kind, "ambiguity");

  const project = validateProjectDocument({
    format: "vic-arch-checklist-project",
    formatVersion: "1.0.0",
    id: "11111111-1111-4111-8111-111111111111",
    revision: 1,
    createdAt: "2026-09-16T08:00:00.000Z",
    updatedAt: "2026-09-16T08:00:00.000Z",
    template: {
      id: BUNDLED_TEMPLATE.id,
      version: BUNDLED_TEMPLATE.version,
      checksum: BUNDLED_TEMPLATE.checksum,
    },
    site: {
      name: "Carlton apartments",
      typology: "apartment",
      address: "",
      municipality: "Melbourne",
      planningScheme: "",
      zone: "",
      overlays: [],
      storeys: 6,
      dwellingCount: 12,
      lotAreaSqm: 800,
      notes: "",
    },
    answers: {
      [EXAMPLE_ITEM_ID]: {
        status: "in_progress",
        notes: "Waiting on condenser layout",
        updatedAt: "2026-09-16T08:00:00.000Z",
        fields: {},
      },
    },
    attachments: [],
  });

  const recorded = appendFinding(project, finding);
  assert.equal(recorded.answers[EXAMPLE_ITEM_ID]?.status, "in_progress");
  assert.equal(recorded.answers[EXAMPLE_ITEM_ID]?.notes, "Waiting on condenser layout");
  assert.equal(recorded.findings?.length, 1);
  assert.notEqual(recorded.findings, project.findings);

  assert.throws(
    () => applyFindingToAnswers(recorded, finding),
    /must not modify project answers/,
  );
  assert.throws(
    () => applyFindingToTemplate(BUNDLED_TEMPLATE, finding),
    /must not modify approved requirements/,
  );

  const proposal = checklistIssueToSourcedProposal(finding);
  assert.equal(proposal.itemIds[0], EXAMPLE_ITEM_ID);
  assert.ok(proposal.detail.includes("40 m"));

  const unchanged = applyProposedToTemplate(
    BUNDLED_TEMPLATE,
    {
      id: "scout-1",
      sourceId: "x",
      sourceTitle: "t",
      url: "https://example.invalid/source",
      scope: "statewide",
      action: "replace",
      itemIds: [EXAMPLE_ITEM_ID],
      flag: "no",
      proposed: null,
      confidence: "low",
      status: "open",
      hashChanged: false,
      baseline: false,
    },
    { detail: BUNDLED_TEMPLATE.items.find((item) => item.id === EXAMPLE_ITEM_ID)?.detail },
  );
  assert.equal(
    unchanged.items.find((item) => item.id === EXAMPLE_ITEM_ID)?.detail,
    BUNDLED_TEMPLATE.items.find((item) => item.id === EXAMPLE_ITEM_ID)?.detail,
  );
});

test("ZIP round-trip keeps a recorded finding and does not change answers", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "vic-finding-"));
  process.env.DATA_DIR = dir;
  try {
    const created = await createProject({
      site: {
        name: "Carlton apartments",
        typology: "apartment",
        address: "1 Lygon St, Carlton VIC 3053",
        municipality: "Melbourne",
        planningScheme: "Melbourne Planning Scheme",
        zone: "MUZ",
        overlays: [],
        storeys: 6,
        dwellingCount: 12,
        lotAreaSqm: 800,
        notes: "",
      },
    });
    await setAnswer(created.project.id, EXAMPLE_ITEM_ID, {
      status: "in_progress",
      notes: "Waiting on condenser layout",
    });
    const finding = exampleFinding(created.template);
    await recordFinding(created.project.id, finding);

    const before = await loadProject(created.project.id);
    assert.equal(before.project.answers[EXAMPLE_ITEM_ID]?.status, "in_progress");
    assert.equal(before.project.findings?.[0]?.id, finding.id);

    const exported = await exportProjectZip(created.project.id);
    const unpacked = await unpackZip(exported.bytes);
    assert.equal(unpacked.project.findings?.[0]?.result, "insufficient_information");
    assert.equal(unpacked.project.answers[EXAMPLE_ITEM_ID]?.status, "in_progress");
    assert.equal(
      unpacked.template.items.find((item) => item.id === EXAMPLE_ITEM_ID)?.assessment
        ?.method.id,
      "check-cd-bads-pos-table",
    );

    await rm(path.join(dir, "projects"), { recursive: true, force: true });
    assert.equal((await listProjects()).length, 0);

    const restored = await importProjectZip(exported.bytes);
    const loaded = await loadProject(restored.project.id);
    assert.equal(loaded.project.findings?.[0]?.id, finding.id);
    assert.equal(loaded.project.findings?.[0]?.designRevision.label, "Concept sketch set Rev A");
    assert.equal(loaded.project.answers[EXAMPLE_ITEM_ID]?.status, "in_progress");
    assert.equal(loaded.project.answers[EXAMPLE_ITEM_ID]?.notes, "Waiting on condenser layout");
    assert.equal(loaded.template.checksum, created.project.template.checksum);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
