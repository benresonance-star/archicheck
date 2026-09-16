import { deleteProject, loadProject, updateSite } from "@/lib/store";
import { jsonFromError, jsonOk } from "@/lib/http";
import { isTypology, type Site } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    return jsonOk(await loadProject(id));
  } catch (error) {
    return jsonFromError(error);
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as { site?: Site };
    if (!body.site || !isTypology(body.site.typology)) {
      return jsonFromError(new Error("A valid site payload is required"));
    }
    const project = await updateSite(id, body.site);
    return jsonOk({ project });
  } catch (error) {
    return jsonFromError(error);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    await deleteProject(id);
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonFromError(error);
  }
}
