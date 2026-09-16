"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { StatewideNoticeboard } from "@/components/statewide-noticeboard";
import { TypologyGrid } from "@/components/typology-grid";
import { listProjects } from "@/lib/client-store";
import { TYPOLOGY_ORDER } from "@/lib/typology";
import type { ProjectSummary, Typology } from "@/lib/types";

export function HomeBody() {
  const [projects, setProjects] = useState<ProjectSummary[] | null>(null);

  useEffect(() => {
    void listProjects().then(setProjects);
  }, []);

  const counts = Object.fromEntries(
    TYPOLOGY_ORDER.map((id) => [
      id,
      (projects ?? []).filter((project) => project.typology === id).length,
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
            Pre-design through post-occupancy. Projects stay on this device as
            JSON (IndexedDB). Export a ZIP to move them — that archive is the
            lossless copy. Light and dark modes are in the header.
          </p>
        </section>
        <StatewideNoticeboard compact collapsible />
        <TypologyGrid counts={counts} />
        <section className="space-y-3">
          <h2 className="font-heading text-2xl">Recent projects</h2>
          {projects === null ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : projects.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              None on this phone yet. Open a typology or import a ZIP.
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
        </p>
      </main>
    </div>
  );
}
