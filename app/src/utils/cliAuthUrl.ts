import { DEFAULT_CODEPUSH_SERVER_URL } from "../api/serverUrl";

/**
 * Builds the browser URL opened by the CLI for external OAuth.
 * Mirrors `initiateExternalAuthenticationAsync` in cli/script/command-executor.ts:
 *   `${serverUrl || AccountManager.SERVER_URL}/auth/${action}?hostname=${hostname}`
 */
export function buildCliExternalAuthUrl(
  serverUrl: string,
  action: "login" | "register" | "link",
  hostname: string
): string {
  const base = serverUrl.trim().replace(/\/+$/, "") || DEFAULT_CODEPUSH_SERVER_URL;
  // Same concatenation as the CLI (no extra encoding); keep hostname to safe characters (like os.hostname()).
  return `${base}/auth/${action}?hostname=${hostname}`;
}
