import { exportProjectZip } from "@/lib/store";
import { jsonFromError } from "@/lib/http";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const { filename, bytes } = await exportProjectZip(id);
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(bytes.length),
      },
    });
  } catch (error) {
    return jsonFromError(error);
  }
}
