import { setAnswer } from "@/lib/store";
import { jsonFromError, jsonOk } from "@/lib/http";
import { isItemStatus } from "@/lib/types";

export const runtime = "nodejs";

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string; itemId: string }> },
) {
  try {
    const { id, itemId } = await context.params;
    const body = (await request.json()) as {
      status?: string;
      notes?: string;
      fields?: Record<string, string | number | boolean | null>;
    };
    if (body.status !== undefined && !isItemStatus(body.status)) {
      return jsonFromError(new Error("Invalid status"));
    }
    const project = await setAnswer(id, itemId, {
      status: body.status,
      notes: body.notes,
      fields: body.fields,
    });
    return jsonOk({ project });
  } catch (error) {
    return jsonFromError(error);
  }
}
