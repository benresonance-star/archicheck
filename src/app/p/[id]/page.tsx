import { notFound } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { ProjectActions } from "@/components/project-actions";
import { StageIndex } from "@/components/stage-index";
import { loadProject } from "@/lib/store";
import { itemsForTypology } from "@/lib/types";
import { typologyMeta } from "@/lib/typology";

export const dynamic = "force-dynamic";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let loaded;
  try {
    loaded = await loadProject(id);
  } catch {
    notFound();
  }
  const { project, template } = loaded;
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
        </section>
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
