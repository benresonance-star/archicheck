import { importProjectZip } from "@/lib/store";
import { jsonFromError, jsonOk } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return jsonFromError(new Error("Choose a ZIP package to import"));
    }
    const bytes = Buffer.from(await file.arrayBuffer());
    const result = await importProjectZip(bytes);
    return jsonOk(result, 201);
  } catch (error) {
    return jsonFromError(error);
  }
}
