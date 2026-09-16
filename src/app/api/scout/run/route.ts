import { jsonFromError, jsonOk } from "@/lib/http";
import { runScout } from "@/lib/scout/run";
import { isTypology } from "@/lib/types";
import type { PreviousSnapshot } from "@/lib/scout/watch-list";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      projectId?: string;
      municipality?: string;
      typology?: string;
      previous?: PreviousSnapshot[];
    };
    if (!body.projectId || !body.typology || !isTypology(body.typology)) {
      return jsonFromError(new Error("projectId and typology are required"));
    }
    const report = await runScout({
      projectId: body.projectId,
      municipality: body.municipality ?? "",
      typology: body.typology,
      previous: body.previous ?? [],
    });
    return jsonOk({ report });
  } catch (error) {
    return jsonFromError(error);
  }
}
