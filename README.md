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

This app is used on iPhone. **Localhost is not visible there.** After each change we publish a public Vercel URL (temporary deploy to claim, or the GitHub-connected production URL once that exists).

```bash
npx vercel deploy --temporary --yes --prod
```

## Acceptance test

`npm test` creates a townhouse project, writes answers/notes/an attachment, exports a ZIP, wipes the data directory, imports the ZIP, and asserts every answer, note, attachment byte, and template association is restored.

In the UI: **Export ZIP** on a project, then **Import ZIP** on a fresh install (or another phone).

## Code scout

The **home page** has a statewide noticeboard. **Scout process** (`/scout`) is where you change sites, cadence (1 / 7 / 14 / 28 days) and scout type: Cursor in-app, Grok Bot, or another person/process.

Default sites include NCC (BPC and ABCB), ARBV, AIA Victorian Chapter, Master Builders Victoria, HIA, BPC news, planning schemes, Townhouse Code, Better Apartments, the developer bond page and the Gazette. Each source states what it looks for. You can disable, edit URLs, or add https sites.

Each **project** still has **Code scout** for that job’s municipality.

Alerts stay in the app. The first run stores a baseline; later runs compare hashes. You can tick flagged items yourself, or edit and accept proposed wording into a **draft template** on a project — answers are never auto-changed.

This is a practice aid, not legal advice. Some official sites block automated fetch; those findings still list the URL and item ids.

## Grok Bots

Each stage has a named Grok Bot brief (copy the first task). Bots must not lodge permits or change the JSON except as a proposed patch.

Projects live **on the device** (IndexedDB JSON). The ZIP is the portable archive (manifest, project, template, attachments). Server files under `data/projects` are only used by the Node test harness.

Public hosting: push `main` to GitHub, then connect that repo in Vercel so production updates on every push. Until GitHub exists, use the temporary Vercel deploy above and claim it.
