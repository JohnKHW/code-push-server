import { readFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { spawn } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const envPath = join(root, ".local/api.env");
if (!existsSync(envPath))
  throw new Error("Run npm run local:setup in api first.");
const require = createRequire(join(root, "api/package.json"));
const localEnv = require("dotenv").parse(readFileSync(envPath));
if (localEnv.EMULATED !== "true" || localEnv.NODE_ENV !== "development") {
  throw new Error(
    "The local launcher requires EMULATED=true and NODE_ENV=development."
  );
}
if (!["localhost", "127.0.0.1"].includes(localEnv.REDIS_HOST)) {
  throw new Error("The local launcher requires a local Redis host.");
}
const server = join(root, "api/bin/script/server.js");
if (!existsSync(server)) throw new Error("Build the API first: npm run build.");
const env = { ...process.env };
// Load only the file's CodePush credentials; never inherit a production tenant or OAuth secret.
for (const name of [
  "MSAL_CLIENT_ID",
  "MSAL_CLI_CLIENT_ID",
  "MSAL_TENANT_ID",
  "MSAL_API_AUDIENCE",
  "MSAL_API_SCOPE",
  "MSAL_REDIRECT_PATH",
  "MSAL_REQUIRED_ROLE",
  "MSAL_SESSION_TTL_SECONDS",
  "MICROSOFT_CLIENT_ID",
  "MICROSOFT_CLIENT_SECRET",
  "MICROSOFT_TENANT_ID",
  "GITHUB_CLIENT_ID",
  "GITHUB_CLIENT_SECRET",
  "AZURE_KEYVAULT_ACCOUNT",
  "TRUST_PROXY_HOPS",
  "DISABLE_ACQUISITION",
  "DISABLE_MANAGEMENT",
  "APP_INSIGHTS_INSTRUMENTATION_KEY",
])
  delete env[name];
Object.assign(env, localEnv);
// The CA must be present before Node starts; loading it inside dotenv/config is too late.
const child = spawn(process.execPath, [server], {
  cwd: join(root, "api"),
  env,
  stdio: "inherit",
});
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => child.kill(signal));
child.on("error", (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
child.on("exit", (code) => {
  process.exitCode = code ?? 0;
});
