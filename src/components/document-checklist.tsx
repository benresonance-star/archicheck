"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChecklistItemCard } from "@/components/checklist-item-card";
import { arbvStageHeading, itemsGroupedByStage } from "@/lib/template/output-lens";
import type {
  ChecklistItem,
  ProjectDocument,
  TemplateDocument,
} from "@/lib/types";

export function DocumentChecklist({
  project,
  template,
  items,
  prevHref,
  nextHref,
}: {
  project: ProjectDocument;
  template: TemplateDocument;
  items: ChecklistItem[];
  prevHref?: string;
  nextHref?: string;
}) {
  const router = useRouter();
  const [local, setLocal] = useState(project);
  const grouped = itemsGroupedByStage(template, items);

  function onProject(next: ProjectDocument) {
    setLocal(next);
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
      {items.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No items for this typology</CardTitle>
            <CardDescription>
              This document has no {local.site.typology} items in template{" "}
              {template.version}.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        grouped.map((group) => (
          <div key={group.stage.id} className="space-y-3">
            <h2 className="font-heading text-lg leading-tight">
              {arbvStageHeading(group.stage)}
            </h2>
            {group.items.map((item) => (
              <ChecklistItemCard
                key={item.id}
                item={item}
                project={local}
                onProject={onProject}
              />
            ))}
          </div>
        ))
      )}
    </div>
  );
}
