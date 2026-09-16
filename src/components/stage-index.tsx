import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Stage, TemplateDocument, Typology } from "@/lib/types";
import { deliverableKindLabel, itemsForTypology } from "@/lib/types";

export function StageIndex({
  template,
  typology,
  hrefForStage,
  progress,
}: {
  template: TemplateDocument;
  typology: Typology;
  hrefForStage: (stage: Stage) => string;
  progress?: Record<string, { done: number; total: number }>;
}) {
  const items = itemsForTypology(template.items, typology);

  return (
    <ol className="grid gap-3">
      {template.stages.map((stage) => {
        const total = items.filter((item) => item.stageId === stage.id).length;
        const done = progress?.[stage.id]?.done ?? 0;
        return (
          <li key={stage.id}>
            <Link href={hrefForStage(stage)} className="block">
              <Card className="transition-colors hover:bg-muted/40">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="font-heading text-xl">
                      <span className="mr-2 text-muted-foreground">
                        {String(stage.number).padStart(2, "0")}
                      </span>
                      {stage.title}
                    </CardTitle>
                    <Badge variant="secondary">
                      {progress ? `${done}/${total}` : `${total} items`}
                    </Badge>
                  </div>
                  <CardDescription>{stage.summary}</CardDescription>
                </CardHeader>
                <CardContent>
                  {(template.deliverables ?? [])
                    .filter(
                      (deliverable) =>
                        deliverable.stageId === stage.id &&
                        deliverable.appliesTo.includes(typology),
                    )
                    .map((deliverable) => (
                      <p
                        key={deliverable.id}
                        className="text-sm text-muted-foreground"
                      >
                        {deliverableKindLabel(deliverable.kind)}:{" "}
                        {deliverable.title}
                      </p>
                    ))}
                  <p className="mt-2 text-xs uppercase tracking-wide text-muted-foreground">
                    Open this stage
                  </p>
                </CardContent>
              </Card>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
