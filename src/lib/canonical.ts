function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortKeysDeep);
  }
  if (isPlainObject(value)) {
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(value).sort()) {
      sorted[key] = sortKeysDeep(value[key]);
    }
    return sorted;
  }
  return value;
}

export function canonicalStringify(value: unknown): string {
  return `${JSON.stringify(sortKeysDeep(value))}\n`;
}

export function prettyStringify(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}
