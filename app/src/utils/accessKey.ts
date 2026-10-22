/** Mirrors server `isValidKeyField` constraints (10–100 chars, safe charset). */
export function looksLikeAccessKey(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length >= 10 && trimmed.length <= 100 && /^[a-zA-Z0-9_-]+$/.test(trimmed);
}
