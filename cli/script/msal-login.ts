// Device sign-in exchanges Entra credentials for a standard CodePush session.
import { PublicClientApplication } from "@azure/msal-node";
import * as os from "os";
import * as superagent from "superagent";

export async function acquireMsalSession(serverUrl: string, log: (message: string) => void): Promise<string> {
  const server = new URL(serverUrl);
  if (
    server.protocol !== "https:" &&
    !(server.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(server.hostname))
  ) {
    throw new Error("Microsoft sign-in requires an HTTPS CodePush server (HTTP is allowed on localhost).");
  }
  if (server.pathname !== "/" || server.search || server.hash || server.username || server.password) {
    throw new Error("Use the CodePush server origin without /admin or another path.");
  }
  const base = server.origin;
  const response = await superagent.get(`${base}/auth/msal/config`).timeout(15000);
  const config = response.body;
  if (
    !/^https:\/\/login\.microsoftonline\.com\/[0-9a-f-]{36}$/i.test(config.authority || "") ||
    !config.cliClientId ||
    typeof config.scope !== "string"
  ) {
    throw new Error("The CodePush server returned an invalid Microsoft sign-in configuration.");
  }
  const client = new PublicClientApplication({ auth: { clientId: config.cliClientId, authority: config.authority } });
  const result = await client.acquireTokenByDeviceCode({
    scopes: [config.scope],
    deviceCodeCallback: (deviceCode) => log(deviceCode.message),
  });
  if (!result?.accessToken) throw new Error("Microsoft sign-in did not return an access token.");
  const session = await superagent
    .post(`${base}/auth/token`)
    .set("Authorization", `Bearer ${result.accessToken}`)
    .send({ hostname: os.hostname() })
    .timeout(15000);
  if (typeof session.body.accessToken !== "string" || !session.body.accessToken) {
    throw new Error("The CodePush server did not return a session token.");
  }
  return session.body.accessToken;
}
