import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  arbvStageHeading,
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
    <ol className="grid gap-6">
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
          <li key={group.stage.id} className="space-y-3">
            <div>
              <h3 className="font-heading text-lg leading-tight">
                {arbvStageHeading(group.stage)}
              </h3>
              <p className="text-sm text-muted-foreground">
                {group.stage.summary}
                {answers
                  ? ` · ${stageProgress.done}/${stageProgress.total}`
                  : ` · ${stageProgress.total} items`}
              </p>
            </div>
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
          </li>
        );
      })}
    </ol>
  );
}
