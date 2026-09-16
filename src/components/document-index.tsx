import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { groupedOutputDocuments, type OutputKind } from "@/lib/template/output-lens";
import { progressForItems, type ProjectDocument, type TemplateDocument, type Typology } from "@/lib/types";

export function DocumentIndex({
  template,
  typology,
  hrefForDocument,
  answers,
}: {
  template: TemplateDocument;
  typology: Typology;
  hrefForDocument: (kind: OutputKind) => string;
  answers?: ProjectDocument["answers"];
}) {
  const groups = groupedOutputDocuments(template, typology);

  return (
    <ol className="grid gap-3">
      {groups.map((group) => {
        const progress = answers
          ? progressForItems(group.items, answers)
          : { done: 0, total: group.items.length };
        return (
          <li key={group.kind}>
            <Link href={hrefForDocument(group.kind)} className="block">
              <Card className="transition-colors hover:bg-muted/40">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="font-heading text-xl">
                      {group.title}
                    </CardTitle>
                    <Badge variant="secondary">
                      {answers
                        ? `${progress.done}/${progress.total}`
                        : `${progress.total} items`}
                    </Badge>
                  </div>
                  <CardDescription>{group.summary}</CardDescription>
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
  );
}
