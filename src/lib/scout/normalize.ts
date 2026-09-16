import { sha256Bytes } from "@/lib/web-hash";

export function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export function excerptOf(text: string, length = 280): string {
  if (text.length <= length) {
    return text;
  }
  return `${text.slice(0, length).trim()}…`;
}

export async function hashText(text: string): Promise<string> {
  return sha256Bytes(text.toLowerCase());
}
