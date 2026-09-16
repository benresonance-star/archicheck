"use client";

import { useEffect, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { StageChecklist } from "@/components/stage-checklist";
import { loadProject } from "@/lib/client-store";
import { grokbotForStage } from "@/lib/template/vic-residential";
import {
  itemsForTypology,
  type ProjectDocument,
  type TemplateDocument,
} from "@/lib/types";

export function ProjectStageView({
  id,
  stageId,
}: {
  id: string;
  stageId: string;
}) {
  const [data, setData] = useState<{
    project: ProjectDocument;
    template: TemplateDocument;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadProject(id)
      .then(setData)
      .catch((caught: unknown) => {
        setError(caught instanceof Error ? caught.message : "Not found");
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
  const stageIndex = template.stages.findIndex((entry) => entry.id === stageId);
  const stage = template.stages[stageIndex];
  if (!stage) {
    return (
      <div>
        <AppHeader backHref={`/p/${id}`} />
        <main className="mx-auto max-w-3xl px-4 py-8">Unknown stage.</main>
      </div>
    );
  }
  const items = itemsForTypology(template.items, project.site.typology).filter(
    (item) => item.stageId === stage.id,
  );
  const prev = template.stages[stageIndex - 1];
  const next = template.stages[stageIndex + 1];
  const grokbot = grokbotForStage(template, stage.id);

  return (
    <div className="pb-[env(safe-area-inset-bottom)]">
      <AppHeader
        title={`${String(stage.number).padStart(2, "0")} ${stage.title}`}
        backHref={`/p/${project.id}`}
      />
      <main className="mx-auto max-w-3xl space-y-4 px-4 py-6">
        <p className="text-sm text-muted-foreground">{stage.summary}</p>
        <StageChecklist
          project={project}
          template={template}
          stage={stage}
          items={items}
          grokbot={grokbot}
          prevHref={prev ? `/p/${project.id}/s/${prev.id}` : undefined}
          nextHref={next ? `/p/${project.id}/s/${next.id}` : undefined}
        />
      </main>
    </div>
  );
}
