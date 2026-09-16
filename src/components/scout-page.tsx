"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { ScoutInbox } from "@/components/scout-inbox";
import { loadProject, loadScoutReport } from "@/lib/client-store";
import { openFindingCount, scoutIsDue, type ScoutReport } from "@/lib/scout/types";
import type { ProjectDocument, TemplateDocument } from "@/lib/types";

export function ScoutPage({ id }: { id: string }) {
  const [data, setData] = useState<{
    project: ProjectDocument;
    template: TemplateDocument;
  } | null>(null);
  const [report, setReport] = useState<ScoutReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const loaded = await loadProject(id);
        setData(loaded);
        setReport(await loadScoutReport(id));
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Not found");
      }
    })();
  }, [id]);

  if (error) {
    return (
      <div>
        <AppHeader title="Scout" backHref="/" />
        <main className="mx-auto max-w-3xl px-4 py-8">{error}</main>
      </div>
    );
  }
  if (!data) {
    return (
      <div>
        <AppHeader backHref={`/p/${id}`} />
        <main className="mx-auto max-w-3xl px-4 py-8 text-muted-foreground">
          Loading…
        </main>
      </div>
    );
  }

  const due = scoutIsDue(report?.ranAt ?? null);
  const open = openFindingCount(report);

  return (
    <div className="pb-[env(safe-area-inset-bottom)]">
      <AppHeader title="Scout" backHref={`/p/${id}`} />
      <main className="mx-auto max-w-3xl space-y-4 px-4 py-6">
        <p className="text-xs uppercase tracking-[0.16em] text-primary">
          {data.project.site.typology}
          {due ? " · weekly run due" : ""}
          {open ? ` · ${open} open` : ""}
        </p>
        <h1 className="font-heading text-3xl">Code scout</h1>
        <p className="text-sm text-muted-foreground">
          Watches statewide Victorian / NCC / ARBV / AIA / builders sources
          (editable on the home noticeboard) plus this project’s municipality.
          Proposed sentences are drafts until you accept them.{" "}
          <Link className="underline underline-offset-2" href="/scout">
            Scout process
          </Link>
        </p>
        <ScoutInbox
          projectId={id}
          template={data.template}
          municipality={data.project.site.municipality}
          report={report}
          onMunicipality={(municipality) =>
            setData({
              ...data,
              project: {
                ...data.project,
                site: { ...data.project.site, municipality },
              },
            })
          }
          onReport={setReport}
        />
      </main>
    </div>
  );
}
