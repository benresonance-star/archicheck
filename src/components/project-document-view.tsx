"use client";

import { useEffect, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { DocumentChecklist } from "@/components/document-checklist";
import { loadProject, syncProjectImpacts } from "@/lib/client-store";
import {
  arbvStageHeading,
  findStagedDocument,
  flattenStagedDocuments,
  groupedOutputDocuments,
  isOutputKind,
  stagedDocumentHeading,
} from "@/lib/template/output-lens";
import {
  openImpactCount,
  type ProjectDocument,
  type TemplateDocument,
} from "@/lib/types";

export function ProjectDocumentView({
  id,
  stageId,
  outputKind,
}: {
  id: string;
  stageId: string;
  outputKind: string;
}) {
  const [data, setData] = useState<{
    project: ProjectDocument;
    template: TemplateDocument;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void syncProjectImpacts(id)
      .then(setData)
      .catch(() => {
        void loadProject(id)
          .then(setData)
          .catch((caught: unknown) => {
            setError(caught instanceof Error ? caught.message : "Not found");
          });
      });
  }, [id]);

  if (error) {
    return (
      <div>
        <AppHeader title="Missing project" backHref="/" />
        <main className="mx-auto max-w-3xl px-4 py-8">{error}</main>
      </div>
    );
  }
  if (!data) {
    return (
      <div>
        <AppHeader backHref={`/p/${id}`} />
        <main className="mx-auto max-w-3xl px-4 py-8 text-muted-foreground">
          Loading…
        </main>
      </div>
    );
  }

  const { project, template } = data;
  if (!isOutputKind(outputKind)) {
    return (
      <div>
        <AppHeader backHref={`/p/${id}`} />
        <main className="mx-auto max-w-3xl px-4 py-8">Unknown document.</main>
      </div>
    );
  }

  const groups = groupedOutputDocuments(template, project.site.typology);
  const flat = flattenStagedDocuments(groups);
  const index = flat.findIndex(
    (entry) => entry.stageId === stageId && entry.kind === outputKind,
  );
  const group = findStagedDocument(groups, stageId, outputKind);
  if (!group || index < 0) {
    return (
      <div>
        <AppHeader backHref={`/p/${id}`} />
        <main className="mx-auto max-w-3xl px-4 py-8">
          This document has no {project.site.typology} checks.
        </main>
      </div>
    );
  }

  const prev = flat[index - 1];
  const next = flat[index + 1];

  return (
    <div className="pb-[env(safe-area-inset-bottom)]">
      <AppHeader
        title={stagedDocumentHeading(group.stage, group.kind)}
        backHref={`/p/${project.id}`}
      />
      <main className="mx-auto max-w-3xl space-y-4 px-4 py-6">
        <p className="text-sm text-muted-foreground">
          {arbvStageHeading(group.stage)}
          {" · "}
          {group.summary}
        </p>
        {openImpactCount(project) > 0 ? (
          <p className="text-sm">
            This job has a template impact notice.{" "}
            <a className="underline underline-offset-2" href={`/p/${project.id}`}>
              Review it on the project
            </a>{" "}
            before treating ticks as current.
          </p>
        ) : null}
        <DocumentChecklist
          project={project}
          template={template}
          items={group.items}
          prevHref={
            prev ? `/p/${project.id}/d/${prev.stageId}/${prev.kind}` : undefined
          }
          nextHref={
            next ? `/p/${project.id}/d/${next.stageId}/${next.kind}` : undefined
          }
        />
      </main>
    </div>
  );
}
