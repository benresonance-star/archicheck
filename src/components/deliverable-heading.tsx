import { Badge } from "@/components/ui/badge";
import type { StageDeliverable } from "@/lib/types";
import { deliverableKindLabel } from "@/lib/types";

export function DeliverableHeading({
  deliverable,
}: {
  deliverable: StageDeliverable;
}) {
  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">{deliverableKindLabel(deliverable.kind)}</Badge>
        <p className="font-medium leading-snug">{deliverable.title}</p>
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {deliverable.summary}
      </p>
    </div>
  );
}
