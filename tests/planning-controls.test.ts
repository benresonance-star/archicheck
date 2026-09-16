import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import {
  applyPlanningControls,
  overlayGroupLabel,
  OVERLAY_GROUPS,
  parentPlanningCode,
  PLANNING_OVERLAYS,
  PLANNING_PROPERTY_REPORT_URL,
  PLANNING_ZONES,
  planningControlUrl,
  siteOverlayCodes,
  siteZoneCodes,
  ZONE_GROUPS,
  zoneGroupLabel,
} from "../src/lib/planning-controls";
import { validateProjectDocument } from "../src/lib/validate";
import { FORMAT_VERSION, PROJECT_FORMAT } from "../src/lib/types";
import { BUNDLED_TEMPLATE } from "../src/lib/template/vic-residential";

const UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

function httpStatus(url: string): number {
  const result = spawnSync(
    "curl",
    [
      "-sS",
      "-o",
      "/dev/null",
      "-w",
      "%{http_code}",
      "-L",
      "--max-time",
      "20",
      "-A",
      UA,
      url,
    ],
    { encoding: "utf8" },
  );
  if (result.error) {
    throw result.error;
  }
  const code = Number.parseInt(result.stdout.trim(), 10);
  assert.ok(Number.isInteger(code), `${url} curl: ${result.stderr || result.stdout}`);
  return code;
}

test("zone and overlay catalogs are unique and sourced", () => {
  const zoneCodes = PLANNING_ZONES.map((row) => row.code);
  const overlayCodes = PLANNING_OVERLAYS.map((row) => row.code);
  assert.equal(new Set(zoneCodes).size, zoneCodes.length);
  assert.equal(new Set(overlayCodes).size, overlayCodes.length);
  assert.ok(zoneCodes.includes("GRZ"));
  assert.ok(zoneCodes.includes("HCTZ"));
  assert.ok(overlayCodes.includes("HO"));
  assert.ok(overlayCodes.includes("BFO"));
  for (const group of ZONE_GROUPS) {
    assert.ok(zoneGroupLabel(group).length > 0);
  }
  for (const group of OVERLAY_GROUPS) {
    assert.ok(overlayGroupLabel(group).length > 0);
  }
  for (const control of [...PLANNING_ZONES, ...PLANNING_OVERLAYS]) {
    assert.ok(planningControlUrl(control).startsWith("https://"));
  }
});

test("legacy schedule strings map to VPP parent codes and keep multi-select", () => {
  assert.equal(parentPlanningCode("GRZ2", PLANNING_ZONES), "GRZ");
  assert.equal(parentPlanningCode("HO327", PLANNING_OVERLAYS), "HO");
  assert.equal(parentPlanningCode("DDO10", PLANNING_OVERLAYS), "DDO");
  assert.equal(parentPlanningCode("MUZ", PLANNING_ZONES), "MUZ");
  const site = applyPlanningControls(
    {
      name: "Split lot",
      typology: "house",
      address: "",
      municipality: "",
      planningScheme: "",
      zone: "GRZ2",
      overlays: ["HO327"],
      storeys: 2,
      dwellingCount: 1,
      lotAreaSqm: null,
      notes: "",
    },
    { zones: ["GRZ", "MUZ"], overlays: ["HO", "SBO", "DDO"] },
  );
  assert.deepEqual(site.zones, ["GRZ", "MUZ"]);
  assert.equal(site.zone, "GRZ, MUZ");
  assert.deepEqual(site.overlays, ["HO", "SBO", "DDO"]);
  assert.deepEqual(siteZoneCodes({ zone: "GRZ2 / MUZ" }), ["GRZ", "MUZ"]);
  assert.deepEqual(siteOverlayCodes({ overlays: ["HO327", "SBO"] }), [
    "HO",
    "SBO",
  ]);
});

test("older project JSON with a single zone string still validates", () => {
  const project = validateProjectDocument({
    format: PROJECT_FORMAT,
    formatVersion: FORMAT_VERSION,
    id: "00000000-0000-4000-8000-000000000001",
    revision: 1,
    createdAt: "2026-09-16T00:00:00.000Z",
    updatedAt: "2026-09-16T00:00:00.000Z",
    template: {
      id: BUNDLED_TEMPLATE.id,
      version: BUNDLED_TEMPLATE.version,
      checksum: BUNDLED_TEMPLATE.checksum,
    },
    site: {
      name: "Legacy house",
      typology: "house",
      address: "",
      municipality: "",
      planningScheme: "",
      zone: "GRZ2",
      overlays: ["HO327"],
      storeys: 2,
      dwellingCount: 1,
      lotAreaSqm: 400,
      notes: "",
    },
    answers: {},
    attachments: [],
  });
  assert.equal(project.site.zone, "GRZ2");
  assert.equal(project.site.zones, undefined);
  assert.deepEqual(siteZoneCodes(project.site), ["GRZ"]);
});

test("planning property report and VPP clause URLs are not 404", () => {
  const urls = [
    PLANNING_PROPERTY_REPORT_URL,
    ...PLANNING_ZONES.filter((row) => row.clause).map(planningControlUrl),
    ...PLANNING_OVERLAYS.map(planningControlUrl),
  ];
  const missing: string[] = [];
  for (const url of [...new Set(urls)]) {
    const status = httpStatus(url);
    if (status === 404 || status === 410) {
      missing.push(`${status} ${url}`);
    }
  }
  assert.deepEqual(missing, []);
});
