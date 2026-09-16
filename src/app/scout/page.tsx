import { AppHeader } from "@/components/app-header";
import { ScoutProcessForm } from "@/components/scout-process";
import { ScoutSection } from "@/components/scout-section";
import { StatewideNoticeboard } from "@/components/statewide-noticeboard";

export default function ScoutRoute() {
  return (
    <div className="pb-[env(safe-area-inset-bottom)]">
      <AppHeader title="Scout" backHref="/" />
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-6">
        <StatewideNoticeboard collapsible />
        <ScoutSection
          title="Scout process"
          subtitle="Sites, timing, and whether Cursor, a Grok Bot or someone else runs it."
          defaultOpen={false}
        >
          <ScoutProcessForm />
        </ScoutSection>
      </main>
    </div>
  );
}