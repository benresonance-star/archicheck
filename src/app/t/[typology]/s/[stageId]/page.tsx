import { notFound } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { TemplateReference } from "@/components/template-reference";
import { BUNDLED_TEMPLATE } from "@/lib/template/vic-residential";
import { itemsForTypology } from "@/lib/types";
import { parseTypologyParam, typologyMeta } from "@/lib/typology";

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

  return (
    <div className="pb-[env(safe-area-inset-bottom)]">
      <AppHeader
        title={`${String(stage.number).padStart(2, "0")} ${stage.title}`}
        backHref={`/t/${typology}`}
      />
      <main className="mx-auto max-w-3xl space-y-4 px-4 py-6">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {meta.title} generic template · {items.length} items in this stage.
          Ticks stay on this phone. Start a project for notes, attachments and
          a ZIP.
        </p>
        <TemplateReference typology={typology} stageId={stage.id} />
      </main>
    </div>
  );
}
