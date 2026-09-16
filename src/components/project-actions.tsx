"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { ProjectDocument } from "@/lib/types";

export function ProjectActions({ project }: { project: ProjectDocument }) {
  const router = useRouter();

  async function remove() {
    if (!window.confirm("Delete this project from this installation?")) {
      return;
    }
    const response = await fetch(`/api/projects/${project.id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      toast.error("Could not delete");
      return;
    }
    router.push(`/t/${project.site.typology}`);
    router.refresh();
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <Button className="min-h-11" asChild>
        <a href={`/api/projects/${project.id}/export`}>Export ZIP</a>
      </Button>
      <Button variant="outline" className="min-h-11" asChild>
        <a href={`/p/${project.id}/snapshot`}>HTML snapshot</a>
      </Button>
      <Button variant="outline" className="min-h-11" asChild>
        <a href={`/api/projects/${project.id}/snapshot?download=1`}>
          Save HTML
        </a>
      </Button>
      <Button variant="destructive" className="min-h-11" onClick={() => void remove()}>
        Delete
      </Button>
    </div>
  );
}
