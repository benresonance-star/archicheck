import { Badge } from "@/components/ui/badge";
import type { StageDeliverable } from "@/lib/types";
import { deliverableKindLabel } from "@/lib/types";

function SectionHeading({
  kind,
  title,
  summary,
}: {
  kind: string;
  title: string;
  summary: string;
}) {
  return (
    <span className="block space-y-1">
      <span className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">{kind}</Badge>
        <span className="font-medium leading-snug break-words">{title}</span>
      </span>
      <span className="block text-sm leading-relaxed text-muted-foreground break-words">
        {summary}
      </span>
    </span>
  );
}

export function DeliverableHeading({
  deliverable,
}: {
  deliverable: StageDeliverable;
}) {
  return (
    <SectionHeading
      kind={deliverableKindLabel(deliverable.kind)}
      title={deliverable.title}
      summary={deliverable.summary}
    />
  );
}

export function StageChecksHeading() {
  return (
    <SectionHeading
      kind="Stage"
      title="Stage checks"
      summary="Agreement, consultant and compliance checks for this ARBV stage — not tied to one drawing or document."
    />
  );
}
