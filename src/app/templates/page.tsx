import { AppHeader } from "@/components/app-header";
import { TemplatesPageBody } from "@/components/templates-page-body";
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
            House, townhouse and apartment lists from the live Victoria
            residential template. Use <strong>Reorder / add</strong> to draft
            checks that populate new projects. Publishing writes a new template
            version; existing jobs get an impact notice and keep their answers
            until they adopt. Use <strong>By document</strong> for the same
            ARBV stages (01 Pre-design through 11 Post-occupancy), with Plans,
            Elevations and the other outputs listed under each stage. Town
            planning drawings stay separate from construction documentation.
            Use <strong>By stage</strong> for the full stage checklist. Open{" "}
            <strong>Apartment</strong> for BADS as separate ticks. Tick items
            as a quick reference on this device, then start a project when you
            need notes, attachments and a ZIP.
          </p>
        </section>
        <TemplatesPageBody initialTypology={typology} />
      </main>
    </div>
  );
}
