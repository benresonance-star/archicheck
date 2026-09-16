import { ScoutPage } from "@/components/scout-page";

export default async function ProjectScoutRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ScoutPage id={id} />;
}
