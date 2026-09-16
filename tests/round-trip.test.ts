import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { sha256Bytes, sha256Json, templateChecksumPayload } from "../src/lib/hash";
import { BUNDLED_TEMPLATE } from "../src/lib/template/vic-residential";
import {
  addAttachment,
  createProject,
  exportProjectZip,
  importProjectZip,
  listProjects,
  loadProject,
  readAttachmentBytes,
  setAnswer,
} from "../src/lib/store";
import { validateTemplateDocument } from "../src/lib/validate";
import { unpackZip } from "../src/lib/zip-package";

test("bundled template validates and checksums", () => {
  validateTemplateDocument(BUNDLED_TEMPLATE);
  const computed = sha256Json(
    templateChecksumPayload(BUNDLED_TEMPLATE as unknown as Record<string, unknown>),
  );
  assert.equal(BUNDLED_TEMPLATE.checksum, computed);
});

test("export ZIP into a wiped installation restores answers, notes, attachments and template", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "vic-checklist-"));
  process.env.DATA_DIR = dir;
  try {
    const created = await createProject({
      site: {
        name: "Fitzroy North townhouses",
        typology: "townhouse",
        address: "12 Napier St, Fitzroy North VIC 3068",
        municipality: "Yarra",
        planningScheme: "Yarra Planning Scheme",
        zone: "GRZ2",
        overlays: ["HO327"],
        storeys: 2,
        dwellingCount: 3,
        lotAreaSqm: 428,
        notes: "Lane access off the rear.",
      },
    });

    await setAnswer(created.project.id, "pd-brief", {
      status: "done",
      notes: "Three 3-bed dwellings, no basement.",
      fields: { budget: "1.8m" },
    });
    await setAnswer(created.project.id, "cd-cl55", {
      status: "in_progress",
      notes: "Deemed-to-comply canopy is the open question.",
    });

    const attachmentBytes = Buffer.from("title search excerpt\n", "utf8");
    await addAttachment({
      projectId: created.project.id,
      itemId: "pd-title",
      filename: "title-excerpt.txt",
      mimeType: "text/plain",
      bytes: attachmentBytes,
    });

    const exported = await exportProjectZip(created.project.id);
    const unpacked = await unpackZip(exported.bytes);
    assert.equal(unpacked.project.answers["pd-brief"].notes, "Three 3-bed dwellings, no basement.");
    assert.equal(unpacked.template.id, "vic-residential");
    assert.equal(unpacked.template.checksum, created.project.template.checksum);

    await rm(path.join(dir, "projects"), { recursive: true, force: true });
    assert.equal((await listProjects()).length, 0);

    const restored = await importProjectZip(exported.bytes);
    const loaded = await loadProject(restored.project.id);

    assert.equal(loaded.project.site.name, "Fitzroy North townhouses");
    assert.equal(loaded.project.answers["pd-brief"].status, "done");
    assert.equal(
      loaded.project.answers["pd-brief"].notes,
      "Three 3-bed dwellings, no basement.",
    );
    assert.equal(loaded.project.answers["pd-brief"].fields.budget, "1.8m");
    assert.equal(
      loaded.project.answers["cd-cl55"].notes,
      "Deemed-to-comply canopy is the open question.",
    );
    assert.equal(loaded.project.template.id, unpacked.template.id);
    assert.equal(loaded.project.template.version, unpacked.template.version);
    assert.equal(loaded.project.template.checksum, unpacked.template.checksum);
    assert.equal(loaded.template.checksum, unpacked.template.checksum);
    assert.equal(loaded.project.attachments.length, 1);
    assert.equal(loaded.project.attachments[0].filename, "title-excerpt.txt");
    assert.equal(loaded.project.attachments[0].sha256, sha256Bytes(attachmentBytes));

    const stored = await readAttachmentBytes(
      loaded.project.id,
      loaded.project.attachments[0].id,
    );
    assert.deepEqual(stored.bytes, attachmentBytes);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
