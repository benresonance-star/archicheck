import { ProjectDocumentView } from "@/components/project-document-view";

export default async function ProjectDocumentPage({
  params,
}: {
  params: Promise<{ id: string; outputKind: string }>;
}) {
  const { id, outputKind } = await params;
  return <ProjectDocumentView id={id} outputKind={outputKind} />;
}
