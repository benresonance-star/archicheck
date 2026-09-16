import { AppHeader } from "@/components/app-header";
import { TemplateReference } from "@/components/template-reference";
import { parseTypologyParam } from "@/lib/typology";

export default async function TemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ typology?: string }>;
}) {
  const { typology: raw } = await searchParams;
  const typology = parseTypologyParam(raw ?? "") ?? "house";

  return (
    <div className="pb-[env(safe-area-inset-bottom)]">
      <AppHeader title="Generic templates" backHref="/" />
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-6">
        <section className="space-y-2">
          <h1 className="font-heading text-4xl leading-tight">
            Generic checklist templates
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            House, townhouse and apartment lists from the bundled Victoria
            residential template. Each item cites a Source and helper
            Resource(s) on a sage-green panel. Tick items as a quick reference on
            this device, then start a project when you need notes, attachments
            and a ZIP.
          </p>
        </section>
        <TemplateReference initialTypology={typology} />
      </main>
    </div>
  );
}
