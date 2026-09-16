import { createHash } from "node:crypto";
import { canonicalStringify } from "@/lib/canonical";

export { templateChecksumPayload } from "@/lib/hash-payload";

export function sha256Bytes(data: Buffer | Uint8Array | string): string {
  return createHash("sha256").update(data).digest("hex");
}

export function sha256Json(value: unknown): string {
  return sha256Bytes(canonicalStringify(value));
}
