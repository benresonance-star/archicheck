import { loadProject } from "@/lib/store";
import { renderSnapshotHtml } from "@/lib/html-snapshot";
import { jsonFromError } from "@/lib/http";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const { project, template } = await loadProject(id);
    const html = renderSnapshotHtml({ project, template });
    const download = new URL(request.url).searchParams.get("download");
    const headers = new Headers({
      "Content-Type": "text/html; charset=utf-8",
    });
    if (download === "1") {
      headers.set(
        "Content-Disposition",
        `attachment; filename="${project.site.name.replace(/[^a-z0-9]+/gi, "-")}-rev${project.revision}.html"`,
      );
    }
    return new Response(html, { headers });
  } catch (error) {
    return jsonFromError(error);
  }
}
