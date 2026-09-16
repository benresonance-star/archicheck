import { jsonFromError, jsonOk } from "@/lib/http";
import { runScout } from "@/lib/scout/run";
import { isTypology } from "@/lib/types";
import { parseWatchSources, type PreviousSnapshot } from "@/lib/scout/watch-list";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      projectId?: string;
      municipality?: string;
      typology?: string;
      previous?: PreviousSnapshot[];
      sources?: unknown;
      includeLocal?: boolean;
      ignoreTypology?: boolean;
      kind?: "statewide" | "project";
    };
    const kind = body.kind === "statewide" ? "statewide" : "project";
    if (!body.projectId) {
      return jsonFromError(new Error("projectId is required"));
    }
    const typology =
      kind === "statewide"
        ? "house"
        : body.typology && isTypology(body.typology)
          ? body.typology
          : null;
    if (!typology) {
      return jsonFromError(new Error("projectId and typology are required"));
    }
    const report = await runScout({
      projectId: body.projectId,
      municipality: body.municipality ?? "",
      typology,
      previous: body.previous ?? [],
      sources: body.sources === undefined ? undefined : parseWatchSources(body.sources),
      includeLocal: kind === "statewide" ? false : body.includeLocal !== false,
      ignoreTypology: kind === "statewide" || Boolean(body.ignoreTypology),
      kind,
    });
    return jsonOk({ report });
  } catch (error) {
    return jsonFromError(error);
  }
}
