# JSON Schema — Victoria Architectural Checklist

This folder is the documented contract for lossless storage.

## Package ZIP (required for a full restore)

```
{project-name}/
  manifest.json
  project.json
  template.json
  attachments/{attachment-uuid}/{original-filename}
```

| File | Schema `$defs` | Role |
| --- | --- | --- |
| `manifest.json` | `packageManifest` | Index: project id, revision, template association, attachment paths and SHA-256 |
| `project.json` | `projectDocument` | Site data, every answer/note, attachment metadata, template ref |
| `template.json` | `templateDocument` | The exact template version this project was filled against |
| `attachments/...` | (bytes) | Original files; hash and size must match `project.json` and `manifest.json` |

A standalone `project.json` import restores answers, notes, and the template *association*, but not attachment bytes. Use the ZIP for the acceptance test.

## Identity and lossless rules

- `project.id` is a UUID and is preserved on import (unless it collides, in which case the importer keeps the incoming id and replaces the existing project).
- `revision` is an integer starting at 1. Import restores the exported revision. Later edits increment it.
- `template.id` + `template.version` + `template.checksum` bind the project to the template copy stored in the ZIP. Import does **not** silently upgrade to a newer bundled template.
- `answers` is a map keyed by checklist item id. Unknown keys are kept. Notes are ordinary strings, including empty strings.
- Checklist items cite `references` (instrument names). Optional `resources` are `{label, url}` helper links (`https://` only). Bundled items always include at least one. Older ZIPs without `resources` still validate.
- Optional `deliverables` on the template name the drawing or document for each stage. Checklist items may set `deliverableId` to join that associated checklist. Attachments may set `deliverableId` for the file stored on that drawing or document. Older ZIPs without these fields still validate.
- Optional `assessment` on a checklist item is the versioned agent contract (`schemaVersion` `1.0.0`). It keeps the **requirement** (regulatory / guidance / office practice, source refs, requirement version) separate from the **checking method** and acceptance criteria, and lists applicability (element types), required inputs, evidence, and whether a human must review. Item `id` values stay stable across template versions. Older ZIPs without `assessment` still validate.
- Optional `findings` on `project.json` are a separate `findingDocument` (`format` `vic-arch-checklist-finding`, `formatVersion` `1.0.0`). Results are Pass, Fail, Not applicable, Insufficient information, Needs judgement, or Check error. A finding cites the checklist id/version/checksum, an external design revision, affected elements, evidence and assumptions. Findings must not rewrite answers, attachments, or the approved template. Suggested checklist changes on `checklistIssue` enter the existing sourced-proposal human-review path. Older ZIPs without `findings` still validate.
- Attachment bytes are hashed with SHA-256 (lowercase hex). Import fails if any hash or size disagrees.

## Canonical checksum

`template.checksum` is SHA-256 of canonical JSON of the template document **without** the `checksum` field. Canonical JSON is UTF-8, keys sorted recursively, no extra whitespace except a trailing newline.

## Schema file

The machine-readable schema is [`vic-arch-checklist.schema.json`](./vic-arch-checklist.schema.json) (JSON Schema 2020-12). It is also served from `/schema/vic-arch-checklist.schema.json` in the running app.

## Agent query interface

Agents should **query** the checklist, then emit a **finding**. They must not tick items or rewrite the template.

### Query

`GET /api/checklist/query` (same filters as `queryChecklistItems` in `src/lib/agent/query.ts`):

| Parameter | Meaning |
| --- | --- |
| `typology` | `house`, `townhouse` or `apartment` |
| `stageId` | ARBV stage id |
| `deliverableId` | Drawing or document id |
| `elementType` | Target element type (e.g. `balcony`) |
| `requirementKind` | `regulatory`, `guidance` or `office_practice` |
| `outputKind` | Output document lens: `client-brief`, `report`, `site-plan`, `demolition`, `plans`, `rcp`, `elevations`, `sections`, `details`, `roof-plan`, `schedules`, `specification`, `drawing-standards`, `record` |
| `itemId` | Repeatable stable item id |
| `input` | Repeatable available input id. Omitted required inputs are listed as missing. |

The response returns matching items (including optional `assessment`), `missingInformation` (required inputs/evidence not supplied, plus human-review needs), and `unstructuredItems` (matches with no `assessment` yet). Full checking of an external design is not in this version.

Example: `/api/checklist/query?typology=apartment&elementType=balcony&itemId=cd-bads-pos&input=floor-plans`

### Findings

A standalone finding document (`$defs/findingDocument`) is demonstrated in [`finding.example.json`](./finding.example.json). Record it on `project.findings` so ZIP import/export keeps it. Do not copy `result` into `answers`. If `checklistIssue` suggests wording, convert it with `checklistIssueToSourcedProposal` and put it on the statewide noticeboard for a human to compare and publish.

Two-way use (later): an agent can check a design against items, and can flag checklist ambiguity, contradiction, or missing coverage. Those flags still need a reviewer.

## Scout reports

In-app Code scout stores the latest `scout-report` per project on the device (not in the ZIP). A separate statewide noticeboard report (`statewide-board`) and scout settings (sites, cadence, runner) also stay on the device. Approving a sourced change **publishes** a new live template version. Existing projects receive `impacts` on `project.json`; adopting selected items sets those answers to `needs_recheck` and keeps notes, `previousStatus`, and attachments. Older ZIPs without `impacts` still validate.
