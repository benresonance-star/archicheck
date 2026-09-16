import { addAttachment } from "@/lib/store";
import { jsonFromError, jsonOk } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return jsonFromError(new Error("Choose a file to attach"));
    }
    const itemIdValue = form.get("itemId");
    const itemId =
      typeof itemIdValue === "string" && itemIdValue.length > 0
        ? itemIdValue
        : null;
    const bytes = Buffer.from(await file.arrayBuffer());
    const result = await addAttachment({
      projectId: id,
      itemId,
      filename: file.name,
      mimeType: file.type,
      bytes,
    });
    return jsonOk(result, 201);
  } catch (error) {
    return jsonFromError(error);
  }
}
