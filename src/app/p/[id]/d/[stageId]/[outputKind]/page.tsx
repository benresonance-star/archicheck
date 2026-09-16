import { ProjectDocumentView } from "@/components/project-document-view";

export default async function ProjectDocumentPage({
  params,
}: {
  params: Promise<{ id: string; stageId: string; outputKind: string }>;
}) {
  const { id, stageId, outputKind } = await params;
  return (
    <ProjectDocumentView id={id} stageId={stageId} outputKind={outputKind} />
  );
}
