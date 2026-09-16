import { notFound } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { NewProjectForm } from "@/components/new-project-form";
import { parseTypologyParam, typologyMeta } from "@/lib/typology";

export default async function NewProjectPage({
  params,
}: {
  params: Promise<{ typology: string }>;
}) {
  const { typology: raw } = await params;
  const typology = parseTypologyParam(raw);
  if (!typology) {
    notFound();
  }
  const meta = typologyMeta(typology);

  return (
    <div className="pb-[env(safe-area-inset-bottom)]">
      <AppHeader title={`New ${meta.title}`} backHref={`/t/${typology}`} />
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-6">
        <p className="text-muted-foreground">{meta.clause}</p>
        <NewProjectForm typology={typology} />
      </main>
    </div>
  );
}
