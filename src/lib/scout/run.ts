import { interpretLocal, interpretSource, localUnconfiguredFinding } from "@/lib/scout/interpret";
import { localAmendmentsUrl, resolveMunicipality } from "@/lib/scout/municipalities";
import { fetchSnapshot } from "@/lib/scout/fetch-snapshot";
import {
  SCOUT_FORMAT_VERSION,
  SCOUT_REPORT_FORMAT,
  type ScoutFinding,
  type ScoutReport,
} from "@/lib/scout/types";
import {
  DEFAULT_WATCH_SOURCES,
  type PreviousSnapshot,
  type WatchSource,
} from "@/lib/scout/watch-list";
import type { Typology } from "@/lib/types";

export async function runScout(input: {
  projectId: string;
  municipality: string;
  typology: Typology;
  previous: PreviousSnapshot[];
  sources?: WatchSource[];
  includeLocal?: boolean;
  ignoreTypology?: boolean;
  kind?: "statewide" | "project";
}): Promise<ScoutReport> {
  const previousById = new Map(input.previous.map((row) => [row.sourceId, row]));
  const includeLocal = input.includeLocal !== false;
  const ignoreTypology = Boolean(input.ignoreTypology);
  const kind = input.kind ?? "project";
  const pool = (
    input.sources === undefined ? DEFAULT_WATCH_SOURCES : input.sources
  ).filter((source) => source.enabled !== false);
  const sources = ignoreTypology
    ? pool
    : pool.filter((source) => source.appliesTo.includes(input.typology));

  const statewideSnapshots = await Promise.all(
    sources.map((source) =>
      fetchSnapshot({
        sourceId: source.id,
        title: source.title,
        url: source.url,
        scope: "statewide",
      }),
    ),
  );

  const findings: ScoutFinding[] = sources.map((source, index) =>
    interpretSource({
      source,
      snapshot: statewideSnapshots[index],
      previous: previousById.get(source.id),
      typology: input.typology,
      ignoreTypology,
    }),
  );

  const snapshots = [...statewideSnapshots];
  let localConfigured = false;

  if (includeLocal) {
    const municipality = resolveMunicipality(input.municipality);
    localConfigured = Boolean(municipality);
    if (!municipality) {
      findings.push(localUnconfiguredFinding());
    } else {
      const url = localAmendmentsUrl(municipality);
      const localSnapshot = await fetchSnapshot({
        sourceId: "local-amendments",
        title: `${municipality.name} amendments`,
        url,
        scope: "local",
      });
      snapshots.push(localSnapshot);
      findings.push(
        interpretLocal({
          municipalityName: municipality.name,
          url,
          snapshot: localSnapshot,
          previous: previousById.get("local-amendments"),
        }),
      );
    }
  }

  return {
    format: SCOUT_REPORT_FORMAT,
    formatVersion: SCOUT_FORMAT_VERSION,
    id: crypto.randomUUID(),
    projectId: input.projectId,
    kind,
    ranAt: new Date().toISOString(),
    municipality: input.municipality.trim(),
    localConfigured,
    typology: input.typology,
    snapshots,
    findings,
  };
}
