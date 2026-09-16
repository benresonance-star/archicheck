import Link from "next/link";
import { ArbvStageHeader } from "@/components/arbv-stage-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  groupedOutputDocuments,
  type OutputKind,
} from "@/lib/template/output-lens";
import {
  progressForItems,
  type ProjectDocument,
  type TemplateDocument,
  type Typology,
} from "@/lib/types";

export function DocumentIndex({
  template,
  typology,
  hrefForDocument,
  answers,
}: {
  template: TemplateDocument;
  typology: Typology;
  hrefForDocument: (stageId: string, kind: OutputKind) => string;
  answers?: ProjectDocument["answers"];
}) {
  const groups = groupedOutputDocuments(template, typology);

  return (
    <ol className="grid gap-4">
      {groups.map((group) => {
        const stageProgress = answers
          ? progressForItems(
              group.documents.flatMap((document) => document.items),
              answers,
            )
          : {
              done: 0,
              total: group.documents.reduce(
                (sum, document) => sum + document.items.length,
                0,
              ),
            };
        return (
          <li
            key={group.stage.id}
            className="rounded-2xl border border-border bg-card"
          >
            <div className="flex items-start justify-between gap-3 border-b border-border bg-muted/70 px-3 py-3">
              <ArbvStageHeader
                stage={group.stage}
                badge={
                  <Badge variant="secondary" className="shrink-0">
                    {answers
                      ? `${stageProgress.done}/${stageProgress.total}`
                      : `${stageProgress.total}`}
                  </Badge>
                }
              />
            </div>
            <div className="space-y-3 p-3">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Documents in this stage
              </p>
              <ol className="grid gap-3">
                {group.documents.map((document) => {
                  const progress = answers
                    ? progressForItems(document.items, answers)
                    : { done: 0, total: document.items.length };
                  return (
                    <li key={`${group.stage.id}-${document.kind}`}>
                      <Link
                        href={hrefForDocument(group.stage.id, document.kind)}
                        className="block"
                      >
                        <Card className="transition-colors hover:bg-muted/40">
                          <CardHeader>
                            <div className="flex items-start justify-between gap-3">
                              <CardTitle className="font-heading text-xl">
                                {document.title}
                              </CardTitle>
                              <Badge variant="secondary">
                                {answers
                                  ? `${progress.done}/${progress.total}`
                                  : `${progress.total} items`}
                              </Badge>
                            </div>
                            <CardDescription>{document.summary}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">
                              Open this document
                            </p>
                          </CardContent>
                        </Card>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
