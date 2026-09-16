import type { ReactNode } from "react";
import type { Stage } from "@/lib/types";

export function ArbvStageHeader({
  stage,
  badge,
}: {
  stage: Stage;
  badge?: ReactNode;
}) {
  return (
    <span className="flex min-w-0 flex-1 items-start gap-3 pr-2">
      <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-heading text-primary-foreground">
        {String(stage.number).padStart(2, "0")}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[0.65rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          ARBV stage
        </span>
        <span className="block font-heading text-lg leading-tight">
          {stage.title}
        </span>
        <span className="block text-sm font-normal text-muted-foreground">
          {stage.summary}
        </span>
      </span>
      {badge}
    </span>
  );
}
