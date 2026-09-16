import { BUNDLED_TEMPLATE } from "@/lib/template/vic-residential";
import { jsonOk } from "@/lib/http";

export const runtime = "nodejs";

export async function GET() {
  return jsonOk({ template: BUNDLED_TEMPLATE });
}
