export function SourceCitations({
  references,
}: {
  references: string[];
}) {
  if (references.length === 0) {
    return null;
  }
  const label = references.length === 1 ? "Source" : "Sources";
  return (
    <p className="text-xs leading-relaxed text-muted-foreground">
      <span className="font-medium text-foreground">{label}: </span>
      {references.join(" · ")}
    </p>
  );
}
