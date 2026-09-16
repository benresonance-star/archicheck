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
- Attachment bytes are hashed with SHA-256 (lowercase hex). Import fails if any hash or size disagrees.

## Canonical checksum

`template.checksum` is SHA-256 of canonical JSON of the template document **without** the `checksum` field. Canonical JSON is UTF-8, keys sorted recursively, no extra whitespace except a trailing newline.

## Schema file

The machine-readable schema is [`vic-arch-checklist.schema.json`](./vic-arch-checklist.schema.json) (JSON Schema 2020-12). It is also served from `/schema/vic-arch-checklist.schema.json` in the running app.

## Scout reports

In-app Code scout stores the latest `scout-report` per project on the device (not in the ZIP). A separate statewide noticeboard report (`statewide-board`) and scout settings (sites, cadence, runner) also stay on the device. Accepting proposed wording on a **project** bumps `template.version` to `*-draft.N` and recomputes `checksum`. Project answers are unchanged.
