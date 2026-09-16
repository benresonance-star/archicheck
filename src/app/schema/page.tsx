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
          Code scout reports live on the device beside the project. Accepting
          proposed wording writes a draft template version and checksum; it
          does not rewrite answers.
        </p>
        <p>
          Agents query the checklist at{" "}
          <a
            className="underline underline-offset-2"
            href="/api/checklist/query?typology=apartment&elementType=balcony&itemId=cd-bads-pos"
          >
            /api/checklist/query
          </a>
          . Optional <code>assessment</code> fields on an item stay separate
          from the checking method. A finding is a separate JSON document —{" "}
          <a
            className="underline underline-offset-2"
            href="/schema/finding.example.json"
          >
            example finding
          </a>
          — and must not rewrite answers or the approved template. Suggested
          checklist changes still need a human on the statewide noticeboard.
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
