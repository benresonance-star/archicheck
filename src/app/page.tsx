import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { TypologyGrid } from "@/components/typology-grid";
import { listProjects } from "@/lib/store";
import { TYPOLOGY_ORDER } from "@/lib/typology";
import type { Typology } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const projects = await listProjects();
  const counts = Object.fromEntries(
    TYPOLOGY_ORDER.map((id) => [
      id,
      projects.filter((project) => project.typology === id).length,
    ]),
  ) as Record<Typology, number>;

  return (
    <div className="pb-[env(safe-area-inset-bottom)]">
      <AppHeader />
      <main className="mx-auto max-w-3xl space-y-8 px-4 py-6">
        <section className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">
            Victoria · Australia
          </p>
          <h1 className="font-heading text-4xl leading-tight">
            Design-stage checklist for houses, townhouses and apartments
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            Pre-design through post-occupancy, aligned to ARBV stages, Clauses 54,
            55 and 58, and NCC 2022. Storage is JSON. The ZIP is the lossless
            archive. Light and dark modes follow the system, or pick one.
          </p>
        </section>
        <TypologyGrid counts={counts} />
        <section className="space-y-3">
          <h2 className="font-heading text-2xl">Recent projects</h2>
          {projects.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No projects on this installation yet. Open a typology or import a
              ZIP from another phone or studio.
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
                        {project.typology} · rev {project.revision} ·{" "}
                        {project.done}/{project.total}
                      </span>
                    </span>
                    <span className="text-sm text-muted-foreground">Open</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <p className="text-sm text-muted-foreground">
          <Link href="/schema" className="underline underline-offset-2">
            JSON Schema
          </Link>
          {" · "}
          <a
            className="underline underline-offset-2"
            href="/schema/vic-arch-checklist.schema.json"
          >
            schema file
          </a>
        </p>
      </main>
    </div>
  );
}
