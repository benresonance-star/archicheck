import { createProject, listProjects } from "@/lib/store";
import { jsonFromError, jsonOk } from "@/lib/http";
import { isTypology, type Site } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  try {
    return jsonOk({ projects: await listProjects() });
  } catch (error) {
    return jsonFromError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { site?: Partial<Site> };
    const site = body.site;
    if (!site?.name || !site.typology || !isTypology(site.typology)) {
      return jsonFromError(new Error("A project name and typology are required"));
    }
    const created = await createProject({
      site: {
        name: site.name,
        typology: site.typology,
        address: site.address ?? "",
        municipality: site.municipality ?? "",
        planningScheme: site.planningScheme ?? "",
        zone: site.zone ?? "",
        overlays: site.overlays ?? [],
        storeys: site.storeys ?? 1,
        dwellingCount: site.dwellingCount ?? 1,
        lotAreaSqm: site.lotAreaSqm ?? null,
        notes: site.notes ?? "",
      },
    });
    return jsonOk(created, 201);
  } catch (error) {
    return jsonFromError(error);
  }
}
