import path from "node:path";

export function dataRoot(): string {
  return process.env.DATA_DIR || path.join(process.cwd(), "data");
}

export function projectsRoot(): string {
  return path.join(dataRoot(), "projects");
}

export function projectDir(projectId: string): string {
  return path.join(projectsRoot(), projectId);
}

export function projectJsonPath(projectId: string): string {
  return path.join(projectDir(projectId), "project.json");
}

export function templateJsonPath(projectId: string): string {
  return path.join(projectDir(projectId), "template.json");
}

export function attachmentsDir(projectId: string): string {
  return path.join(projectDir(projectId), "attachments");
}

export function attachmentFilePath(
  projectId: string,
  attachmentId: string,
  filename: string,
): string {
  return path.join(attachmentsDir(projectId), attachmentId, filename);
}

export function safeFilename(name: string): string {
  const base = path.basename(name).replace(/[\u0000-\u001f]/g, "");
  const cleaned = base.replace(/[\\/]/g, "_").trim() || "attachment";
  return cleaned.slice(0, 180);
}
