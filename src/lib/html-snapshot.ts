import type {
  ChecklistItem,
  ProjectDocument,
  TemplateDocument,
} from "@/lib/types";
import {
  itemsForTypology,
  statusLabel,
  typologyLabel,
} from "@/lib/types";
import { typologyMeta } from "@/lib/typology";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatWhen(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-AU", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Australia/Melbourne",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function renderSnapshotHtml(input: {
  project: ProjectDocument;
  template: TemplateDocument;
  generatedAt?: string;
}): string {
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const { project, template } = input;
  const meta = typologyMeta(project.site.typology);
  const items = itemsForTypology(template.items, project.site.typology);

  const stagesHtml = template.stages
    .map((stage) => {
      const stageItems = items.filter((item) => item.stageId === stage.id);
      if (stageItems.length === 0) {
        return "";
      }
      const rows = stageItems.map((item) => itemRow(item, project)).join("");
      return `<section class="stage">
        <h2><span class="num">${stage.number}</span> ${escapeHtml(stage.title)}</h2>
        <p class="summary">${escapeHtml(stage.summary)}</p>
        ${rows}
      </section>`;
    })
    .join("");

  const attachments = project.attachments
    .map((file) => {
      const itemTitle =
        template.items.find((item) => item.id === file.itemId)?.title ??
        "Project";
      return `<li><strong>${escapeHtml(file.filename)}</strong> · ${file.size} bytes · SHA-256 ${escapeHtml(file.sha256.slice(0, 12))}… · ${escapeHtml(itemTitle)}</li>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="en-AU">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>${escapeHtml(project.site.name)} · rev ${project.revision}</title>
  <style>
    :root {
      color-scheme: light dark;
      --bg: #f6f1e8;
      --ink: #1c1712;
      --muted: #5c5346;
      --line: #d8ccb8;
      --card: #fffaf3;
      --accent: #8a4b21;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #161310;
        --ink: #f4ece1;
        --muted: #cbbba8;
        --line: #3a3229;
        --card: #221e1a;
        --accent: #e0a36c;
      }
    }
    body {
      margin: 0;
      font: 16px/1.45 "Iowan Old Style", "Palatino Linotype", Palatino, serif;
      background: var(--bg);
      color: var(--ink);
    }
    header, main { max-width: 42rem; margin: 0 auto; padding: 1.25rem; }
    header { padding-top: max(1.25rem, env(safe-area-inset-top)); border-bottom: 1px solid var(--line); }
    .kicker { letter-spacing: 0.12em; text-transform: uppercase; font-size: 0.72rem; color: var(--accent); }
    h1 { font-size: 1.8rem; margin: 0.2rem 0 0.4rem; }
    .meta { color: var(--muted); font-size: 0.95rem; }
    .rev { display: inline-block; border: 1px solid var(--line); padding: 0.15rem 0.5rem; border-radius: 999px; }
    .item { background: var(--card); border: 1px solid var(--line); border-radius: 12px; padding: 0.9rem 1rem; margin: 0.7rem 0; }
    .status { font-size: 0.75rem; letter-spacing: 0.06em; text-transform: uppercase; color: var(--accent); }
    .notes { white-space: pre-wrap; margin: 0.4rem 0 0; }
    .empty { color: var(--muted); font-style: italic; }
    footer { max-width: 42rem; margin: 0 auto; padding: 1.25rem; color: var(--muted); font-size: 0.9rem; }
  </style>
</head>
<body>
  <header>
    <div class="kicker">Victoria architectural checklist · standalone snapshot</div>
    <h1>${escapeHtml(project.site.name)}</h1>
    <p class="meta">
      <span class="rev">Revision ${project.revision}</span>
      · Snapshot ${escapeHtml(formatWhen(generatedAt))}
      · Project updated ${escapeHtml(formatWhen(project.updatedAt))}
    </p>
    <p class="meta">
      ${escapeHtml(typologyLabel(project.site.typology))} · ${escapeHtml(meta.clause)}<br />
      ${escapeHtml(project.site.address || "Address not recorded")} · ${escapeHtml(project.site.municipality || "Municipality not recorded")}
    </p>
    <p class="meta">
      Template ${escapeHtml(template.title)} ${escapeHtml(template.version)}
      · checksum ${escapeHtml(template.checksum.slice(0, 16))}…
    </p>
  </header>
  <main>
    ${stagesHtml}
    <section class="stage">
      <h2>Attachments</h2>
      ${attachments ? `<ul>${attachments}</ul>` : `<p class="empty">No attachments in this revision.</p>`}
    </section>
  </main>
  <footer>
    This HTML snapshot is a view of revision ${project.revision} generated ${escapeHtml(generatedAt)}.
    It is not the lossless archive — use the ZIP for import.
  </footer>
</body>
</html>`;
}

function itemRow(item: ChecklistItem, project: ProjectDocument): string {
  const answer = project.answers[item.id];
  const status = statusLabel(answer?.status ?? "todo");
  const notes = answer?.notes ?? "";
  return `<article class="item">
    <div class="status">${escapeHtml(status)}${item.required ? " · required" : ""}</div>
    <h3>${escapeHtml(item.title)}</h3>
    <p>${escapeHtml(item.detail)}</p>
    ${item.references.length
      ? `<p class="meta">${escapeHtml(item.references.length === 1 ? "Source: " : "Sources: ")}${escapeHtml(item.references.join(" · "))}</p>`
      : ""}
    ${notes ? `<p class="notes">${escapeHtml(notes)}</p>` : `<p class="empty">No notes.</p>`}
  </article>`;
}
