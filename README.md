# Victoria architectural checklist

Design-stage checklist for **houses**, **townhouses** and **apartments** in Victoria, Australia — pre-design through post-occupancy.

The first version is built around three deliverables:

1. A phone-and-desktop HTML interface, split by typology and by ARBV stage, with shadcn light/dark modes.
2. Lossless JSON import/export validated against the documented JSON Schema in `/schema`.
3. A downloadable ZIP: `manifest.json`, `project.json`, the exact `template.json` the project was filled against, and every attachment.

An HTML snapshot (date + revision in the header) is for reading without the app. It is not the lossless archive.

PDF and CSV are not in this version.

## Run locally

```bash
npm install
npm test
npm run dev
```

Open [http://127.0.0.1:43181](http://127.0.0.1:43181) on the same machine.

iPhone cannot open localhost. Production is **https://archicheck-gules.vercel.app**, deployed from [github.com/benresonance-star/archicheck](https://github.com/benresonance-star/archicheck). Push to `main` and Vercel rebuilds that URL.

## Acceptance test

`npm test` creates a townhouse project, writes answers/notes/an attachment, exports a ZIP, wipes the data directory, imports the ZIP, and asserts every answer, note, attachment byte, and template association is restored.

In the UI: **Export ZIP** on a project, then **Import ZIP** on a fresh install (or another phone).

## Generic templates

The **Templates** header link (`/templates`) shows the bundled house, townhouse and apartment lists as checkable references. **By document** groups ticks under the output list (client brief, report, site plan, demolition, plans, RCP, elevations, sections, details, roof plan, schedules, specification, cover/drawing standards, and records). **By stage** keeps the ARBV stage list. Construction documentation sheet checks were taken from a typical CD QA list, rewritten for Victoria and NCC 2025. Open **Apartment** for BADS as separate ticks. Each item cites a **Source** and **Resource(s)**. Ticks stay on the device; they are not a project ZIP.

## Code scout

The **home page** has a statewide noticeboard. **Scout process** (`/scout`) is where you change sites, cadence (1 / 7 / 14 / 28 days) and scout type: Cursor in-app, Grok Bot, or another person/process.

Default sites include NCC 2025 (BPC and ABCB), ARBV, AIA Victorian Chapter, Master Builders Victoria, HIA, BPC news, planning schemes, Townhouse Code, Better Apartments, the developer bond page and the Gazette. Each source states what it looks for. You can disable, edit URLs, or add https sites.

Each **project** still has **Code scout** for that job’s municipality.

Alerts stay in the app. The first run stores a baseline; later runs compare hashes. A sourced proposal (scout, Grok Bot, or a person) is compared against the current item. **Approve and publish** writes a new live template version. Existing projects get an **impact notice**; the job reviewer selects which changes to adopt. Adopted checks become **Needs recheck** and keep their notes, previous status and attachments.

This is a practice aid, not legal advice. Some official sites block automated fetch; those findings still list the URL and item ids.

## Grok Bots

Each stage has a named Grok Bot brief (copy the first task). Bots must not lodge permits or change the JSON except as a proposed patch.

A new project (and the project page) records **zones and overlays** as checkbox lists from the Victoria Planning Provisions. More than one of each can be ticked. The [planning property report](https://www.planning.vic.gov.au/planning-schemes/planning-property-report) is linked next to those lists.

On a project, **By document** and **By stage** switch the checklist index. Document view opens Plans, RCP, Elevations and the other outputs with the same answers, notes and attachments as the stage pages.

Projects live **on the device** (IndexedDB JSON). The ZIP is the portable archive (manifest, project, template, attachments). Server files under `data/projects` are only used by the Node test harness.

Agents can query the bundled checklist at `/api/checklist/query` (filters: typology, stage, deliverable, element type, requirement kind, item id, available inputs). Items may carry an optional `assessment` (requirement vs checking method, required inputs, evidence, human-review). Assessment results are a separate finding document (`/schema/finding.example.json`) and must not rewrite ticks or the approved template. Suggested checklist changes still go through sourced-proposal review.

Source: [github.com/benresonance-star/archicheck](https://github.com/benresonance-star/archicheck). Production: [archicheck-gules.vercel.app](https://archicheck-gules.vercel.app).
