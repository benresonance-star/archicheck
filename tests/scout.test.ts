import assert from "node:assert/strict";
import test from "node:test";
import {
  interpretLocal,
  interpretSource,
  localUnconfiguredFinding,
  normalizeScoutFinding,
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

test("changed hash flags the source without replacement wording", () => {
  const source = STATEWIDE_SOURCES.find((row) => row.id === "townhouse-code");
  assert.ok(source);
  const finding = interpretSource({
    source,
    snapshot: snapshot({ sourceId: source.id, sha256: "new" }),
    previous: { sourceId: source.id, sha256: "old" },
    typology: "townhouse",
  });
  assert.equal(finding.action, "needs_human");
  assert.equal(finding.hashChanged, true);
  assert.equal(finding.proposed, null);
  assert.equal(findingActionBadge(finding), "Source changed");
  assert.ok(finding.flag.includes("Open the source"));
  assert.ok(finding.flag.includes("Clause 55"));
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
  assert.equal(finding.proposed, null);
  assert.ok(finding.flag.includes("blocked"));
});

test("blank municipality yields local_unconfigured", () => {
  const finding = localUnconfiguredFinding();
  assert.equal(finding.scope, "local_unconfigured");
  assert.equal(finding.action, "needs_human");
});

test("local hash change flags the council list without replacement wording", () => {
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
  assert.equal(finding.action, "needs_human");
  assert.equal(finding.proposed, null);
  assert.ok(finding.flag.includes("Yarra"));
  assert.ok(finding.flag.includes("Open it"));
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
  assert.ok(
    settings.sources
      .find((source) => source.id === "ncc-vic")
      ?.url.includes("ncc-2025"),
  );
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

test("Grok Bot brief lists enabled sites and forbids wording rewrites", () => {
  const brief = grokBotScoutBrief(defaultScoutSettings());
  assert.ok(brief.includes("VicCodeScout"));
  assert.ok(brief.includes("Australian Institute of Architects"));
  assert.ok(brief.includes("Master Builders Victoria"));
  assert.ok(brief.includes("National Construction Code"));
  assert.ok(brief.includes("Do not rewrite checklist wording"));
  assert.ok(brief.includes("Propose flags only"));
});

test("published hash-change findings become flags", () => {
  const finding = normalizeScoutFinding({
    id: "f-ncc",
    sourceId: "ncc-abcb-2025",
    sourceTitle: "NCC 2025 Housing Provisions",
    url: "https://ncc.abcb.gov.au/ncc-2025",
    scope: "statewide",
    action: "replace",
    itemIds: ["pd-arbv"],
    flag: "Hash change on NCC 2025",
    proposed: { detail: "Confirm architect registration is current." },
    confidence: "low",
    status: "published",
    hashChanged: false,
    baseline: false,
  });
  assert.equal(finding.action, "needs_human");
  assert.equal(finding.proposed, null);
  assert.equal(findingActionBadge(finding), "Source changed");
});

test("stored canned replace findings become flags", () => {
  const gazette = STATEWIDE_SOURCES.find((row) => row.id === "gazette");
  assert.ok(gazette);
  const finding = normalizeScoutFinding({
    id: "f-gazette",
    sourceId: gazette.id,
    sourceTitle: gazette.title,
    url: gazette.url,
    scope: "statewide",
    action: "replace",
    itemIds: gazette.itemIds,
    flag: gazette.flag,
    proposed: { detail: gazette.proposedDetail },
    confidence: "low",
    status: "open",
    hashChanged: true,
    baseline: false,
  });
  assert.equal(finding.action, "needs_human");
  assert.equal(finding.proposed, null);
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
