import { looksLikeAccessKey } from "./accessKey";

const CODEPUSH_ACCESS_KEY_MESSAGE = "codepush-access-key";

export interface OAuthPopupHandlers {
  cleanup: () => void;
}

/**
 * Watches an OAuth popup for postMessage (when the server supports it) or clipboard
 * after the user copies the key from /accesskey (same flow as the CLI paste step).
 */
export function watchOAuthPopup(
  popup: Window,
  serverOrigin: string,
  onAccessKey: (accessKey: string) => void
): OAuthPopupHandlers {
  let cleanedUp = false;

  const cleanup = () => {
    if (cleanedUp) return;
    cleanedUp = true;
    window.clearInterval(pollTimer);
    window.removeEventListener("message", onMessage);
    window.removeEventListener("focus", onWindowFocus);
  };

  const deliver = (raw: string) => {
    const key = raw.trim();
    if (!looksLikeAccessKey(key)) return;
    cleanup();
    onAccessKey(key);
  };

  const onMessage = (event: MessageEvent) => {
    if (event.origin !== serverOrigin) return;

    const data = event.data;
    if (
      data &&
      typeof data === "object" &&
      (data as { type?: string }).type === CODEPUSH_ACCESS_KEY_MESSAGE &&
      typeof (data as { accessKey?: string }).accessKey === "string"
    ) {
      deliver((data as { accessKey: string }).accessKey);
    }
  };

  const tryClipboard = async () => {
    if (!navigator.clipboard?.readText) return;
    try {
      const text = await navigator.clipboard.readText();
      if (text) deliver(text);
    } catch {
      /* clipboard permission denied or empty */
    }
  };

  const onWindowFocus = () => {
    if (!popup.closed) return;
    void tryClipboard();
  };

  window.addEventListener("message", onMessage);
  window.addEventListener("focus", onWindowFocus);

  const pollTimer = window.setInterval(() => {
    if (popup.closed) {
      void tryClipboard();
      cleanup();
    }
  }, 500);

  return { cleanup };
}
