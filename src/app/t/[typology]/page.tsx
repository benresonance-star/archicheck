import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { TemplateReference } from "@/components/template-reference";
import { TypologyProjectList } from "@/components/typology-project-list";
import { Button } from "@/components/ui/button";
import { BUNDLED_TEMPLATE } from "@/lib/template/vic-residential";
import { itemsForTypology } from "@/lib/types";
import { parseTypologyParam, typologyMeta } from "@/lib/typology";

export default async function TypologyPage({
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
  const itemCount = itemsForTypology(BUNDLED_TEMPLATE.items, typology).length;

  return (
    <div className="pb-[env(safe-area-inset-bottom)]">
      <AppHeader title={meta.title} backHref="/" />
      <main className="mx-auto max-w-3xl space-y-8 px-4 py-6">
        <section className="space-y-2">
          <p className="text-xs uppercase tracking-[0.16em] text-primary">
            {meta.nccClass}
          </p>
          <h1 className="font-heading text-4xl">{meta.title}</h1>
          <p className="text-muted-foreground leading-relaxed">{meta.blurb}</p>
          <p className="text-sm">{meta.clause}</p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {meta.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
          <p className="text-sm">
            {itemCount} checklist items across {BUNDLED_TEMPLATE.stages.length}{" "}
            stages in template {BUNDLED_TEMPLATE.version}.
          </p>
          <Button className="min-h-11 w-full" asChild>
            <Link href={`/t/${typology}/new`}>New {meta.title.toLowerCase()} project</Link>
          </Button>
        </section>
        <section className="space-y-3">
          <h2 className="font-heading text-2xl">Template</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Tick the bundled list as a quick reference. By document uses the
            ARBV stages (01–11) with Plans, Elevations and other outputs under
            each stage. By stage follows the ARBV sequence: each stage lists
            its own checks, then that stage’s drawings and documents. Start a
            project below when you need notes, attachments and a ZIP.
          </p>
          <TemplateReference typology={typology} showStartProject={false} />
        </section>
        <section className="space-y-3">
          <h2 className="font-heading text-2xl">Projects</h2>
          <TypologyProjectList typology={typology} />
        </section>
      </main>
    </div>
  );
}
