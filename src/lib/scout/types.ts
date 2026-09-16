import type { ChecklistItem, Typology } from "@/lib/types";
import { assertNever } from "@/lib/types";

export const SCOUT_REPORT_FORMAT = "vic-arch-checklist-scout-report" as const;
export const SCOUT_FORMAT_VERSION = "1.0.0" as const;

export const SCOUT_SCOPES = ["statewide", "local", "local_unconfigured"] as const;
export type ScoutScope = (typeof SCOUT_SCOPES)[number];

export const SCOUT_ACTIONS = [
  "add",
  "replace",
  "split",
  "supersede",
  "no_change",
  "needs_human",
] as const;
export type ScoutAction = (typeof SCOUT_ACTIONS)[number];

export const SCOUT_CONFIDENCE = ["high", "low"] as const;
export type ScoutConfidence = (typeof SCOUT_CONFIDENCE)[number];

export const SCOUT_FINDING_STATUSES = [
  "open",
  "dismissed",
  "accepted_draft",
  "flagged",
] as const;
export type ScoutFindingStatus = (typeof SCOUT_FINDING_STATUSES)[number];

export type ScoutProposed = {
  title?: string;
  detail?: string;
  references?: string[];
  appliesTo?: Typology[];
  newItem?: ChecklistItem;
};

export type ScoutSnapshot = {
  sourceId: string;
  title: string;
  url: string;
  scope: "statewide" | "local";
  ok: boolean;
  httpStatus: number | null;
  sha256: string | null;
  excerpt: string;
  error: string | null;
  fetchedAt: string;
};

export type ScoutFinding = {
  id: string;
  sourceId: string;
  sourceTitle: string;
  url: string;
  scope: ScoutScope;
  action: ScoutAction;
  itemIds: string[];
  flag: string;
  proposed: ScoutProposed | null;
  confidence: ScoutConfidence;
  status: ScoutFindingStatus;
  hashChanged: boolean;
  baseline: boolean;
};

export type ScoutReport = {
  format: typeof SCOUT_REPORT_FORMAT;
  formatVersion: typeof SCOUT_FORMAT_VERSION;
  id: string;
  projectId: string;
  kind: "statewide" | "project";
  ranAt: string;
  municipality: string;
  localConfigured: boolean;
  typology: Typology;
  snapshots: ScoutSnapshot[];
  findings: ScoutFinding[];
};

export function scoutIsDue(
  ranAt: string | null,
  cadenceDays = 7,
  now = Date.now(),
): boolean {
  if (!ranAt) {
    return true;
  }
  const days = Number.isFinite(cadenceDays) && cadenceDays > 0 ? cadenceDays : 7;
  return now - Date.parse(ranAt) >= days * 24 * 60 * 60 * 1000;
}

export function actionLabel(action: ScoutAction): string {
  switch (action) {
    case "add":
      return "Add";
    case "replace":
      return "Replace wording";
    case "split":
      return "Split item";
    case "supersede":
      return "Supersede";
    case "no_change":
      return "No change";
    case "needs_human":
      return "Needs you";
    default:
      return assertNever(action, `Unknown scout action: ${String(action)}`);
  }
}

export function findingStatusLabel(status: ScoutFindingStatus): string {
  switch (status) {
    case "open":
      return "Open";
    case "dismissed":
      return "Dismissed";
    case "accepted_draft":
      return "In draft template";
    case "flagged":
      return "Flag only";
    default:
      return assertNever(status, `Unknown finding status: ${String(status)}`);
  }
}

export function openFindingCount(report: ScoutReport | null): number {
  if (!report) {
    return 0;
  }
  return report.findings.filter(
    (finding) =>
      finding.status === "open" && finding.action !== "no_change",
  ).length;
}
