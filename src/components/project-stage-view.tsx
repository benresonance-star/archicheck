"use client";

import { useEffect, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { StageChecklist } from "@/components/stage-checklist";
import { loadProject, syncProjectImpacts } from "@/lib/client-store";
import { grokbotForStage } from "@/lib/template/vic-residential";
import {
  openImpactCount,
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
        {openImpactCount(project) > 0 ? (
          <p className="text-sm">
            This job has a template impact notice.{" "}
            <a className="underline underline-offset-2" href={`/p/${project.id}`}>
              Review it on the project
            </a>{" "}
            before treating ticks as current.
          </p>
        ) : null}
        <StageChecklist
          project={project}
          template={template}
          stage={stage}
          grokbot={grokbot}
          prevHref={prev ? `/p/${project.id}/s/${prev.id}` : undefined}
          nextHref={next ? `/p/${project.id}/s/${next.id}` : undefined}
          onWorkspace={setData}
        />
      </main>
    </div>
  );
}
