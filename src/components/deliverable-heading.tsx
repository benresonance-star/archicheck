import { Badge } from "@/components/ui/badge";
import type { StageDeliverable } from "@/lib/types";
import { deliverableKindLabel } from "@/lib/types";

export function DeliverableHeading({
  deliverable,
}: {
  deliverable: StageDeliverable;
}) {
  return (
    <span className="block space-y-1">
      <span className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">{deliverableKindLabel(deliverable.kind)}</Badge>
        <span className="font-medium leading-snug break-words">
          {deliverable.title}
        </span>
      </span>
      <span className="block text-sm leading-relaxed text-muted-foreground break-words">
        {deliverable.summary}
      </span>
    </span>
  );
}
