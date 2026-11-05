import {
  InteractionRequiredAuthError,
  PublicClientApplication,
} from "@azure/msal-browser";
import { http } from "../../api/http";
import { readSession, saveSession, clearSession } from "../../api/session";
import type { AuthConfig } from "../../types/admin";
class AuthService {
  private client: PublicClientApplication | null = null;
  private config: AuthConfig | null = null;
  private pending: Promise<AuthConfig> | null = null;
  initialize(force = false): Promise<AuthConfig> {
    if (this.pending) return this.pending;
    this.pending = this.authorize(force).finally(() => {
      this.pending = null;
    });
    return this.pending;
  }
  private async authorize(force: boolean): Promise<AuthConfig> {
    if (!this.config)
      this.config = (await http.get<AuthConfig>("/auth/msal/config")).data;
    const config = this.config;
    if (!this.client) {
      this.client = new PublicClientApplication({
        auth: {
          clientId: config.clientId,
          authority: config.authority,
          redirectUri: `${window.location.origin}/admin/auth`,
          navigateToLoginRequestUrl: false,
          postLogoutRedirectUri: `${window.location.origin}/admin/signed-out`,
        },
        cache: { cacheLocation: "sessionStorage" },
      });
      await this.client.initialize();
    }
    const result = await this.client.handleRedirectPromise();
    if (result?.account) this.client.setActiveAccount(result.account);
    if (!force && !result && readSession()) return config;
    const account =
      this.client.getActiveAccount() || this.client.getAllAccounts()[0];
    if (!account) {
      this.rememberLocation();
      await this.client.loginRedirect({ scopes: [config.scope] });
      throw new Error("Redirecting to Microsoft sign-in…");
    }
    this.client.setActiveAccount(account);
    try {
      const token = await this.client.acquireTokenSilent({
        account,
        scopes: [config.scope],
      });
      const previous = readSession(0);
      const response = await http.post<{
        accessToken: string;
        expiresAt: number;
        sessionName: string;
      }>(
        "/auth/token",
        { hostname: "CodePush Admin" },
        { headers: { Authorization: `Bearer ${token.accessToken}` } }
      );
      saveSession(
        response.data.accessToken,
        response.data.expiresAt,
        response.data.sessionName
      );
      if (previous?.sessionName) {
        // Dispose of the previous browser key after a successful refresh.
        void http
          .delete(`/accessKeys/${encodeURIComponent(previous.sessionName)}`, {
            headers: { Authorization: `Bearer ${previous.token}` },
            skipSessionRefresh: true,
          })
          .catch(() => undefined);
      }
      return config;
    } catch (error) {
      if (error instanceof InteractionRequiredAuthError) {
        this.rememberLocation();
        await this.client.acquireTokenRedirect({
          account,
          scopes: [config.scope],
        });
      }
      throw error;
    }
  }
  private rememberLocation() {
    const path = window.location.pathname + window.location.search;
    if (path.startsWith("/admin/") && !path.startsWith("/admin/auth"))
      sessionStorage.setItem("codepush.returnTo", path);
  }
  async logout() {
    const session = readSession(0);
    if (session?.sessionName) {
      try {
        await http.delete(
          `/accessKeys/${encodeURIComponent(session.sessionName)}`,
          {
            headers: { Authorization: `Bearer ${session.token}` },
            skipSessionRefresh: true,
          }
        );
      } catch {
        /* Local and Microsoft sign-out must still complete if the API is unavailable. */
      }
    }
    clearSession();
    if (this.client)
      await this.client.logoutRedirect({
        account: this.client.getActiveAccount(),
      });
    else window.location.assign("/admin/signed-out");
  }
}
export const authService = new AuthService();
