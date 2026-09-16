"use client";

import { useEffect, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { ImpactNoticeCard } from "@/components/impact-notice";
import { ProjectActions } from "@/components/project-actions";
import { ProjectPlanningControls } from "@/components/project-planning-controls";
import { ScoutBanner } from "@/components/scout-banner";
import { StageIndex } from "@/components/stage-index";
import { loadProject, syncProjectImpacts } from "@/lib/client-store";
import {
  itemsForTypology,
  openImpactCount,
  type ProjectDocument,
  type TemplateDocument,
} from "@/lib/types";
import { typologyMeta } from "@/lib/typology";

export function ProjectWorkspace({ id }: { id: string }) {
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
        <main className="mx-auto max-w-3xl px-4 py-8">
          <p>{error}. Import the ZIP on this phone if it lives elsewhere.</p>
        </main>
      </div>
    );
  }
  if (!data) {
    return (
      <div>
        <AppHeader backHref="/" />
        <main className="mx-auto max-w-3xl px-4 py-8 text-muted-foreground">
          Loading…
        </main>
      </div>
    );
  }

  const { project, template } = data;
  const meta = typologyMeta(project.site.typology);
  const applicable = itemsForTypology(template.items, project.site.typology);
  const progress = Object.fromEntries(
    template.stages.map((stage) => {
      const stageItems = applicable.filter((item) => item.stageId === stage.id);
      const done = stageItems.filter((item) => {
        const answer = project.answers[item.id];
        return answer?.status === "done" || answer?.status === "not_applicable";
      }).length;
      return [stage.id, { done, total: stageItems.length }];
    }),
  );

  return (
    <div className="pb-[env(safe-area-inset-bottom)]">
      <AppHeader title={project.site.name} backHref={`/t/${project.site.typology}`} />
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-6">
        <section className="space-y-2">
          <p className="text-xs uppercase tracking-[0.16em] text-primary">
            {meta.title} · revision {project.revision}
          </p>
          <h1 className="font-heading text-3xl">{project.site.name}</h1>
          <p className="text-sm text-muted-foreground">
            {project.site.address || "No address"} · {meta.clause}
          </p>
          <p className="text-xs text-muted-foreground">
            Template {project.template.id} {project.template.version} · checksum{" "}
            {project.template.checksum.slice(0, 12)}…
          </p>
          <ProjectActions project={project} />
          <ScoutBanner projectId={project.id} />
        </section>
        <ProjectPlanningControls
          project={project}
          onProject={(next) => setData({ project: next, template })}
        />
        {openImpactCount(project) > 0 ? (
          <section className="space-y-3">
            <h2 className="font-heading text-2xl">Template impact</h2>
            {(project.impacts ?? [])
              .filter((notice) => notice.status === "open")
              .map((notice) => (
                <ImpactNoticeCard
                  key={notice.id}
                  projectId={project.id}
                  notice={notice}
                  onProject={setData}
                />
              ))}
          </section>
        ) : null}
        <section className="space-y-3">
          <h2 className="font-heading text-2xl">Stages</h2>
          <StageIndex
            template={template}
            typology={project.site.typology}
            hrefForStage={(stage) => `/p/${project.id}/s/${stage.id}`}
            progress={progress}
          />
        </section>
      </main>
    </div>
  );
}
