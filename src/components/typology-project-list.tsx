"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listProjects } from "@/lib/client-store";
import type { ProjectSummary, Typology } from "@/lib/types";

export function TypologyProjectList({ typology }: { typology: Typology }) {
  const [projects, setProjects] = useState<ProjectSummary[] | null>(null);

  useEffect(() => {
    void listProjects().then((all) =>
      setProjects(all.filter((project) => project.typology === typology)),
    );
  }, [typology]);

  if (projects === null) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }
  if (projects.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        None yet. Stages below are the Victorian process for this typology — start
        a project to tick them off.
      </p>
    );
  }
  return (
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
                {project.openImpacts
                  ? ` · ${project.openImpacts} impact${project.openImpacts === 1 ? "" : "s"}`
                  : ""}
              </span>
            </span>
            <span className="text-sm">Open</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
