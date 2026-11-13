// Additive Entra token exchange. Existing CodePush bearer authentication stays unchanged.
import { Router } from "express";
import rateLimit from "express-rate-limit";
import { createRemoteJWKSet, jwtVerify } from "jose";
import * as storage from "../storage/storage";
import { generateSecureKey } from "../utils/security";

export function getMsalAuthenticationRouter(store: storage.Storage): Router {
  const router = Router();
  const clientId = process.env.MSAL_CLIENT_ID?.trim().toLowerCase();
  const tenantId = process.env.MSAL_TENANT_ID?.toLowerCase();
  const audience = process.env.MSAL_API_AUDIENCE;
  const audiences = (audience || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const scope = process.env.MSAL_API_SCOPE?.trim();
  if (!clientId && !tenantId && !audience && !scope) {
    router.get("/auth/msal/config", (_req, res) => {
      res.setHeader("Cache-Control", "no-store");
      res
        .status(503)
        .json({
          message:
            "Microsoft sign-in is not configured on this CodePush API. Configure the MSAL settings in the API environment and restart it.",
        });
    });
    return router;
  }
  const guid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!guid.test(tenantId || "") || !guid.test(clientId || "") || !audiences.length || !scope || !scope.includes("/")) {
    throw new Error("MSAL requires a tenant GUID, client GUID, API audience and full delegated API scope.");
  }
  const authority = `https://login.microsoftonline.com/${tenantId}`;
  const keys = createRemoteJWKSet(new URL(`${authority}/discovery/v2.0/keys`));
  const cliClientId = (process.env.MSAL_CLI_CLIENT_ID || clientId).trim().toLowerCase();
  if (!guid.test(cliClientId)) throw new Error("MSAL_CLI_CLIENT_ID must be a client GUID.");
  const allowedClients = new Set([clientId, cliClientId]);
  const redirectPath = process.env.MSAL_REDIRECT_PATH || "/admin/auth";
  if (!["/", "/admin/", "/admin/auth"].includes(redirectPath)) {
    throw new Error("MSAL_REDIRECT_PATH must be /, /admin/ or /admin/auth.");
  }
  const v1Issuer = `https://sts.windows.net/${tenantId}/`;
  const v2Issuer = `${authority}/v2.0`;
  const ttl = Number(process.env.MSAL_SESSION_TTL_SECONDS || 28800);
  if (!Number.isInteger(ttl) || ttl < 300 || ttl > 5184000) {
    throw new Error("MSAL_SESSION_TTL_SECONDS must be between 300 and 5184000.");
  }

  router.get("/auth/msal/config", (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.json({
      clientId,
      cliClientId,
      authority,
      scope,
      redirectPath,
      environment: process.env.DEPLOYMENT_ENVIRONMENT || "local",
      metricsEnabled: !!process.env.REDIS_HOST && !!process.env.REDIS_PORT,
    });
  });

  router.post("/auth/token", rateLimit({ windowMs: 15 * 60 * 1000, max: 50 }), async (req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Pragma", "no-cache");
    const match = /^Bearer ([^ ]+)$/i.exec(req.header("Authorization") || "");
    if (!match || match[1].length > 16384) {
      res.status(401).json({ message: "An Entra access token is required." });
      return;
    }
    let claims;
    try {
      const result = await jwtVerify(match[1], keys, {
        audience: audiences,
        issuer: [v1Issuer, v2Issuer],
        algorithms: ["RS256"],
        requiredClaims: ["exp", "iat", "sub", "oid", "tid", "scp", "ver"],
      });
      claims = result.payload;
      // Existing portal scopes issue v1 tokens (appid/upn); dedicated APIs may issue v2 (azp/preferred_username).
      const callingClient = claims.ver === "1.0" ? claims.appid : claims.ver === "2.0" ? claims.azp : undefined;
      const expectedIssuer = claims.ver === "1.0" ? v1Issuer : claims.ver === "2.0" ? v2Issuer : undefined;
      if (
        claims.tid !== tenantId ||
        typeof claims.oid !== "string" ||
        typeof claims.scp !== "string" ||
        !claims.scp.split(" ").includes(scope.substring(scope.lastIndexOf("/") + 1)) ||
        !expectedIssuer ||
        claims.iss !== expectedIssuer ||
        typeof callingClient !== "string" ||
        !allowedClients.has(callingClient.toLowerCase())
      )
        throw new Error("Invalid delegated token claims");
    } catch {
      res.status(401).json({ message: "The Entra access token is invalid, expired, or issued for another API or client." });
      return;
    }
    const requiredRole = process.env.MSAL_REQUIRED_ROLE;
    if (requiredRole && (!Array.isArray(claims.roles) || !claims.roles.includes(requiredRole))) {
      res.status(403).json({ message: "Your account is not assigned the required CodePush role." });
      return;
    }
    // Email is used only to find an account. The immutable provider ID must also match.
    const email = [
      claims.email,
      claims.preferred_username,
      claims.upn,
      claims.unique_name,
      claims["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/upn"],
    ].find((value) => typeof value === "string" && value.includes("@"));
    if (typeof email !== "string" || !email.includes("@")) {
      res.status(403).json({ message: "Your Entra account must provide an email or user principal name claim." });
      return;
    }
    try {
      let account: storage.Account;
      try {
        account = await store.getAccountByEmail(email);
      } catch (error) {
        if (error.code !== storage.ErrorCode.NotFound) throw error;
        if ((process.env.ENABLE_ACCOUNT_REGISTRATION || "true").toLowerCase() !== "true") {
          res.status(403).json({ message: "This account is not registered with CodePush." });
          return;
        }
        account = {
          email,
          name: typeof claims.name === "string" ? claims.name : email,
          azureAdId: claims.oid,
          createdTime: Date.now(),
        };
        account.id = await store.addAccount(account);
      }
      // Accept the old OIDC subject for existing linked accounts; never link by email alone.
      if (account.azureAdId !== claims.oid && account.azureAdId !== claims.sub) {
        res.status(403).json({
          message:
            "This CodePush account is not linked to this Entra identity. Link Azure AD using the existing authentication flow first.",
        });
        return;
      }
      const now = Date.now();
      const createdBy = typeof req.body?.hostname === "string" ? req.body.hostname.slice(0, 100) : "CodePush Admin";
      const key: storage.AccessKey = {
        name: generateSecureKey(account.id),
        createdTime: now,
        createdBy,
        friendlyName: `MSAL-${now}-${generateSecureKey(account.id).slice(0, 8)}`,
        expires: now + ttl * 1000,
        isSession: true,
      };
      await store.addAccessKey(account.id, key);
      res.json({ accessToken: key.name, tokenType: "Bearer", expiresAt: key.expires, expiresIn: ttl, sessionName: key.friendlyName });
    } catch (error) {
      next(error);
    }
  });
  return router;
}
