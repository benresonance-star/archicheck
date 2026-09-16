import Ajv, { type ErrorObject } from "ajv/dist/2020";
import addFormats from "ajv-formats";
import schema from "../../schema/vic-arch-checklist.schema.json";
import type {
  FindingDocument,
  PackageManifest,
  ProjectDocument,
  TemplateDocument,
} from "@/lib/types";

const SCHEMA_ID =
  "https://vic-arch-checklist.local/schema/vic-arch-checklist.schema.json";

const ajv = new Ajv({
  allErrors: true,
  strict: false,
  validateFormats: true,
});
addFormats(ajv);
ajv.addSchema(schema);

export type ValidationIssue = {
  instancePath: string;
  message: string;
};

export class SchemaValidationError extends Error {
  issues: ValidationIssue[];

  constructor(kind: string, issues: ValidationIssue[]) {
    super(`${kind} failed JSON Schema validation`);
    this.name = "SchemaValidationError";
    this.issues = issues;
  }
}

function formatIssues(errors: ErrorObject[] | null | undefined): ValidationIssue[] {
  return (errors ?? []).map((error) => ({
    instancePath: error.instancePath || "/",
    message: error.message ?? "invalid",
  }));
}

function validateDef<T>(def: string, data: unknown, kind: string): T {
  const validate = ajv.getSchema(`${SCHEMA_ID}#/$defs/${def}`);
  if (!validate) {
    throw new Error(`Schema definition not found: ${def}`);
  }
  const ok = validate(data);
  if (!ok) {
    throw new SchemaValidationError(kind, formatIssues(validate.errors));
  }
  return data as T;
}

export function validateFindingDocument(data: unknown): FindingDocument {
  return validateDef<FindingDocument>("findingDocument", data, "finding.json");
}

export function validateProjectDocument(data: unknown): ProjectDocument {
  return validateDef<ProjectDocument>("projectDocument", data, "project.json");
}

export function validateTemplateDocument(data: unknown): TemplateDocument {
  return validateDef<TemplateDocument>(
    "templateDocument",
    data,
    "template.json",
  );
}

export function validatePackageManifest(data: unknown): PackageManifest {
  return validateDef<PackageManifest>(
    "packageManifest",
    data,
    "manifest.json",
  );
}

export { schema as packageSchema };
