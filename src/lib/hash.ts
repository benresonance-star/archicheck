import { createHash } from "node:crypto";
import { canonicalStringify } from "@/lib/canonical";

export function sha256Bytes(data: Buffer | Uint8Array | string): string {
  return createHash("sha256").update(data).digest("hex");
}

export function sha256Json(value: unknown): string {
  return sha256Bytes(canonicalStringify(value));
}

export function templateChecksumPayload(
  template: Record<string, unknown>,
): Record<string, unknown> {
  const { checksum: _checksum, ...rest } = template;
  void _checksum;
  return rest;
}
