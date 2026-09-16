import { assertNever } from "@/lib/types";
import {
  DEFAULT_WATCH_SOURCES,
  SOURCE_CATEGORIES,
  type SourceCategory,
  type WatchSource,
} from "@/lib/scout/watch-list";

export const SCOUT_SETTINGS_FORMAT = "vic-arch-checklist-scout-settings" as const;
export const SCOUT_SETTINGS_ID = "default" as const;
export const STATEWIDE_BOARD_ID = "statewide-board" as const;

export const SCOUT_RUNNERS = ["cursor", "grokbot", "other"] as const;
export type ScoutRunner = (typeof SCOUT_RUNNERS)[number];

export const CADENCE_DAYS = [1, 7, 14, 28] as const;
export type CadenceDays = (typeof CADENCE_DAYS)[number];

export type ScoutSettings = {
  format: typeof SCOUT_SETTINGS_FORMAT;
  formatVersion: "1.0.0";
  id: typeof SCOUT_SETTINGS_ID;
  cadenceDays: number;
  runner: ScoutRunner;
  otherLabel: string;
  otherNotes: string;
  sources: WatchSource[];
};

export function isScoutRunner(value: string): value is ScoutRunner {
  return (SCOUT_RUNNERS as readonly string[]).includes(value);
}

export function runnerLabel(runner: ScoutRunner): string {
  switch (runner) {
    case "cursor":
      return "Cursor in-app";
    case "grokbot":
      return "Grok Bot";
    case "other":
      return "Other";
    default:
      return assertNever(runner, `Unknown scout runner: ${String(runner)}`);
  }
}

export function runnerSummary(runner: ScoutRunner, otherLabel: string): string {
  switch (runner) {
    case "cursor":
      return "This app fetches the listed pages, hashes them, and posts changes on the noticeboard. You still accept wording before any template draft.";
    case "grokbot":
      return "A Grok Bot brief is copied for you. The bot reads the listed sites and proposes flags; this app can still hash-check the same URLs.";
    case "other":
      return otherLabel.trim()
        ? `External scout: ${otherLabel.trim()}. This app can still hash-check the listed URLs on demand.`
        : "An external scout you name below. This app can still hash-check the listed URLs on demand.";
    default:
      return assertNever(runner, `Unknown scout runner: ${String(runner)}`);
  }
}

export function cadenceLabel(days: number): string {
  switch (days) {
    case 1:
      return "Daily";
    case 7:
      return "Weekly";
    case 14:
      return "Fortnightly";
    case 28:
      return "Every four weeks";
    default:
      return `Every ${days} days`;
  }
}

export function categoryLabel(category: SourceCategory): string {
  switch (category) {
    case "ncc":
      return "NCC / BPC";
    case "planning":
      return "Planning";
    case "arbv":
      return "ARBV";
    case "aia":
      return "AIA";
    case "builders":
      return "Builders’ associations";
    case "gazette":
      return "Gazette";
    case "consumer":
      return "Consumer / bond";
    case "other":
      return "Other";
    default:
      return assertNever(category, `Unknown source category: ${String(category)}`);
  }
}

export function defaultScoutSettings(): ScoutSettings {
  return {
    format: SCOUT_SETTINGS_FORMAT,
    formatVersion: "1.0.0",
    id: SCOUT_SETTINGS_ID,
    cadenceDays: 7,
    runner: "cursor",
    otherLabel: "",
    otherNotes: "",
    sources: structuredClone(DEFAULT_WATCH_SOURCES),
  };
}

export function mergeScoutSettings(saved: ScoutSettings | null): ScoutSettings {
  const defaults = defaultScoutSettings();
  if (!saved) {
    return defaults;
  }
  const byId = new Map(saved.sources.map((source) => [source.id, source]));
  const builtins = defaults.sources.map((source) => {
    const existing = byId.get(source.id);
    if (!existing) {
      return source;
    }
    return {
      ...source,
      enabled: existing.enabled,
      url: existing.url || source.url,
      flag: existing.flag || source.flag,
      proposedDetail: existing.proposedDetail || source.proposedDetail,
    };
  });
  const custom = saved.sources.filter((source) => !source.builtin);
  const cadenceDays = CADENCE_DAYS.includes(saved.cadenceDays as CadenceDays)
    ? saved.cadenceDays
    : 7;
  const runner = isScoutRunner(saved.runner) ? saved.runner : "cursor";
  return {
    ...defaults,
    cadenceDays,
    runner,
    otherLabel: saved.otherLabel ?? "",
    otherNotes: saved.otherNotes ?? "",
    sources: [...builtins, ...custom],
  };
}

export function enabledSources(
  settings: ScoutSettings,
  typology?: "house" | "townhouse" | "apartment",
): WatchSource[] {
  return settings.sources.filter((source) => {
    if (!source.enabled) {
      return false;
    }
    if (!typology) {
      return true;
    }
    return source.appliesTo.includes(typology);
  });
}

export function grokBotScoutBrief(settings: ScoutSettings): string {
  const sites = enabledSources(settings)
    .map(
      (source) =>
        `- ${source.title} (${categoryLabel(source.category)}): ${source.url}\n  Looking for: ${source.flag}`,
    )
    .join("\n");
  return [
    "Spin up a Grok Bot named VicCodeScout.",
    "Job: Statewide Victorian residential code scout (houses, townhouses, apartments).",
    runnerSummary(settings.runner, settings.otherLabel),
    `Cadence: ${cadenceLabel(settings.cadenceDays)}.`,
    "",
    "Sites and what to look for:",
    sites || "(no sites enabled)",
    "",
    "Do not lodge permits. Do not change project answers. Propose flags and wording only.",
    "If a page is blocked, list the URL and the checklist item ids for a human to tick.",
  ].join("\n");
}

export function settingsHaveRequiredBodies(settings: ScoutSettings): boolean {
  const ids = new Set(settings.sources.map((source) => source.id));
  return (
    ids.has("ncc-vic") &&
    ids.has("arbv-process") &&
    ids.has("aia-vic") &&
    ids.has("mbav")
  );
}

export { SOURCE_CATEGORIES };
export type { SourceCategory, WatchSource };
