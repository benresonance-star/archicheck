import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { typologyMeta, TYPOLOGY_ORDER } from "@/lib/typology";
import type { Typology } from "@/lib/types";

export function TypologyGrid({
  counts,
}: {
  counts: Record<Typology, number>;
}) {
  return (
    <div className="grid gap-3">
      {TYPOLOGY_ORDER.map((id) => {
        const meta = typologyMeta(id);
        const count = counts[id];
        return (
          <Link key={id} href={`/t/${id}`} className="block">
            <Card className="transition-colors hover:bg-muted/40">
              <CardHeader>
                <CardTitle className="font-heading text-2xl">
                  {meta.title}
                </CardTitle>
                <CardDescription>{meta.clause}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{meta.blurb}</p>
                <p className="mt-3 text-xs uppercase tracking-wide text-muted-foreground">
                  {count} {count === 1 ? "project" : "projects"}
                </p>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
