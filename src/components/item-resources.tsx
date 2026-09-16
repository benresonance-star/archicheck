import type { ChecklistResource } from "@/lib/types";

export function ItemResources({
  resources,
}: {
  resources: ChecklistResource[] | undefined;
}) {
  if (!resources || resources.length === 0) {
    return null;
  }
  const label = resources.length === 1 ? "Resource" : "Resources";
  return (
    <div className="rounded-lg border border-resource-border bg-resource px-3 py-2 text-resource-foreground">
      <p className="text-xs font-medium leading-relaxed">
        {label}
      </p>
      <ul className="mt-1 space-y-1">
        {resources.map((resource, index) => (
          <li key={`${resource.url}-${index}`}>
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-resource-accent underline underline-offset-2"
            >
              {resource.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
