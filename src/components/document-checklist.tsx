"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { editListClass } from "@/components/checklist-edit-toggle";
import { cn } from "@/lib/utils";
import { ProjectCheckList } from "@/components/checklist-item-card";
import {
  arbvStageHeading,
  itemsGroupedByStage,
  outputKindForItem,
  type OutputKind,
} from "@/lib/template/output-lens";
import {
  itemsForTypology,
  type ProjectDocument,
  type TemplateDocument,
} from "@/lib/types";

export function DocumentChecklist({
  project,
  template,
  stageId,
  outputKind,
  prevHref,
  nextHref,
  editing = false,
  onWorkspace,
}: {
  project: ProjectDocument;
  template: TemplateDocument;
  stageId: string;
  outputKind: OutputKind;
  prevHref?: string;
  nextHref?: string;
  editing?: boolean;
  onWorkspace?: (next: {
    project: ProjectDocument;
    template: TemplateDocument;
  }) => void;
}) {
  const router = useRouter();
  const [workspace, setWorkspace] = useState({ project, template });
  const items = itemsForTypology(
    workspace.template.items,
    workspace.project.site.typology,
  ).filter(
    (item) =>
      item.stageId === stageId && outputKindForItem(item) === outputKind,
  );
  const grouped = itemsGroupedByStage(workspace.template, items);

  function apply(next: { project: ProjectDocument; template: TemplateDocument }) {
    setWorkspace(next);
    onWorkspace?.(next);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {prevHref ? (
          <Button variant="outline" className="min-h-11" asChild>
            <a href={prevHref}>Previous document</a>
          </Button>
        ) : null}
        {nextHref ? (
          <Button variant="outline" className="min-h-11" asChild>
            <a href={nextHref}>Next document</a>
          </Button>
        ) : null}
      </div>
      {grouped.length === 0 ? (
        <div
          className={cn(
            "space-y-3 rounded-2xl border p-3",
            editListClass(editing),
          )}
        >
          <ProjectCheckList
            items={[]}
            project={workspace.project}
            template={workspace.template}
            section={{ stageId, outputKind }}
            editing={editing}
            onWorkspace={apply}
          />
        </div>
      ) : (
        grouped.map((group) => (
          <div
            key={group.stage.id}
            className={cn(
              "space-y-3 rounded-2xl border p-3",
              editListClass(editing),
            )}
          >
            <h2 className="font-heading text-lg leading-tight">
              {arbvStageHeading(group.stage)}
            </h2>
            <ProjectCheckList
              items={group.items}
              project={workspace.project}
              template={workspace.template}
              section={{ stageId: group.stage.id, outputKind }}
              editing={editing}
              onWorkspace={apply}
            />
          </div>
        ))
      )}
    </div>
  );
}
