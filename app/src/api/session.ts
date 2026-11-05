interface Session {
  token: string;
  expiresAt: number;
  sessionName?: string;
}
const key = "codepush.admin.session";
export function readSession(minimumLifetime = 60000): Session | null {
  try {
    const value = JSON.parse(
      sessionStorage.getItem(key) || "null"
    ) as Session | null;
    return value &&
      typeof value.token === "string" &&
      value.expiresAt > Date.now() + minimumLifetime
      ? value
      : null;
  } catch {
    return null;
  }
}
export function saveSession(
  token: string,
  expiresAt: number,
  sessionName?: string
) {
  sessionStorage.setItem(
    key,
    JSON.stringify({ token, expiresAt, sessionName })
  );
}
export function clearSession() {
  sessionStorage.removeItem(key);
}
