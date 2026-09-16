import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { StageIndex } from "@/components/stage-index";
import { Button } from "@/components/ui/button";
import { listProjects } from "@/lib/store";
import { BUNDLED_TEMPLATE } from "@/lib/template/vic-residential";
import { itemsForTypology } from "@/lib/types";
import { parseTypologyParam, typologyMeta } from "@/lib/typology";

export const dynamic = "force-dynamic";

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
  const projects = (await listProjects()).filter(
    (project) => project.typology === typology,
  );
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
          <h2 className="font-heading text-2xl">Projects</h2>
          {projects.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              None yet. Stages below are the Victorian process for this
              typology — start a project to tick them off.
            </p>
          ) : (
            <ul className="space-y-2">
              {projects.map((project) => (
                <li key={project.id}>
                  <Link
                    href={`/p/${project.id}`}
                    className="flex min-h-14 items-center justify-between rounded-xl border border-border bg-card px-4"
                  >
                    <span>
                      <span className="block font-medium">{project.name}</span>
                      <span className="text-xs text-muted-foreground">
                        rev {project.revision} · {project.done}/{project.total}
                      </span>
                    </span>
                    <span className="text-sm">Open</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="space-y-3">
          <h2 className="font-heading text-2xl">Stages</h2>
          <StageIndex
            template={BUNDLED_TEMPLATE}
            typology={typology}
            hrefForStage={(stage) => `/t/${typology}/s/${stage.id}`}
          />
        </section>
      </main>
    </div>
  );
}
