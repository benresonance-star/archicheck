import { applyProposedToTemplate } from "@/lib/scout/apply-wording";
import type { ScoutFinding, ScoutProposed } from "@/lib/scout/types";
import type {
  Answer,
  ImpactNotice,
  ItemStatus,
  ProjectDocument,
  TemplateDocument,
  TemplateItemChange,
  TemplateRelease,
} from "@/lib/types";
import { itemsForTypology } from "@/lib/types";

export function bumpPatchVersion(version: string): string {
  const base = version.replace(/-draft\.\d+$/, "");
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
    return [
      {
        itemId: item.id,
        title: item.title,
        beforeTitle: "",
        afterTitle: item.title,
        beforeDetail: "",
        afterDetail: proposed.detail ?? item.detail,
        beforeReferences: [],
        afterReferences: proposed.references ?? item.references,
      },
    ];
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
  const fromVersion = input.template.version.replace(/-draft\.\d+$/, "");
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
  const nextTemplate = structuredClone(input.template);
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
    let item = nextTemplate.items.find((entry) => entry.id === change.itemId);
    if (!item) {
      const published = input.publishedTemplate.items.find(
        (entry) => entry.id === change.itemId,
      );
      if (!published) {
        throw new Error(`Checklist item ${change.itemId} is not in the published template`);
      }
      item = structuredClone(published);
      nextTemplate.items.push(item);
    }
    item.title = change.afterTitle;
    item.detail = change.afterDetail;
    item.references = [...change.afterReferences];
    nextProject.answers[change.itemId] = nextAnswer(
      nextProject.answers[change.itemId],
      input.now,
    );
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
