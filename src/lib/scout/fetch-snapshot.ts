import { excerptOf, hashText, stripHtml } from "@/lib/scout/normalize";
import type { ScoutSnapshot } from "@/lib/scout/types";

const TIMEOUT_MS = 12_000;

export async function fetchSnapshot(input: {
  sourceId: string;
  title: string;
  url: string;
  scope: "statewide" | "local";
}): Promise<ScoutSnapshot> {
  const fetchedAt = new Date().toISOString();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(input.url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept-Language": "en-AU,en;q=0.9",
      },
    });
    const raw = await response.text();
    const text = stripHtml(raw);
    const sha256 = text ? await hashText(text) : null;
    return {
      sourceId: input.sourceId,
      title: input.title,
      url: input.url,
      scope: input.scope,
      ok: response.ok && Boolean(sha256),
      httpStatus: response.status,
      sha256,
      excerpt: excerptOf(text),
      error: response.ok ? null : `HTTP ${response.status}`,
      fetchedAt,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "fetch failed";
    return {
      sourceId: input.sourceId,
      title: input.title,
      url: input.url,
      scope: input.scope,
      ok: false,
      httpStatus: null,
      sha256: null,
      excerpt: "",
      error: message,
      fetchedAt,
    };
  } finally {
    clearTimeout(timer);
  }
}
