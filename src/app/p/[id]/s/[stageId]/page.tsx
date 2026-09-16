import { notFound } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { StageChecklist } from "@/components/stage-checklist";
import { loadProject } from "@/lib/store";
import { grokbotForStage } from "@/lib/template/vic-residential";
import { itemsForTypology } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ProjectStagePage({
  params,
}: {
  params: Promise<{ id: string; stageId: string }>;
}) {
  const { id, stageId } = await params;
  let loaded;
  try {
    loaded = await loadProject(id);
  } catch {
    notFound();
  }
  const { project, template } = loaded;
  const stageIndex = template.stages.findIndex((entry) => entry.id === stageId);
  const stage = template.stages[stageIndex];
  if (!stage) {
    notFound();
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
