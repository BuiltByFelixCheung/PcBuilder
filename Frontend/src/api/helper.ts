export function parseRange(minValue: string | null, maxValue: string | null) {
  const min = toInteger(minValue);
  const max = toInteger(maxValue);
  if (min == null || max == null) return undefined;
  return { min, max };
}

export function toInteger(value: string | null): number | undefined {
  if (value == null || value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : undefined;
}

export function emptyToUndefined(value: string | null): string | undefined {
  return value?.trim() ? value : undefined;
}

export function parseOptionalBoolean(
  value: string | null,
): boolean | undefined {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

export function toOptionalNumber(value: string): number | null {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function setSearchValue(
  search: URLSearchParams,
  key: string,
  value: string | number | undefined,
) {
  if (value == null || value === "") return;
  search.set(key, String(value));
}

export function setSearchFlag(
  search: URLSearchParams,
  key: string,
  value: boolean | undefined,
) {
  if (value == null) return;
  search.set(key, String(value));
}
