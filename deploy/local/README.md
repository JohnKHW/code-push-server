# Run CodePush locally with files on disk

The local setup runs Azurite for storage and Redis for telemetry in Docker. The API and Vite frontend run on your machine. Azure Storage credentials and an Azure subscription are not required. The existing production storage code is used with `EMULATED=true`.

## Start

Install Node.js 24 (matching `.nvmrc`), Docker with Compose, and OpenSSL. From the repository root:

```bash
cd api
npm ci
npm run local:setup
```

The setup generates `.local/api.env`, a local Redis password and TLS certificates, then starts Azurite and Redis. Existing `.local/api.env` is preserved when setup runs again. It does not change `api/.env`, UAT/prod secrets or cloud data.

Azurite and Redis keep their data in these folders under the repository root:

| Folder/file | Contents |
| --- | --- |
| `.local/data/azurite/` | Application/account metadata, deployments, package history and uploaded package files |
| `.local/data/redis/` | Persisted download/install counters and cache |
| `.local/api.env` | Your local API configuration |
| `.local/certs/` | Local Redis TLS certificates |

`.local/` is ignored by Git. Stopping/recreating containers keeps the data folders.

## Configure Microsoft sign-in

Edit `.local/api.env` and add the four required values from your **development** Entra registrations:

```dotenv
MSAL_CLIENT_ID=<SPA registration client GUID>
MSAL_TENANT_ID=<tenant GUID>
MSAL_API_AUDIENCE=<API registration client GUID>
MSAL_API_SCOPE=api://<API registration client GUID>/access_as_user
```

Register `http://localhost:4000/admin/auth` as a **SPA** redirect URI and configure the logout return URL for `http://localhost:4000/admin/signed-out`. The API registration must issue v2 access tokens. Grant the SPA permission to call the API scope and grant consent, as described in the [Entra setup guide](../README.md#microsoft-entra-configuration).

For CLI device sign-in, add `MSAL_CLI_CLIENT_ID` if using a separate public client registration. Enable public client/device-code flows on that registration and grant it the same delegated API scope.

Account registration is enabled in this local environment so your first Microsoft sign-in creates an account in your local Azurite database. This does not give access to UAT/prod accounts or applications. If `MSAL_REQUIRED_ROLE` is set, assign yourself that API user role as well.

The storage/services and `/health` endpoint work without MSAL settings. The admin UI and CLI Microsoft sign-in require real Entra configuration and internet access to Microsoft. Authentication remains enabled.

## Run the API and frontend

In the `api` directory:

```bash
npm run dev:local
```

This builds the API and starts it using `.local/api.env`. It starts a fresh Node process with the local CA in `NODE_EXTRA_CA_CERTS`, so Redis TLS certificate validation stays enabled. It does not install that CA in your system or browser. `start:local` starts an already-built API without rebuilding.

In a second terminal, from the repository root:

```bash
cd app
npm ci
npm run dev
```

Open **http://localhost:4000/admin/**. The frontend redirects to Microsoft automatically and uses the API at `http://localhost:3000` via Vite's `/api` proxy.

Check storage and Redis readiness:

```bash
curl --fail http://localhost:3000/health
```

The response should be `Healthy`. `/health/live` only checks that the API process is running.

To use the CLI, build it and then sign in to the local API origin:

```bash
cd cli
npm ci
npm run build
node bin/script/cli.js login http://localhost:3000 --device-code
node bin/script/cli.js app list
```

## Local settings

The generated configuration starts with these values. Leave the generated `REDIS_KEY` and `NODE_EXTRA_CA_CERTS` entries in place:

```dotenv
NODE_ENV=development
DEPLOYMENT_ENVIRONMENT=local
EMULATED=true
API_PORT=3000
SERVER_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:4000
CUSTOM_STORAGE_URL=http://127.0.0.1:10000
REDIS_HOST=127.0.0.1
REDIS_PORT=6380
DEBUG_DISABLE_AUTH=false
ENABLE_ACCOUNT_REGISTRATION=true
```

Leave `HTTPS` empty for this setup. Do not set it to the string `false`: the legacy server treats a nonempty value as enabled. The local launcher requires development mode, emulated storage and local Redis; use the regular production start command for AKS.

The local services bind to loopback ports 10000/10001/10002 for Azurite and 6380 for Redis. Stop anything using these ports before setup. If port 3000 or 4000 is occupied, use consistent alternate API/Vite ports and update `API_PORT`, `SERVER_URL`, `CORS_ORIGIN`, the Vite proxy target and the SPA redirect URI together. A Vite `.env.local` production proxy target must be removed or set back to `http://localhost:3000` when using local storage.

## Mobile SDK downloads

An iOS simulator can use the host's loopback address. For an Android emulator or a USB-connected Android device, forwarding both API and blob ports lets the default URLs work:

```bash
adb reverse tcp:3000 tcp:3000
adb reverse tcp:10000 tcp:10000
```

Use `http://127.0.0.1:3000` as the SDK server URL. If using another connection/tunnel, the device must reach both the API and the blob endpoint. `CUSTOM_STORAGE_URL` replaces the `http://127.0.0.1:10000` blob origin and must point to a reachable **Azurite blob endpoint**, preserving `/devstoreaccount1/...`; it is not the admin URL. Configure the device's development HTTP/network settings as needed.

## Stop

Stop the API/frontend with Ctrl-C, then from `api` run:

```bash
npm run local:stop
```

Run `npm run local:setup` to restart the same data. To start with a completely empty local workspace, stop the services before deliberately removing `.local/data/`; this permanently removes only your local applications, packages and telemetry.

References: [Azurite Docker persistence](https://learn.microsoft.com/en-us/azure/storage/common/storage-install-azurite), [Redis TLS](https://redis.io/docs/latest/operate/oss_and_stack/management/security/encryption/).
