import { notFound } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { GrokbotPanel } from "@/components/grokbot-panel";
import { BUNDLED_TEMPLATE, grokbotForStage } from "@/lib/template/vic-residential";
import { itemsForTypology } from "@/lib/types";
import { parseTypologyParam, typologyMeta } from "@/lib/typology";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function TypologyStagePreviewPage({
  params,
}: {
  params: Promise<{ typology: string; stageId: string }>;
}) {
  const { typology: raw, stageId } = await params;
  const typology = parseTypologyParam(raw);
  if (!typology) {
    notFound();
  }
  const stage = BUNDLED_TEMPLATE.stages.find((entry) => entry.id === stageId);
  if (!stage) {
    notFound();
  }
  const meta = typologyMeta(typology);
  const items = itemsForTypology(BUNDLED_TEMPLATE.items, typology).filter(
    (item) => item.stageId === stage.id,
  );
  const grokbot = grokbotForStage(BUNDLED_TEMPLATE, stage.id);

  return (
    <div className="pb-[env(safe-area-inset-bottom)]">
      <AppHeader
        title={`${String(stage.number).padStart(2, "0")} ${stage.title}`}
        backHref={`/t/${typology}`}
      />
      <main className="mx-auto max-w-3xl space-y-4 px-4 py-6">
        <p className="text-sm text-muted-foreground">
          {meta.title} preview · {items.length} items. Start a project to record
          answers, notes and attachments.
        </p>
        {items.map((item) => (
          <Card key={item.id}>
            <CardHeader>
              <CardTitle>{item.title}</CardTitle>
              <CardDescription>{item.detail}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {item.required ? "Required" : "Optional"}
                {item.references.length > 0
                  ? ` · ${item.references.join(" · ")}`
                  : ""}
              </p>
            </CardContent>
          </Card>
        ))}
        {grokbot ? (
          <GrokbotPanel
            bot={grokbot}
            stage={stage}
            project={{
              format: "vic-arch-checklist-project",
              formatVersion: "1.0.0",
              id: "00000000-0000-4000-8000-000000000000",
              revision: 1,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              template: {
                id: BUNDLED_TEMPLATE.id,
                version: BUNDLED_TEMPLATE.version,
                checksum: BUNDLED_TEMPLATE.checksum,
              },
              site: {
                name: `${meta.title} preview`,
                typology,
                address: "",
                municipality: "",
                planningScheme: "",
                zone: "",
                overlays: [],
                storeys: 1,
                dwellingCount: 1,
                lotAreaSqm: null,
                notes: "",
              },
              answers: {},
              attachments: [],
            }}
          />
        ) : null}
      </main>
    </div>
  );
}
