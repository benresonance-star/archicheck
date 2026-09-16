import { ProjectStageView } from "@/components/project-stage-view";

export default async function ProjectStagePage({
  params,
}: {
  params: Promise<{ id: string; stageId: string }>;
}) {
  const { id, stageId } = await params;
  return <ProjectStageView id={id} stageId={stageId} />;
}
