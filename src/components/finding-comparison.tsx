import type { TemplateChangeKind, TemplateItemChange } from "@/lib/types";
import {
  assertNever,
  changeKind,
  templateChangeKindLabel,
} from "@/lib/types";
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
      {rows.map((row) => {
        const kind = changeKind(row);
        return (
          <li
            key={`${kind}-${row.itemId}-${row.afterIndex ?? ""}`}
            className="rounded-lg border border-border bg-muted/60 px-3 py-2"
          >
            <p className="text-sm font-medium">
              {templateChangeKindLabel(kind)} · {row.title || row.afterTitle || row.beforeTitle}
            </p>
            {renderChangeBody(row, kind)}
          </li>
        );
      })}
    </ul>
  );
}

function renderChangeBody(row: TemplateItemChange, kind: TemplateChangeKind) {
  switch (kind) {
    case "add":
      return (
        <p className="mt-1 text-sm whitespace-pre-wrap">
          {row.afterDetail || "New check."}
        </p>
      );
    case "remove":
      return (
        <p className="mt-1 text-sm text-muted-foreground">
          Remove from the live template. Job answers stay in each ZIP.
        </p>
      );
    case "move":
      return (
        <p className="mt-1 text-sm text-muted-foreground">
          Move from position {(row.beforeIndex ?? 0) + 1} to{" "}
          {(row.afterIndex ?? 0) + 1}.
        </p>
      );
    case "wording":
    case "edit":
      return wordingChanged(row) || kind === "edit" ? (
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Current</p>
            <p className="text-sm whitespace-pre-wrap">
              {row.beforeDetail || row.beforeTitle || "—"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              Proposed
            </p>
            <p className="text-sm whitespace-pre-wrap">
              {row.afterDetail || row.afterTitle || "—"}
            </p>
          </div>
        </div>
      ) : (
        <p className="mt-1 text-sm text-muted-foreground">
          Proposed wording matches the current item.
        </p>
      );
    default:
      return assertNever(kind, `Unknown template change: ${String(kind)}`);
  }
}
