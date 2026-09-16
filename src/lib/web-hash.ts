import { canonicalStringify } from "@/lib/canonical";

export async function sha256Bytes(
  data: Uint8Array | ArrayBuffer | string,
): Promise<string> {
  const bytes =
    typeof data === "string" ? new TextEncoder().encode(data) : data;
  const digest = await crypto.subtle.digest("SHA-256", bytes as BufferSource);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

export async function sha256Json(value: unknown): Promise<string> {
  return sha256Bytes(canonicalStringify(value));
}
