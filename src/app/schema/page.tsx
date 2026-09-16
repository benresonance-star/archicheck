import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { BUNDLED_TEMPLATE } from "@/lib/template/vic-residential";

export default function SchemaPage() {
  return (
    <div className="pb-[env(safe-area-inset-bottom)]">
      <AppHeader title="JSON Schema" backHref="/" />
      <main className="mx-auto max-w-3xl space-y-5 px-4 py-6 text-sm leading-relaxed">
        <h1 className="font-heading text-3xl">Lossless JSON package</h1>
        <p>
          A ZIP is the full archive: <code>manifest.json</code>,{" "}
          <code>project.json</code>, <code>template.json</code>, and{" "}
          <code>attachments/{"{id}"}/filename</code>. Import into a fresh
          installation must restore every answer, note, attachment byte, and
          the template id/version/checksum.
        </p>
        <p>
          Machine-readable schema:{" "}
          <a
            className="underline underline-offset-2"
            href="/schema/vic-arch-checklist.schema.json"
          >
            /schema/vic-arch-checklist.schema.json
          </a>
        </p>
        <p>
          Bundled template {BUNDLED_TEMPLATE.id} {BUNDLED_TEMPLATE.version} checksum{" "}
          {BUNDLED_TEMPLATE.checksum.slice(0, 16)}… —{" "}
          <a
            className="underline underline-offset-2"
            href="/schema/vic-residential.template.json"
          >
            download template JSON
          </a>
        </p>
        <p>
          An HTML snapshot is a dated, revision-stamped view. It is not the
          lossless archive.
        </p>
        <p>
          <Link href="/" className="underline underline-offset-2">
            Back to typologies
          </Link>
        </p>
      </main>
    </div>
  );
}
