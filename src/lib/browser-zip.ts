import JSZip from "jszip";
import { prettyStringify } from "@/lib/canonical";
import { sha256Bytes, sha256Json } from "@/lib/web-hash";
import { templateChecksumPayload } from "@/lib/hash-payload";
import {
  FORMAT_VERSION,
  PACKAGE_FORMAT,
  type PackageManifest,
  type ProjectDocument,
  type TemplateDocument,
} from "@/lib/types";
import {
  validatePackageManifest,
  validateProjectDocument,
  validateTemplateDocument,
} from "@/lib/validate";

export class PackageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PackageError";
  }
}

export type PackedAttachment = {
  id: string;
  filename: string;
  bytes: Uint8Array;
};

async function zipBuffer(
  zip: JSZip,
  path: string,
): Promise<Uint8Array | null> {
  const match = Object.keys(zip.files).find(
    (name) => name === path || name.endsWith(`/${path}`),
  );
  const file = match ? zip.file(match) : null;
  if (!file || file.dir) {
    return null;
  }
  return file.async("uint8array");
}

export async function assertTemplateAssociation(
  project: ProjectDocument,
  template: TemplateDocument,
  manifest?: PackageManifest,
): Promise<void> {
  const computed = await sha256Json(
    templateChecksumPayload(template as unknown as Record<string, unknown>),
  );
  if (template.checksum !== computed) {
    throw new PackageError("template.json checksum does not match canonical SHA-256");
  }
  if (
    project.template.id !== template.id ||
    project.template.version !== template.version ||
    project.template.checksum !== template.checksum
  ) {
    throw new PackageError("project.json template association does not match template.json");
  }
  if (manifest) {
    if (
      manifest.projectId !== project.id ||
      manifest.revision !== project.revision ||
      manifest.templateId !== template.id ||
      manifest.templateVersion !== template.version ||
      manifest.templateChecksum !== template.checksum
    ) {
      throw new PackageError("manifest.json does not match project.json / template.json");
    }
  }
}

export async function unpackZip(bytes: Uint8Array): Promise<{
  manifest: PackageManifest;
  project: ProjectDocument;
  template: TemplateDocument;
  attachments: PackedAttachment[];
}> {
  const zip = await JSZip.loadAsync(bytes);
  const manifestBuffer = await zipBuffer(zip, "manifest.json");
  const projectBuffer = await zipBuffer(zip, "project.json");
  const templateBuffer = await zipBuffer(zip, "template.json");
  if (!manifestBuffer || !projectBuffer || !templateBuffer) {
    throw new PackageError(
      "ZIP must contain manifest.json, project.json and template.json",
    );
  }
  const decoder = new TextDecoder();
  const manifest = validatePackageManifest(
    JSON.parse(decoder.decode(manifestBuffer)),
  );
  const project = validateProjectDocument(
    JSON.parse(decoder.decode(projectBuffer)),
  );
  const template = validateTemplateDocument(
    JSON.parse(decoder.decode(templateBuffer)),
  );
  await assertTemplateAssociation(project, template, manifest);

  const attachments: PackedAttachment[] = [];
  for (const entry of manifest.files.attachments) {
    const buffer = await zipBuffer(zip, entry.path);
    if (!buffer) {
      throw new PackageError(`ZIP is missing attachment ${entry.path}`);
    }
    if (buffer.byteLength !== entry.size) {
      throw new PackageError(`Attachment ${entry.filename} size does not match manifest`);
    }
    const digest = await sha256Bytes(buffer);
    if (digest !== entry.sha256) {
      throw new PackageError(`Attachment ${entry.filename} SHA-256 does not match manifest`);
    }
    const meta = project.attachments.find((item) => item.id === entry.id);
    if (!meta) {
      throw new PackageError(`Attachment ${entry.id} is not listed in project.json`);
    }
    if (meta.sha256 !== digest || meta.size !== buffer.byteLength) {
      throw new PackageError(
        `Attachment ${entry.filename} does not match project.json metadata`,
      );
    }
    attachments.push({ id: entry.id, filename: meta.filename, bytes: buffer });
  }
  if (project.attachments.length !== attachments.length) {
    throw new PackageError(
      "Attachment count in project.json does not match the ZIP manifest",
    );
  }
  return { manifest, project, template, attachments };
}

export async function packZip(input: {
  project: ProjectDocument;
  template: TemplateDocument;
  attachments: PackedAttachment[];
}): Promise<Uint8Array> {
  await assertTemplateAssociation(input.project, input.template);
  const manifest: PackageManifest = {
    format: PACKAGE_FORMAT,
    formatVersion: FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    projectId: input.project.id,
    revision: input.project.revision,
    templateId: input.template.id,
    templateVersion: input.template.version,
    templateChecksum: input.template.checksum,
    files: {
      project: "project.json",
      template: "template.json",
      attachments: await Promise.all(
        input.attachments.map(async (file) => ({
          id: file.id,
          path: `attachments/${file.id}/${file.filename}`,
          sha256: await sha256Bytes(file.bytes),
          size: file.bytes.byteLength,
          filename: file.filename,
        })),
      ),
    },
  };
  validatePackageManifest(manifest);
  validateProjectDocument(input.project);
  validateTemplateDocument(input.template);

  const zip = new JSZip();
  zip.file("manifest.json", prettyStringify(manifest));
  zip.file("project.json", prettyStringify(input.project));
  zip.file("template.json", prettyStringify(input.template));
  for (const file of input.attachments) {
    zip.file(`attachments/${file.id}/${file.filename}`, file.bytes);
  }
  return zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
}
