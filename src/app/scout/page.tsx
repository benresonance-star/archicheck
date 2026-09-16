import { AppHeader } from "@/components/app-header";
import { ScoutProcessForm } from "@/components/scout-process";
import { StatewideNoticeboard } from "@/components/statewide-noticeboard";

export default function ScoutRoute() {
  return (
    <div className="pb-[env(safe-area-inset-bottom)]">
      <AppHeader title="Scout" backHref="/" />
      <main className="mx-auto max-w-3xl space-y-10 px-4 py-6">
        <section className="space-y-2">
          <p className="text-xs uppercase tracking-[0.16em] text-primary">
            Statewide
          </p>
          <h1 className="font-heading text-3xl">Noticeboard</h1>
          <p className="text-sm text-muted-foreground">
            Practice-wide watch of Victorian / national code sites. Alerts stay
            in the app. Project Code scout still watches that job’s municipality.
          </p>
        </section>
        <StatewideNoticeboard />
        <ScoutProcessForm />
      </main>
    </div>
  );
}