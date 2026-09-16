import assert from "node:assert/strict";
import test from "node:test";
import {
  addItemToTemplate,
  applyItemChangeToTemplate,
  arrayMove,
  buildChecklistItem,
  bumpJobVersion,
  changeFromAddedItem,
  changeFromRemovedItem,
  changeNeedsRecheck,
  diffTemplateItems,
  moveItemAmongSiblings,
  removeItemFromTemplate,
  reorderItemsAmongSiblings,
  updateItemInTemplate,
} from "../src/lib/template/checklist-crud";
import { noticeFromRelease } from "../src/lib/template/publish";
import {
  FORMAT_VERSION,
  PROJECT_FORMAT,
  isJobOnlyItemId,
  type ProjectDocument,
  type TemplateDocument,
} from "../src/lib/types";

function item(
  id: string,
  title = id,
): TemplateDocument["items"][number] {
  return {
    id,
    stageId: "pre-design",
    title,
    detail: `${title} detail`,
    appliesTo: ["house"],
    required: true,
    references: ["source"],
    resources: [],
    grokbotId: "bot-pre-design",
  };
}

function template(items: TemplateDocument["items"]): TemplateDocument {
  return {
    format: "vic-arch-checklist-template",
    formatVersion: "1.0.0",
    id: "vic-residential",
    version: "1.0.8",
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

function projectDoc(): ProjectDocument {
  return {
    format: PROJECT_FORMAT,
    formatVersion: FORMAT_VERSION,
    id: "22222222-2222-4222-8222-222222222222",
    revision: 1,
    createdAt: "2026-09-16T00:00:00.000Z",
    updatedAt: "2026-09-16T00:00:00.000Z",
    template: {
      id: "vic-residential",
      version: "1.0.8",
      checksum: "a".repeat(64),
    },
    site: {
      name: "Job",
      typology: "house",
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
      first: {
        status: "done",
        notes: "Keep me",
        updatedAt: "2026-09-16T00:00:00.000Z",
        fields: { budget: "1.8m" },
      },
    },
    attachments: [],
    impacts: [],
  };
}

test("job item ids stay job-prefixed and versions bump locally", () => {
  assert.equal(isJobOnlyItemId("job-aaaa"), true);
  assert.equal(isJobOnlyItemId("pd-brief"), false);
  assert.equal(bumpJobVersion("1.0.8"), "1.0.8-job.1");
  assert.equal(bumpJobVersion("1.0.8-job.1"), "1.0.8-job.2");
  assert.equal(bumpJobVersion("1.0.8-draft.3"), "1.0.8-job.1");
});

test("add, edit, move and remove change only the snapshot", () => {
  const start = template([item("first", "One"), item("second", "Two")]);
  const added = addItemToTemplate(
    start,
    buildChecklistItem({
      id: "job-new",
      draft: {
        title: "Job check",
        detail: "Office practice on this job",
        references: ["Office practice"],
        resources: [],
        required: true,
        appliesTo: ["house"],
        stageId: "pre-design",
        outputKind: "record",
      },
    }),
    "first",
  );
  assert.equal(added.items.map((row) => row.id).join(","), "first,job-new,second");
  assert.equal(start.items.length, 2);

  const edited = updateItemInTemplate(added, "job-new", {
    title: "Renamed job check",
  });
  assert.equal(
    edited.items.find((row) => row.id === "job-new")?.title,
    "Renamed job check",
  );

  const moved = moveItemAmongSiblings(
    edited,
    edited.items.map((row) => row.id),
    "job-new",
    "down",
  );
  assert.equal(moved.items.map((row) => row.id).join(","), "first,second,job-new");
  assert.deepEqual(arrayMove(["a", "b", "c"], 0, 2), ["b", "c", "a"]);
  const dragged = reorderItemsAmongSiblings(edited, [
    "second",
    "first",
    "job-new",
  ]);
  assert.equal(dragged.items.map((row) => row.id).join(","), "second,first,job-new");

  const answers = { ...projectDoc().answers };
  const removed = removeItemFromTemplate(moved, "first");
  assert.equal(
    removed.items.some((row) => row.id === "first"),
    false,
  );
  assert.equal(answers.first?.notes, "Keep me");
});

test("diffing a live draft yields add, edit, remove and move", () => {
  const before = template([item("keep"), item("gone"), item("moved")]);
  const after = template([
    item("keep", "Keep edited"),
    item("moved"),
    buildChecklistItem({
      id: "tpl-new",
      draft: {
        title: "New live check",
        detail: "Added on the live template",
        references: ["VPP"],
        resources: [],
        required: true,
        appliesTo: ["house"],
        stageId: "pre-design",
      },
    }),
  ]);
  const changes = diffTemplateItems(before, after);
  assert.equal(changes.some((row) => row.kind === "add" && row.itemId === "tpl-new"), true);
  assert.equal(changes.some((row) => row.kind === "remove" && row.itemId === "gone"), true);
  assert.equal(changes.some((row) => row.kind === "edit" && row.itemId === "keep"), true);
  assert.equal(changes.some((row) => row.kind === "move" && row.itemId === "moved"), true);
});

test("applying a remove keeps the item out and add restores published wording", () => {
  const current = template([item("first"), item("second")]);
  const published = addItemToTemplate(current, item("third", "Third"));
  const removed = applyItemChangeToTemplate(
    current,
    changeFromRemovedItem(current.items[0]!, 0),
  );
  assert.equal(removed.items.map((row) => row.id).join(","), "second");
  const added = applyItemChangeToTemplate(
    current,
    changeFromAddedItem(published.items[2]!, 2),
    published,
  );
  assert.equal(added.items.some((row) => row.id === "third"), true);
});

test("apartment-only add does not notice a house job", () => {
  const current = template([item("first")]);
  const added = buildChecklistItem({
    id: "tpl-apt",
    draft: {
      title: "Apartment only",
      detail: "BADS",
      references: ["Clause 58"],
      resources: [],
      required: true,
      appliesTo: ["apartment"],
      stageId: "pre-design",
    },
  });
  const notice = noticeFromRelease({
    release: {
      id: "55555555-5555-4555-8555-555555555555",
      findingId: "f",
      sourceTitle: "BADS",
      sourceUrl: "https://example.test/58",
      fromVersion: "1.0.8",
      toVersion: "1.0.9",
      publishedAt: "2026-09-16T01:00:00.000Z",
      changes: [changeFromAddedItem(added, 1)],
    },
    project: projectDoc(),
    template: current,
    noticeId: "66666666-6666-4666-8666-666666666666",
  });
  assert.equal(notice, null);
});

test("move does not need recheck; add and wording do", () => {
  assert.equal(changeNeedsRecheck({ ...changeFromAddedItem(item("n"), 0) }), true);
  assert.equal(
    changeNeedsRecheck({
      itemId: "first",
      title: "first",
      kind: "move",
      beforeTitle: "first",
      afterTitle: "first",
      beforeDetail: "d",
      afterDetail: "d",
      beforeReferences: [],
      afterReferences: [],
      beforeIndex: 0,
      afterIndex: 1,
    }),
    false,
  );
});
