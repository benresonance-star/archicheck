import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { uniqueResourceUrls } from "../src/lib/template/item-resources";
import { DEFAULT_WATCH_SOURCES } from "../src/lib/scout/watch-list";

const UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

function httpStatus(url: string): number {
  const result = spawnSync(
    "curl",
    [
      "-sS",
      "-o",
      "/dev/null",
      "-w",
      "%{http_code}",
      "-L",
      "--max-time",
      "20",
      "-A",
      UA,
      url,
    ],
    { encoding: "utf8" },
  );
  if (result.error) {
    throw result.error;
  }
  const code = Number.parseInt(result.stdout.trim(), 10);
  assert.ok(Number.isInteger(code), `${url} curl: ${result.stderr || result.stdout}`);
  return code;
}

test("helper and scout URLs are https and do not 404", () => {
  const urls = [
    ...uniqueResourceUrls(),
    ...DEFAULT_WATCH_SOURCES.map((source) => source.url),
  ];
  const unique = [...new Set(urls)].sort();
  assert.ok(unique.length >= 30);
  assert.ok(unique.includes("https://ncc.abcb.gov.au/ncc-2025"));
  assert.equal(
    unique.includes("https://ncc.abcb.gov.au/editions/ncc-2025/adopted"),
    false,
  );
  assert.ok(
    unique.some((url) => url.includes("part-h8-livable-housing-design")),
  );

  const missing: string[] = [];
  for (const url of unique) {
    assert.ok(url.startsWith("https://"), url);
    const status = httpStatus(url);
    if (status === 404 || status === 410) {
      missing.push(`${status} ${url}`);
    }
  }
  assert.deepEqual(missing, []);
});
