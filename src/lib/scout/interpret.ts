import type { Typology } from "@/lib/types";
import type {
  ScoutFinding,
  ScoutSnapshot,
} from "@/lib/scout/types";
import type { PreviousSnapshot, WatchSource } from "@/lib/scout/watch-list";

export function interpretSource(input: {
  source: WatchSource;
  snapshot: ScoutSnapshot;
  previous: PreviousSnapshot | undefined;
  typology: Typology;
  ignoreTypology?: boolean;
}): ScoutFinding {
  const applies =
    Boolean(input.ignoreTypology) || input.source.appliesTo.includes(input.typology);
  const itemIds = applies ? input.source.itemIds : [];
  const baseline = !input.previous;
  const hashChanged = Boolean(
    input.previous &&
      input.snapshot.sha256 &&
      input.previous.sha256 !== input.snapshot.sha256,
  );

  if (!input.snapshot.ok) {
    return {
      id: crypto.randomUUID(),
      sourceId: input.source.id,
      sourceTitle: input.source.title,
      url: input.source.url,
      scope: "statewide",
      action: "needs_human",
      itemIds,
      flag: `${input.source.flag} Automated fetch was blocked (${input.snapshot.error ?? "network"}).`,
      proposed: applies
        ? {
            detail: input.source.proposedDetail,
            references: [input.source.url],
          }
        : null,
      confidence: "low",
      status: "open",
      hashChanged: false,
      baseline: false,
    };
  }

  if (baseline) {
    return {
      id: crypto.randomUUID(),
      sourceId: input.source.id,
      sourceTitle: input.source.title,
      url: input.source.url,
      scope: "statewide",
      action: "no_change",
      itemIds,
      flag: `Baseline stored for ${input.source.title}. Next weekly run will compare. ${input.source.flag}`,
      proposed: null,
      confidence: "high",
      status: "open",
      hashChanged: false,
      baseline: true,
    };
  }

  if (!hashChanged) {
    return {
      id: crypto.randomUUID(),
      sourceId: input.source.id,
      sourceTitle: input.source.title,
      url: input.source.url,
      scope: "statewide",
      action: "no_change",
      itemIds,
      flag: `No hash change on ${input.source.title}. ${input.source.flag}`,
      proposed: null,
      confidence: "high",
      status: "open",
      hashChanged: false,
      baseline: false,
    };
  }

  return {
    id: crypto.randomUUID(),
    sourceId: input.source.id,
    sourceTitle: input.source.title,
    url: input.source.url,
    scope: "statewide",
    action: applies ? "replace" : "needs_human",
    itemIds,
    flag: input.source.flag,
    proposed: applies
      ? {
          detail: input.source.proposedDetail,
          references: [input.source.url],
        }
      : null,
    confidence: "low",
    status: "open",
    hashChanged: true,
    baseline: false,
  };
}

export function localUnconfiguredFinding(): ScoutFinding {
  return {
    id: crypto.randomUUID(),
    sourceId: "local-municipality",
    sourceTitle: "Local planning scheme",
    url: "",
    scope: "local_unconfigured",
    action: "needs_human",
    itemIds: ["pd-planning-context"],
    flag: "Set municipality on this project (e.g. Yarra) so Scout can watch that council’s C-amendments. Statewide sources still ran.",
    proposed: null,
    confidence: "high",
    status: "open",
    hashChanged: false,
    baseline: false,
  };
}

export function interpretLocal(input: {
  municipalityName: string;
  url: string;
  snapshot: ScoutSnapshot;
  previous: PreviousSnapshot | undefined;
}): ScoutFinding {
  const itemIds = ["pd-planning-context", "tp-need", "tp-rfi"];
  const baseline = !input.previous;
  const hashChanged = Boolean(
    input.previous &&
      input.snapshot.sha256 &&
      input.previous.sha256 !== input.snapshot.sha256,
  );

  if (!input.snapshot.ok) {
    return {
      id: crypto.randomUUID(),
      sourceId: "local-amendments",
      sourceTitle: `${input.municipalityName} amendments`,
      url: input.url,
      scope: "local",
      action: "needs_human",
      itemIds,
      flag: `Open the ${input.municipalityName} amendments list and check for C-amendments that affect this site’s zone or overlays. Tick planning-context if a local amendment is on exhibition or recently gazetted.`,
      proposed: {
        detail: `Local (${input.municipalityName}) amendment pages could not be fetched automatically. Recheck the planning scheme amendments list before lodgement.`,
        references: [input.url],
      },
      confidence: "low",
      status: "open",
      hashChanged: false,
      baseline: false,
    };
  }

  if (baseline) {
    return {
      id: crypto.randomUUID(),
      sourceId: "local-amendments",
      sourceTitle: `${input.municipalityName} amendments`,
      url: input.url,
      scope: "local",
      action: "no_change",
      itemIds,
      flag: `Baseline stored for ${input.municipalityName}. Next weekly run will compare C-amendments. Tick planning-context if you already know a local amendment is on foot.`,
      proposed: null,
      confidence: "high",
      status: "open",
      hashChanged: false,
      baseline: true,
    };
  }

  if (!hashChanged) {
    return {
      id: crypto.randomUUID(),
      sourceId: "local-amendments",
      sourceTitle: `${input.municipalityName} amendments`,
      url: input.url,
      scope: "local",
      action: "no_change",
      itemIds,
      flag: `No hash change on ${input.municipalityName} amendments. Still open the list if you are about to lodge.`,
      proposed: null,
      confidence: "high",
      status: "open",
      hashChanged: false,
      baseline: false,
    };
  }

  return {
    id: crypto.randomUUID(),
    sourceId: "local-amendments",
    sourceTitle: `${input.municipalityName} amendments`,
    url: input.url,
    scope: "local",
    action: "replace",
    itemIds,
    flag: `The ${input.municipalityName} amendments list changed. Read it and tick planning-context / planning-permit items if a C-amendment affects this lot, overlay or zone.`,
    proposed: {
      detail: `The ${input.municipalityName} planning scheme amendments list has changed. Recheck local C-amendments, overlay schedules and any exhibition dates before lodgement.`,
      references: [input.url],
    },
    confidence: "low",
    status: "open",
    hashChanged: true,
    baseline: false,
  };
}
