import { readAttachmentBytes, removeAttachment } from "@/lib/store";
import { jsonFromError, jsonOk } from "@/lib/http";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string; attachmentId: string }> },
) {
  try {
    const { id, attachmentId } = await context.params;
    const { meta, bytes } = await readAttachmentBytes(id, attachmentId);
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": meta.mimeType,
        "Content-Disposition": `attachment; filename="${meta.filename}"`,
        "Content-Length": String(meta.size),
      },
    });
  } catch (error) {
    return jsonFromError(error);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string; attachmentId: string }> },
) {
  try {
    const { id, attachmentId } = await context.params;
    const project = await removeAttachment(id, attachmentId);
    return jsonOk({ project });
  } catch (error) {
    return jsonFromError(error);
  }
}
