import { loadProject } from "@/lib/store";
import { renderSnapshotHtml } from "@/lib/html-snapshot";
import { jsonFromError } from "@/lib/http";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const { project, template } = await loadProject(id);
    const html = renderSnapshotHtml({ project, template });
    return new Response(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (error) {
    return jsonFromError(error);
  }
}
