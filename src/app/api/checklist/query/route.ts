import { jsonFromError, jsonOk } from "@/lib/http";
import { queryChecklistItems, parseChecklistQuery } from "@/lib/agent/query";
import { BUNDLED_TEMPLATE } from "@/lib/template/vic-residential";

export const runtime = "nodejs";

function searchParamsRecord(
  searchParams: URLSearchParams,
): Record<string, string | string[]> {
  const record: Record<string, string | string[]> = {};
  for (const key of new Set(searchParams.keys())) {
    const values = searchParams.getAll(key);
    record[key] = values.length <= 1 ? (values[0] ?? "") : values;
  }
  return record;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const query = parseChecklistQuery(searchParamsRecord(url.searchParams));
    const result = queryChecklistItems(BUNDLED_TEMPLATE, query);
    return jsonOk({
      interface: {
        name: "checklist-query",
        version: "1.0.0",
        description:
          "Retrieve checklist items an agent can use to assess an external design. Optional structured assessment fields stay on the item. Findings are a separate document and must not rewrite answers or the approved template.",
        parameters: {
          typology: "house | townhouse | apartment",
          stageId: "ARBV stage id",
          deliverableId: "drawing or document id",
          elementType: "target element type, e.g. balcony",
          requirementKind: "regulatory | guidance | office_practice",
          outputKind:
            "client-brief | report | site-plan | demolition | plans | rcp | elevations | sections | details | roof-plan | schedules | specification | drawing-standards | record",
          itemId: "repeatable stable item id",
          input: "repeatable available input id; omitted inputs are reported as missing",
        },
      },
      template: result.template,
      items: result.items,
      missingInformation: result.missingInformation,
      unstructuredItems: result.unstructuredItems,
    });
  } catch (error) {
    return jsonFromError(error);
  }
}
