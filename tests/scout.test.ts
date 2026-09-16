import assert from "node:assert/strict";
import test from "node:test";
import {
  interpretLocal,
  interpretSource,
  localUnconfiguredFinding,
} from "../src/lib/scout/interpret";
import { resolveMunicipality } from "../src/lib/scout/municipalities";
import { findingActionBadge, findingDisplayFlag, isBlockedFinding, scoutIsDue } from "../src/lib/scout/types";
import { applyProposedToTemplate } from "../src/lib/scout/apply-wording";
import {
  defaultScoutSettings,
  grokBotScoutBrief,
  mergeScoutSettings,
  settingsHaveRequiredBodies,
} from "../src/lib/scout/settings";
import { STATEWIDE_SOURCES } from "../src/lib/scout/watch-list";
import type { ScoutFinding, ScoutSnapshot } from "../src/lib/scout/types";
import type { TemplateDocument } from "../src/lib/types";

function snapshot(partial: Partial<ScoutSnapshot> & Pick<ScoutSnapshot, "sourceId">): ScoutSnapshot {
  return {
    title: "t",
    url: "https://example.test",
    scope: "statewide",
    ok: true,
    httpStatus: 200,
    sha256: "aaa",
    excerpt: "hello",
    error: null,
    fetchedAt: "2026-09-16T00:00:00.000Z",
    ...partial,
  };
}

test("resolves Yarra municipality aliases", () => {
  const found = resolveMunicipality("City of Yarra");
  assert.equal(found?.name, "Yarra");
  assert.equal(resolveMunicipality(""), null);
});

test("baseline snapshot is no_change", () => {
  const source = STATEWIDE_SOURCES[0];
  const finding = interpretSource({
    source,
    snapshot: snapshot({ sourceId: source.id, sha256: "abc" }),
    previous: undefined,
    typology: "townhouse",
  });
  assert.equal(finding.action, "no_change");
  assert.equal(finding.baseline, true);
  assert.ok(finding.itemIds.includes("pd-planning-context"));
});

test("unchanged hash stays no_change", () => {
  const source = STATEWIDE_SOURCES[0];
  const finding = interpretSource({
    source,
    snapshot: snapshot({ sourceId: source.id, sha256: "abc" }),
    previous: { sourceId: source.id, sha256: "abc" },
    typology: "house",
  });
  assert.equal(finding.action, "no_change");
  assert.equal(finding.hashChanged, false);
});

test("changed hash proposes replace wording and a flag", () => {
  const source = STATEWIDE_SOURCES.find((row) => row.id === "townhouse-code");
  assert.ok(source);
  const finding = interpretSource({
    source,
    snapshot: snapshot({ sourceId: source.id, sha256: "new" }),
    previous: { sourceId: source.id, sha256: "old" },
    typology: "townhouse",
  });
  assert.equal(finding.action, "replace");
  assert.equal(finding.hashChanged, true);
  assert.ok(finding.flag.includes("Clause 55"));
  assert.ok(finding.proposed?.detail);
  assert.ok(finding.itemIds.includes("cd-cl55"));
  assert.ok(source.url.includes("/All%20schemes/55"));
});

test("blocked Cloudflare fetches are grouped separately from wording changes", () => {
  const source = STATEWIDE_SOURCES[0];
  const blocked = interpretSource({
    source,
    snapshot: snapshot({
      sourceId: source.id,
      ok: false,
      sha256: null,
      error: "HTTP 403",
    }),
    previous: { sourceId: source.id, sha256: "old" },
    typology: "house",
  });
  assert.equal(isBlockedFinding(blocked), true);
  assert.equal(findingActionBadge(blocked), "Blocked");
  assert.equal(
    findingDisplayFlag(blocked).includes("Automated fetch"),
    false,
  );
  const changed = interpretSource({
    source,
    snapshot: snapshot({ sourceId: source.id, sha256: "new" }),
    previous: { sourceId: source.id, sha256: "old" },
    typology: "house",
  });
  assert.equal(isBlockedFinding(changed), false);
});

test("failed fetch needs a human and still carries a flag", () => {
  const source = STATEWIDE_SOURCES[0];
  const finding = interpretSource({
    source,
    snapshot: snapshot({
      sourceId: source.id,
      ok: false,
      sha256: null,
      error: "HTTP 403",
    }),
    previous: { sourceId: source.id, sha256: "old" },
    typology: "house",
  });
  assert.equal(finding.action, "needs_human");
  assert.ok(finding.flag.includes("blocked"));
});

test("blank municipality yields local_unconfigured", () => {
  const finding = localUnconfiguredFinding();
  assert.equal(finding.scope, "local_unconfigured");
  assert.equal(finding.action, "needs_human");
});

test("local hash change proposes replace for that council", () => {
  const finding = interpretLocal({
    municipalityName: "Yarra",
    url: "https://example.test/yarra",
    snapshot: snapshot({
      sourceId: "local-amendments",
      scope: "local",
      sha256: "new",
    }),
    previous: { sourceId: "local-amendments", sha256: "old" },
  });
  assert.equal(finding.action, "replace");
  assert.ok(finding.flag.includes("Yarra"));
  assert.ok(finding.proposed?.detail?.includes("Yarra"));
});

test("scout is due after a week", () => {
  assert.equal(scoutIsDue(null), true);
  assert.equal(scoutIsDue(new Date().toISOString()), false);
  assert.equal(
    scoutIsDue(new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()),
    true,
  );
  assert.equal(
    scoutIsDue(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), 1),
    true,
  );
});

test("bundled watch list includes NCC, ARBV, AIA and builders associations", () => {
  const settings = defaultScoutSettings();
  assert.equal(settingsHaveRequiredBodies(settings), true);
  const ids = settings.sources.map((source) => source.id);
  assert.ok(ids.includes("ncc-vic"));
  assert.ok(ids.includes("ncc-abcb"));
  assert.ok(ids.includes("ncc-abcb-2025"));
  assert.ok(ids.includes("vic-building-regs"));
  assert.ok(ids.includes("arbv-process"));
  assert.ok(ids.includes("aia-vic"));
  assert.ok(ids.includes("mbav"));
  assert.ok(ids.includes("hia"));
  assert.ok(
    settings.sources
      .find((source) => source.id === "townhouse-code")
      ?.url.includes("/All%20schemes/55"),
  );
  assert.ok(
    settings.sources
      .find((source) => source.id === "better-apartments")
      ?.url.includes("/All%20schemes/58"),
  );
});

test("mergeScoutSettings adds new bundled sites without dropping custom ones", () => {
  const saved = defaultScoutSettings();
  saved.sources = saved.sources.filter((source) => source.id !== "hia");
  const abcb = saved.sources.find((source) => source.id === "ncc-abcb");
  if (abcb) {
    abcb.url = "https://www.abcb.gov.au/ncc";
  }
  saved.sources.push({
    id: "custom-practice",
    title: "Practice wiki",
    url: "https://example.test/wiki",
    scope: "statewide",
    category: "other",
    enabled: true,
    builtin: false,
    itemIds: [],
    flag: "Internal notes",
    proposedDetail: "",
    appliesTo: ["house"],
  });
  const merged = mergeScoutSettings(saved);
  assert.ok(merged.sources.some((source) => source.id === "hia"));
  assert.ok(merged.sources.some((source) => source.id === "custom-practice"));
  assert.equal(
    merged.sources.find((source) => source.id === "ncc-abcb")?.url,
    "https://ncc.abcb.gov.au/",
  );
});

test("Grok Bot brief lists enabled sites and what they look for", () => {
  const brief = grokBotScoutBrief(defaultScoutSettings());
  assert.ok(brief.includes("VicCodeScout"));
  assert.ok(brief.includes("Australian Institute of Architects"));
  assert.ok(brief.includes("Master Builders Victoria"));
  assert.ok(brief.includes("National Construction Code"));
});

test("accepting proposed wording updates every flagged item, not answers", () => {
  const template: TemplateDocument = {
    format: "vic-arch-checklist-template",
    formatVersion: "1.0.0",
    id: "tpl",
    version: "1.0.0",
    title: "t",
    jurisdiction: "Victoria",
    description: "",
    checksum: "x",
    stages: [],
    grokbots: [],
    items: [
      {
        id: "pd-planning-context",
        stageId: "pre-design",
        title: "Planning context",
        detail: "old one",
        appliesTo: ["house"],
        required: true,
        references: [],
        resources: [],
        grokbotId: "bot",
      },
      {
        id: "tp-need",
        stageId: "town-planning",
        title: "Permit need",
        detail: "old two",
        appliesTo: ["house"],
        required: true,
        references: [],
        resources: [],
        grokbotId: "bot",
      },
    ],
  };
  const finding: ScoutFinding = {
    id: "f1",
    sourceId: "local-amendments",
    sourceTitle: "Yarra amendments",
    url: "https://example.test",
    scope: "local",
    action: "replace",
    itemIds: ["pd-planning-context", "tp-need"],
    flag: "flag",
    proposed: { detail: "new wording" },
    confidence: "low",
    status: "open",
    hashChanged: true,
    baseline: false,
  };
  const next = applyProposedToTemplate(template, finding, {
    detail: "new wording",
    references: ["https://example.test"],
  });
  assert.equal(next.items[0].detail, "new wording");
  assert.equal(next.items[1].detail, "new wording");
  assert.equal(template.items[0].detail, "old one");
});
