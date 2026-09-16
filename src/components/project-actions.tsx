"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  deleteProject,
  downloadBytes,
  exportProjectZip,
  loadProject,
  openHtml,
} from "@/lib/client-store";
import { renderSnapshotHtml } from "@/lib/html-snapshot";
import type { ProjectDocument } from "@/lib/types";

export function ProjectActions({ project }: { project: ProjectDocument }) {
  const router = useRouter();

  async function remove() {
    if (!window.confirm("Delete this project from this phone?")) {
      return;
    }
    await deleteProject(project.id);
    router.push(`/t/${project.site.typology}`);
  }

  async function exportZip() {
    try {
      const { filename, bytes } = await exportProjectZip(project.id);
      downloadBytes(filename, bytes, "application/zip");
      toast.success("ZIP downloaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export failed");
    }
  }

  async function snapshot(download: boolean) {
    try {
      const { project: latest, template } = await loadProject(project.id);
      const html = renderSnapshotHtml({ project: latest, template });
      if (download) {
        downloadBytes(
          `${latest.site.name.replace(/[^a-z0-9]+/gi, "-")}-rev${latest.revision}.html`,
          new TextEncoder().encode(html),
          "text/html;charset=utf-8",
        );
      } else {
        openHtml(html);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Snapshot failed");
    }
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <Button className="min-h-11" onClick={() => void exportZip()}>
        Export ZIP
      </Button>
      <Button
        variant="outline"
        className="min-h-11"
        onClick={() => void snapshot(false)}
      >
        HTML snapshot
      </Button>
      <Button
        variant="outline"
        className="min-h-11"
        onClick={() => void snapshot(true)}
      >
        Save HTML
      </Button>
      <Button variant="destructive" className="min-h-11" onClick={() => void remove()}>
        Delete
      </Button>
    </div>
  );
}
