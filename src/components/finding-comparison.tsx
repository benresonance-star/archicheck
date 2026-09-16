import type { TemplateItemChange } from "@/lib/types";
import { wordingChanged } from "@/lib/template/publish";

export function FindingComparison({
  rows,
}: {
  rows: TemplateItemChange[];
}) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No matching checklist items in the current template.
      </p>
    );
  }
  return (
    <ul className="space-y-3">
      {rows.map((row) => (
        <li
          key={row.itemId}
          className="rounded-lg border border-border bg-muted/60 px-3 py-2"
        >
          <p className="text-sm font-medium">{row.title}</p>
          {wordingChanged(row) ? (
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Current
                </p>
                <p className="text-sm whitespace-pre-wrap">
                  {row.beforeDetail || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Proposed
                </p>
                <p className="text-sm whitespace-pre-wrap">{row.afterDetail}</p>
              </div>
            </div>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">
              Proposed wording matches the current item.
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
