import type { ItemAssessment } from "@/lib/types";
import { requirementKindLabel } from "@/lib/types";

export function ItemAssessmentNote({
  assessment,
}: {
  assessment?: ItemAssessment;
}) {
  if (!assessment) {
    return null;
  }
  return (
    <p className="text-xs leading-relaxed text-muted-foreground">
      <span className="font-medium text-foreground">
        {requirementKindLabel(assessment.requirement.kind)}
      </span>
      {" · "}
      {assessment.applicability.elementTypes.join(", ")}
      {assessment.humanReview.required ? " · Needs human review to close" : null}
    </p>
  );
}
