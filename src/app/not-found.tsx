import Link from "next/link";
import { AppHeader } from "@/components/app-header";

export default function NotFound() {
  return (
    <div>
      <AppHeader title="Not found" backHref="/" />
      <main className="mx-auto max-w-3xl space-y-3 px-4 py-8">
        <h1 className="font-heading text-3xl">That page is not here</h1>
        <p className="text-muted-foreground">
          Check the typology or import a ZIP if the project lives in another
          installation.
        </p>
        <Link href="/" className="underline underline-offset-2">
          Home
        </Link>
      </main>
    </div>
  );
}
