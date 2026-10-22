/** Default CodePush management API origin (no trailing slash). */
export const DEFAULT_CODEPUSH_SERVER_URL =
  "https://codepush-gammon.gammonconstruction.com";

export const CODEPUSH_SERVER_STORAGE_KEY = "codepushServerUrl";

function normalizeOrigin(url: string): string {
  const trimmed = url.trim().replace(/\/+$/, "");
  if (!trimmed) return DEFAULT_CODEPUSH_SERVER_URL;
  try {
    const u = new URL(trimmed);
    return `${u.protocol}//${u.host}`;
  } catch {
    return DEFAULT_CODEPUSH_SERVER_URL;
  }
}

/**
 * Resolves axios baseURL: in dev, same host as Vite proxy target uses `/api` to avoid CORS.
 */
export function resolveCodePushBaseURL(): string {
  const fromEnv = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
  const stored = localStorage.getItem(CODEPUSH_SERVER_STORAGE_KEY)?.trim();
  const resolved = normalizeOrigin(stored || fromEnv || DEFAULT_CODEPUSH_SERVER_URL);

  if (import.meta.env.DEV) {
    try {
      if (new URL(resolved).hostname === "codepush-gammon.gammonconstruction.com") {
        return "/api";
      }
    } catch {
      /* fall through */
    }
  }

  return resolved;
}

export function persistCodePushServerUrl(input: string): string {
  const normalized = normalizeOrigin(input);
  localStorage.setItem(CODEPUSH_SERVER_STORAGE_KEY, normalized);
  return normalized;
}
