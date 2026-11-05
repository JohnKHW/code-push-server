import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  chmodSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";
import { execFileSync } from "node:child_process";

const directory = dirname(fileURLToPath(import.meta.url));
const root = resolve(directory, "../..");
const local = join(root, ".local");
const certs = join(local, "certs");
for (const path of [
  local,
  certs,
  join(local, "data/azurite"),
  join(local, "data/redis"),
])
  mkdirSync(path, { recursive: true });
chmodSync(local, 0o700);

function openssl(args) {
  execFileSync("openssl", args, {
    cwd: certs,
    stdio: ["ignore", "ignore", "pipe"],
  });
}
if (!existsSync(join(certs, "ca.crt")) || !existsSync(join(certs, "ca.key"))) {
  writeFileSync(
    join(certs, "ca.cnf"),
    `[req]
prompt = no
distinguished_name = subject
x509_extensions = ca_ext
[subject]
CN = CodePush Local Development CA
[ca_ext]
basicConstraints = critical,CA:TRUE
keyUsage = critical,keyCertSign,cRLSign
subjectKeyIdentifier = hash
`
  );
  openssl([
    "req",
    "-x509",
    "-newkey",
    "rsa:2048",
    "-nodes",
    "-sha256",
    "-days",
    "3650",
    "-config",
    "ca.cnf",
    "-keyout",
    "ca.key",
    "-out",
    "ca.crt",
  ]);
  chmodSync(join(certs, "ca.key"), 0o600);
}
if (
  !existsSync(join(certs, "redis.crt")) ||
  !existsSync(join(certs, "redis.key"))
) {
  writeFileSync(
    join(certs, "redis.cnf"),
    `[req]
prompt = no
distinguished_name = subject
[subject]
CN = localhost
[server_ext]
basicConstraints = critical,CA:FALSE
keyUsage = critical,digitalSignature,keyEncipherment
extendedKeyUsage = serverAuth
subjectAltName = DNS:localhost,IP:127.0.0.1
`
  );
  openssl([
    "req",
    "-new",
    "-newkey",
    "rsa:2048",
    "-nodes",
    "-sha256",
    "-config",
    "redis.cnf",
    "-keyout",
    "redis.key",
    "-out",
    "redis.csr",
  ]);
  openssl([
    "x509",
    "-req",
    "-in",
    "redis.csr",
    "-CA",
    "ca.crt",
    "-CAkey",
    "ca.key",
    "-CAcreateserial",
    "-out",
    "redis.crt",
    "-days",
    "825",
    "-sha256",
    "-extfile",
    "redis.cnf",
    "-extensions",
    "server_ext",
  ]);
  // Redis runs under its own container user. Only these individual files are mounted.
  chmodSync(join(certs, "redis.key"), 0o644);
}
const passwordPath = join(local, "redis-password");
if (!existsSync(passwordPath))
  writeFileSync(passwordPath, randomBytes(32).toString("hex"), { mode: 0o600 });
const password = readFileSync(passwordPath, "utf8").trim();
if (!/^[a-f0-9]{64}$/.test(password))
  throw new Error("The local Redis password file is invalid.");
writeFileSync(
  join(local, "redis.conf"),
  `port 0
tls-port 6380
tls-cert-file /tls/redis.crt
tls-key-file /tls/redis.key
tls-ca-cert-file /tls/ca.crt
tls-auth-clients no
requirepass ${password}
dir /data
appendonly yes
appendfsync everysec
`,
  { mode: 0o644 }
);
const envPath = join(local, "api.env");
if (!existsSync(envPath)) {
  const template = readFileSync(join(directory, "api.env.example"), "utf8");
  writeFileSync(
    envPath,
    `${template}\nREDIS_KEY=${password}\nNODE_EXTRA_CA_CERTS=${JSON.stringify(
      join(certs, "ca.crt")
    )}\n`,
    { mode: 0o600 }
  );
  console.log(
    "Created .local/api.env. Add your development MSAL settings to enable admin sign-in."
  );
} else console.log("Kept your existing .local/api.env.");
execFileSync(
  "docker",
  [
    "compose",
    "-f",
    join(directory, "compose.yaml"),
    "up",
    "-d",
    "--wait",
    "--wait-timeout",
    "120",
  ],
  { cwd: root, stdio: "inherit" }
);
console.log("Local storage: .local/data/azurite");
console.log("Local telemetry: .local/data/redis");
console.log("Next: cd api && npm run dev:local");
