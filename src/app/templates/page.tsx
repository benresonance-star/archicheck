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
      <AppHeader title="Templates" backHref="/" />
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-6">
        <section className="space-y-4">
          <h1 className="font-heading text-4xl leading-tight">Templates</h1>
          <div className="space-y-3 text-muted-foreground leading-relaxed">
            <p>
              House, townhouse and apartment lists from the live Victoria
              template. Tick them here as a phone reference. Start a project
              when you need notes, attachments and a ZIP.
            </p>
            <p>
              <strong>Edit checks</strong> drafts items for new projects.
              Publishing a version sends existing jobs an impact notice. They
              keep their answers until they adopt.
            </p>
            <p>
              <strong>By document</strong> groups Plans, Elevations and the
              other outputs under each ARBV stage. Town planning stays separate
              from construction documents.
            </p>
            <p>
              <strong>By stage</strong> follows the ARBV sequence. Each stage
              lists its own checks, then the drawings and documents for that
              stage.
            </p>
          </div>
        </section>
        <TemplatesPageBody initialTypology={typology} />
      </main>
    </div>
  );
}
