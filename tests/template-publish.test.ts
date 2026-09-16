import assert from "node:assert/strict";
import test from "node:test";
import { applyProposedToTemplate } from "../src/lib/scout/apply-wording";
import type { ScoutFinding } from "../src/lib/scout/types";
import { changeFromAddedItem, changeFromRemovedItem } from "../src/lib/template/checklist-crud";
import {
  adoptSelected,
  bumpPatchVersion,
  comparisonRows,
  noticeFromRelease,
  publishFindingToTemplate,
} from "../src/lib/template/publish";
import {
  FORMAT_VERSION,
  PROJECT_FORMAT,
  progressForProject,
  type ProjectDocument,
  type TemplateDocument,
} from "../src/lib/types";

function item(
  id: string,
  detail: string,
  appliesTo: TemplateDocument["items"][number]["appliesTo"] = ["house"],
): TemplateDocument["items"][number] {
  return {
    id,
    stageId: "pre-design",
    title: id,
    detail,
    appliesTo,
    required: true,
    references: ["old source"],
    resources: [],
    grokbotId: "bot",
  };
}

function template(items: TemplateDocument["items"], version = "1.0.5"): TemplateDocument {
  return {
    format: "vic-arch-checklist-template",
    formatVersion: "1.0.0",
    id: "vic-residential",
    version,
    title: "t",
    jurisdiction: "Victoria",
    description: "",
    checksum: "a".repeat(64),
    stages: [
      {
        id: "pre-design",
        number: 1,
        title: "Pre-design",
        summary: "",
      },
    ],
    grokbots: [],
    items,
  };
}

function finding(partial: Partial<ScoutFinding> = {}): ScoutFinding {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    sourceId: "townhouse-code",
    sourceTitle: "Clause 55",
    url: "https://example.test/55",
    scope: "statewide",
    action: "replace",
    itemIds: ["pd-planning-context"],
    flag: "Hash changed",
    proposed: { detail: "new wording", references: ["https://example.test/55"] },
    confidence: "low",
    status: "open",
    hashChanged: true,
    baseline: false,
    ...partial,
  };
}

function projectDoc(typology: ProjectDocument["site"]["typology"]): ProjectDocument {
  return {
    format: PROJECT_FORMAT,
    formatVersion: FORMAT_VERSION,
    id: "22222222-2222-4222-8222-222222222222",
    revision: 1,
    createdAt: "2026-09-16T00:00:00.000Z",
    updatedAt: "2026-09-16T00:00:00.000Z",
    template: {
      id: "vic-residential",
      version: "1.0.5",
      checksum: "a".repeat(64),
    },
    site: {
      name: "Job",
      typology,
      address: "",
      municipality: "Yarra",
      planningScheme: "",
      zone: "",
      overlays: [],
      storeys: 2,
      dwellingCount: 1,
      lotAreaSqm: null,
      notes: "",
    },
    answers: {
      "pd-planning-context": {
        status: "done",
        notes: "Signed off last week",
        updatedAt: "2026-09-16T00:00:00.000Z",
        fields: { budget: "1.8m" },
      },
    },
    attachments: [
      {
        id: "33333333-3333-4333-8333-333333333333",
        itemId: "pd-planning-context",
        filename: "title.pdf",
        mimeType: "application/pdf",
        size: 12,
        sha256: "b".repeat(64),
        addedAt: "2026-09-16T00:00:00.000Z",
      },
    ],
    impacts: [],
  };
}

test("patch version strips draft suffixes", () => {
  assert.equal(bumpPatchVersion("1.0.5"), "1.0.6");
  assert.equal(bumpPatchVersion("1.0.5-draft.2"), "1.0.6");
});

test("reviewer comparison shows current versus proposed wording", () => {
  const current = template([item("pd-planning-context", "old wording")]);
  const rows = comparisonRows(current, finding(), {
    detail: "new wording",
    references: ["https://example.test/55"],
  });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].beforeDetail, "old wording");
  assert.equal(rows[0].afterDetail, "new wording");
});

test("approval publishes a new template version without mutating the old copy", () => {
  const current = template([item("pd-planning-context", "old wording")]);
  const published = publishFindingToTemplate({
    template: current,
    finding: finding(),
    proposed: { detail: "new wording", references: ["https://example.test/55"] },
    publishedAt: "2026-09-16T01:00:00.000Z",
    releaseId: "44444444-4444-4444-8444-444444444444",
  });
  assert.equal(published.template.version, "1.0.6");
  assert.equal(published.release.fromVersion, "1.0.5");
  assert.equal(published.release.toVersion, "1.0.6");
  assert.equal(current.items[0].detail, "old wording");
  assert.equal(published.template.items[0].detail, "new wording");
});

test("existing house project receives an impact notice; apartment-only change does not", () => {
  const current = template([
    item("pd-planning-context", "old", ["house"]),
    item("cd-apartments", "old apt", ["apartment"]),
  ]);
  const house = projectDoc("house");
  const houseNotice = noticeFromRelease({
    release: {
      id: "55555555-5555-4555-8555-555555555555",
      findingId: "f",
      sourceTitle: "Clause 55",
      sourceUrl: "https://example.test/55",
      fromVersion: "1.0.5",
      toVersion: "1.0.6",
      publishedAt: "2026-09-16T01:00:00.000Z",
      changes: comparisonRows(
        current,
        finding(),
        { detail: "new wording", references: ["https://example.test/55"] },
      ),
    },
    project: house,
    template: current,
    noticeId: "66666666-6666-4666-8666-666666666666",
  });
  assert.ok(houseNotice);
  assert.equal(houseNotice?.changes[0].itemId, "pd-planning-context");

  const aptOnly = noticeFromRelease({
    release: {
      id: "77777777-7777-4777-8777-777777777777",
      findingId: "f2",
      sourceTitle: "BADS",
      sourceUrl: "https://example.test/58",
      fromVersion: "1.0.5",
      toVersion: "1.0.6",
      publishedAt: "2026-09-16T01:00:00.000Z",
      changes: comparisonRows(
        current,
        finding({
          itemIds: ["cd-apartments"],
          proposed: { detail: "new apt" },
        }),
        { detail: "new apt" },
      ),
    },
    project: house,
    template: current,
    noticeId: "88888888-8888-4888-8877-888888888888",
  });
  assert.equal(aptOnly, null);
});

test("adopting selected changes marks Needs recheck and keeps notes, fields and attachments", () => {
  const current = template([item("pd-planning-context", "old wording")]);
  const published = applyProposedToTemplate(current, finding(), {
    detail: "new wording",
    references: ["https://example.test/55"],
  });
  published.version = "1.0.6";
  const job = projectDoc("house");
  const notice = noticeFromRelease({
    release: {
      id: "55555555-5555-4555-8555-555555555555",
      findingId: "f",
      sourceTitle: "Clause 55",
      sourceUrl: "https://example.test/55",
      fromVersion: "1.0.5",
      toVersion: "1.0.6",
      publishedAt: "2026-09-16T01:00:00.000Z",
      changes: comparisonRows(current, finding(), {
        detail: "new wording",
        references: ["https://example.test/55"],
      }),
    },
    project: job,
    template: current,
    noticeId: "66666666-6666-4666-8666-666666666666",
  });
  assert.ok(notice);
  job.impacts = [notice];
  const adopted = adoptSelected({
    project: job,
    template: current,
    publishedTemplate: published,
    notice,
    selectedItemIds: ["pd-planning-context"],
    now: "2026-09-16T02:00:00.000Z",
  });
  const answer = adopted.project.answers["pd-planning-context"];
  assert.equal(answer.status, "needs_recheck");
  assert.equal(answer.previousStatus, "done");
  assert.equal(answer.notes, "Signed off last week");
  assert.equal(answer.fields.budget, "1.8m");
  assert.equal(adopted.project.attachments[0].filename, "title.pdf");
  assert.equal(
    adopted.template.items.find((row) => row.id === "pd-planning-context")?.detail,
    "new wording",
  );
  assert.equal(adopted.project.impacts?.[0].status, "adopted");
  const progress = progressForProject(adopted.template, adopted.project);
  assert.equal(progress.done, 0);
});

test("unselected items keep their previous wording and status", () => {
  const current = template([
    item("pd-planning-context", "old one"),
    item("tp-need", "old two"),
  ]);
  const both = finding({
    itemIds: ["pd-planning-context", "tp-need"],
    proposed: { detail: "new both" },
  });
  const published = applyProposedToTemplate(current, both, { detail: "new both" });
  const job = projectDoc("house");
  job.answers["tp-need"] = {
    status: "in_progress",
    notes: "waiting on council",
    updatedAt: "2026-09-16T00:00:00.000Z",
    fields: {},
  };
  const notice = noticeFromRelease({
    release: {
      id: "55555555-5555-4555-8555-555555555555",
      findingId: "f",
      sourceTitle: "Clause 55",
      sourceUrl: "https://example.test/55",
      fromVersion: "1.0.5",
      toVersion: "1.0.6",
      publishedAt: "2026-09-16T01:00:00.000Z",
      changes: comparisonRows(current, both, { detail: "new both" }),
    },
    project: job,
    template: current,
    noticeId: "66666666-6666-4666-8666-666666666666",
  });
  assert.ok(notice);
  job.impacts = [notice];
  const adopted = adoptSelected({
    project: job,
    template: current,
    publishedTemplate: published,
    notice,
    selectedItemIds: ["pd-planning-context"],
    now: "2026-09-16T02:00:00.000Z",
  });
  assert.equal(
    adopted.template.items.find((row) => row.id === "tp-need")?.detail,
    "old two",
  );
  assert.equal(adopted.project.answers["tp-need"].status, "in_progress");
  assert.equal(adopted.project.impacts?.[0].changes[1].adopted, false);
});

test("adopting a remove drops the item and keeps the answer", () => {
  const current = template([
    item("pd-planning-context", "old wording"),
    item("keep", "keep wording"),
  ]);
  const published = template([item("keep", "keep wording")]);
  const job = projectDoc("house");
  const change = changeFromRemovedItem(current.items[0]!, 0);
  const notice = {
    id: "66666666-6666-4666-8666-666666666666",
    releaseId: "55555555-5555-4555-8555-555555555555",
    findingId: "f",
    sourceTitle: "Office",
    sourceUrl: "https://example.test/office",
    fromVersion: "1.0.5",
    toVersion: "1.0.6",
    publishedAt: "2026-09-16T01:00:00.000Z",
    status: "open" as const,
    changes: [{ ...change, adopted: false }],
  };
  job.impacts = [notice];
  const adopted = adoptSelected({
    project: job,
    template: current,
    publishedTemplate: published,
    notice,
    selectedItemIds: ["pd-planning-context"],
    now: "2026-09-16T02:00:00.000Z",
  });
  assert.equal(
    adopted.template.items.some((row) => row.id === "pd-planning-context"),
    false,
  );
  assert.equal(adopted.project.answers["pd-planning-context"].notes, "Signed off last week");
  assert.equal(adopted.project.answers["pd-planning-context"].status, "done");
});

test("adopting an add inserts the published item and marks needs recheck", () => {
  const current = template([item("keep", "keep wording")]);
  const extra = item("new-check", "Added from live template");
  extra.title = "New check";
  const published = template([item("keep", "keep wording"), extra]);
  const job = projectDoc("house");
  const change = changeFromAddedItem(extra, 1);
  const notice = {
    id: "66666666-6666-4666-8666-666666666666",
    releaseId: "55555555-5555-4555-8555-555555555555",
    findingId: "f",
    sourceTitle: "Office",
    sourceUrl: "https://example.test/office",
    fromVersion: "1.0.5",
    toVersion: "1.0.6",
    publishedAt: "2026-09-16T01:00:00.000Z",
    status: "open" as const,
    changes: [{ ...change, adopted: false }],
  };
  job.impacts = [notice];
  const adopted = adoptSelected({
    project: job,
    template: current,
    publishedTemplate: published,
    notice,
    selectedItemIds: ["new-check"],
    now: "2026-09-16T02:00:00.000Z",
  });
  assert.equal(
    adopted.template.items.find((row) => row.id === "new-check")?.detail,
    "Added from live template",
  );
  assert.equal(adopted.project.answers["new-check"].status, "needs_recheck");
});
