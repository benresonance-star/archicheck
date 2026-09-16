import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import schema from "../schema/vic-arch-checklist.schema.json";
import { prettyStringify } from "../src/lib/canonical";
import { exampleFinding } from "../src/lib/agent/example";
import { BUNDLED_TEMPLATE } from "../src/lib/template/vic-residential";

async function main() {
  const dir = path.join(process.cwd(), "public", "schema");
  const schemaDir = path.join(process.cwd(), "schema");
  await mkdir(dir, { recursive: true });
  await writeFile(
    path.join(dir, "vic-arch-checklist.schema.json"),
    prettyStringify(schema),
    "utf8",
  );
  await writeFile(
    path.join(dir, "vic-residential.template.json"),
    prettyStringify(BUNDLED_TEMPLATE),
    "utf8",
  );
  const finding = prettyStringify(exampleFinding(BUNDLED_TEMPLATE));
  await writeFile(path.join(dir, "finding.example.json"), finding, "utf8");
  await writeFile(path.join(schemaDir, "finding.example.json"), finding, "utf8");
}

void main();
