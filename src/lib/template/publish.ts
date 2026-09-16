import { applyProposedToTemplate } from "@/lib/scout/apply-wording";
import type { ScoutFinding, ScoutProposed } from "@/lib/scout/types";
import {
  applyItemChangeToTemplate,
  changeFromAddedItem,
  changeNeedsRecheck,
} from "@/lib/template/checklist-crud";
import type {
  Answer,
  ImpactNotice,
  ItemStatus,
  ProjectDocument,
  TemplateDocument,
  TemplateItemChange,
  TemplateRelease,
} from "@/lib/types";
import { changeKind, itemsForTypology } from "@/lib/types";

export function bumpPatchVersion(version: string): string {
  const base = version.replace(/-draft\.\d+$/, "").replace(/-job\.\d+$/, "");
  const match = base.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) {
    return `${base}.1`;
  }
  return `${match[1]}.${match[2]}.${Number(match[3]) + 1}`;
}

export function comparisonRows(
  template: TemplateDocument,
  finding: ScoutFinding,
  proposed: ScoutProposed,
): TemplateItemChange[] {
  if (finding.action === "add" && proposed.newItem) {
    const item = proposed.newItem;
    return [changeFromAddedItem(item, template.items.length)];
  }

  const rows: TemplateItemChange[] = [];
  for (const itemId of finding.itemIds) {
    const item = template.items.find((entry) => entry.id === itemId);
    if (!item) {
      continue;
    }
    rows.push({
      itemId: item.id,
      title: item.title,
      kind: "wording",
      beforeTitle: item.title,
      afterTitle: proposed.title ?? item.title,
      beforeDetail: item.detail,
      afterDetail: proposed.detail ?? item.detail,
      beforeReferences: item.references,
      afterReferences: proposed.references ?? item.references,
    });
  }
  return rows;
}

export function comparisonHasVisibleDelta(rows: TemplateItemChange[]): boolean {
  return rows.some((row) => {
    const kind = changeKind(row);
    if (kind === "wording" || kind === "edit") {
      return wordingChanged(row);
    }
    return kind === "add" || kind === "remove" || kind === "move";
  });
}

export function publishFindingToTemplate(input: {
  template: TemplateDocument;
  finding: ScoutFinding;
  proposed: ScoutProposed;
  publishedAt: string;
  releaseId: string;
}): { template: TemplateDocument; release: TemplateRelease } {
  const proposed = input.proposed;
  if (!proposed.detail && !proposed.title && !proposed.newItem) {
    throw new Error("No proposed wording to publish");
  }
  const changes = comparisonRows(input.template, input.finding, proposed);
  if (changes.length === 0) {
    throw new Error("No checklist items to publish");
  }
  const fromVersion = input.template.version
    .replace(/-draft\.\d+$/, "")
    .replace(/-job\.\d+$/, "");
  const next = applyProposedToTemplate(
    input.template,
    input.finding,
    proposed,
  );
  next.version = bumpPatchVersion(fromVersion);
  return {
    template: next,
    release: {
      id: input.releaseId,
      findingId: input.finding.id,
      sourceTitle: input.finding.sourceTitle,
      sourceUrl: input.finding.url,
      fromVersion,
      toVersion: next.version,
      publishedAt: input.publishedAt,
      changes,
    },
  };
}

export function publishEditsToTemplate(input: {
  template: TemplateDocument;
  nextTemplate: TemplateDocument;
  changes: TemplateItemChange[];
  sourceTitle: string;
  sourceUrl: string;
  publishedAt: string;
  releaseId: string;
  findingId: string;
}): { template: TemplateDocument; release: TemplateRelease } {
  if (input.changes.length === 0) {
    throw new Error("No checklist changes to publish");
  }
  const fromVersion = input.template.version
    .replace(/-draft\.\d+$/, "")
    .replace(/-job\.\d+$/, "");
  const next = structuredClone(input.nextTemplate);
  next.stages = structuredClone(input.template.stages);
  next.deliverables = structuredClone(input.template.deliverables);
  next.grokbots = structuredClone(input.template.grokbots);
  next.id = input.template.id;
  next.format = input.template.format;
  next.formatVersion = input.template.formatVersion;
  next.title = input.template.title;
  next.jurisdiction = input.template.jurisdiction;
  next.description = input.template.description;
  if (next.items.length === 0) {
    throw new Error("A template must keep at least one check");
  }
  next.version = bumpPatchVersion(fromVersion);
  return {
    template: next,
    release: {
      id: input.releaseId,
      findingId: input.findingId,
      sourceTitle: input.sourceTitle,
      sourceUrl: input.sourceUrl,
      fromVersion,
      toVersion: next.version,
      publishedAt: input.publishedAt,
      changes: input.changes,
    },
  };
}

export function noticeFromRelease(input: {
  release: TemplateRelease;
  project: ProjectDocument;
  template: TemplateDocument;
  noticeId: string;
}): ImpactNotice | null {
  if ((input.project.impacts ?? []).some((row) => row.releaseId === input.release.id)) {
    return null;
  }
  const applicable = new Set(
    itemsForTypology(input.template.items, input.project.site.typology).map(
      (item) => item.id,
    ),
  );
  const changes = input.release.changes.filter((change) => {
    const kind = changeKind(change);
    if (kind === "add") {
      const applies = change.afterAppliesTo;
      if (applies && applies.length > 0) {
        return applies.includes(input.project.site.typology);
      }
      return true;
    }
    if (applicable.has(change.itemId)) {
      return true;
    }
    return !input.template.items.some((item) => item.id === change.itemId);
  });
  if (changes.length === 0) {
    return null;
  }
  return {
    id: input.noticeId,
    releaseId: input.release.id,
    findingId: input.release.findingId,
    sourceTitle: input.release.sourceTitle,
    sourceUrl: input.release.sourceUrl,
    fromVersion: input.release.fromVersion,
    toVersion: input.release.toVersion,
    publishedAt: input.release.publishedAt,
    status: "open",
    changes: changes.map((change) => ({ ...change, adopted: false })),
  };
}

function nextAnswer(
  existing: Answer | undefined,
  now: string,
): Answer {
  const previousStatus: ItemStatus | undefined =
    existing && existing.status !== "needs_recheck"
      ? existing.status
      : existing?.previousStatus;
  return {
    status: "needs_recheck",
    notes: existing?.notes ?? "",
    updatedAt: now,
    fields: existing?.fields ?? {},
    previousStatus,
  };
}

export function adoptSelected(input: {
  project: ProjectDocument;
  template: TemplateDocument;
  publishedTemplate: TemplateDocument;
  notice: ImpactNotice;
  selectedItemIds: string[];
  now: string;
}): { project: ProjectDocument; template: TemplateDocument } {
  const selected = new Set(input.selectedItemIds);
  let nextTemplate = structuredClone(input.template);
  const nextProject = structuredClone(input.project);
  const notice = (nextProject.impacts ?? []).find(
    (row) => row.id === input.notice.id,
  );
  if (!notice || notice.status !== "open") {
    throw new Error("Impact notice is not open on this project");
  }

  for (const change of notice.changes) {
    const take = selected.has(change.itemId);
    change.adopted = take;
    if (!take) {
      continue;
    }
    nextTemplate = applyItemChangeToTemplate(
      nextTemplate,
      change,
      input.publishedTemplate,
    );
    if (changeNeedsRecheck(change)) {
      nextProject.answers[change.itemId] = nextAnswer(
        nextProject.answers[change.itemId],
        input.now,
      );
    }
  }

  notice.status = "adopted";
  nextProject.template = {
    id: nextTemplate.id,
    version: notice.toVersion,
    checksum: nextTemplate.checksum,
  };
  return { project: nextProject, template: nextTemplate };
}

export function dismissNotice(
  project: ProjectDocument,
  noticeId: string,
): ProjectDocument {
  const next = structuredClone(project);
  const notice = (next.impacts ?? []).find((row) => row.id === noticeId);
  if (!notice || notice.status !== "open") {
    throw new Error("Impact notice is not open on this project");
  }
  notice.status = "dismissed";
  return next;
}

export function wordingChanged(change: TemplateItemChange): boolean {
  return (
    change.beforeTitle !== change.afterTitle ||
    change.beforeDetail !== change.afterDetail ||
    change.beforeReferences.join("\n") !== change.afterReferences.join("\n")
  );
}
