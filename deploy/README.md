# CodePush on AKS

## Topology and compatibility

All application resources use namespace `code-push`.

| Environment | API deployment | App deployment | Application pods |
| --- | --- | --- | --- |
| UAT | `uat-codepush-api` | `uat-codepush-app` | 2 |
| Prod | `prod-codepush-api` | `prod-codepush-app` | 2 |

Running both environments in one cluster uses four application pods. Each Deployment has one replica and uses `Recreate`, so an image update does not introduce a surge pod. Replacements cause a brief interruption. Redis, Azure Storage, the HTTPS Gateway, and its controller are external/shared infrastructure; these manifests do not create them or add sidecars.

Each environment must have a different hostname, Azure Storage account and Redis instance. The server uses fixed Redis databases and unprefixed keys, so sharing Redis between environments is not supported. UAT must never point to production storage or credentials. For the production cutover, retain the hostname, storage, deployment keys, OAuth settings, and public blob URLs already used by production apps. Do not copy/recreate the application database or rotate client deployment keys as part of this deployment.

The API keeps its acquisition routes, management routes, OAuth callbacks, storage schema and access-key validation. Additions are `GET /health/live`, `GET /auth/msal/config` and `POST /auth/token`. The UI consumes the existing management API. Requests are routed without rewriting:

- `https://<host>/admin` and `/admin/*` → app pod.
- All other paths → API pod, including `/v0.1/*`, `/updateCheck`, `/reportStatus/*`, `/apps`, `/auth/*` and `/accesskey`.
- SDK and CLI server URLs use the origin, without `/admin`.

## Infrastructure prerequisites

Use an existing AKS cluster, ACR, separate Azure Storage/Redis instances, DNS and an HTTPS Gateway API listener. Attach ACR to AKS (or configure your platform's registry pull identity). The Azure identity used by CI needs permission to push ACR images, read AKS credentials, and manage these application resources. Private clusters need a runner with network access to AKS.

The HTTPRoute attaches to `GATEWAY_NAME` in `GATEWAY_NAMESPACE`, listener `GATEWAY_LISTENER` (default `https`). That listener must terminate TLS for the environment hostname and allow HTTPRoutes from namespace `code-push`. For a Gateway in another namespace, use an appropriate `allowedRoutes.namespaces` selector or policy. The route's backend Services stay in `code-push`. Configure DNS and certificate management on the shared Gateway; no per-application ingress controller is installed.

AKS application routing supports Gateway API. New installations should use a supported Gateway implementation: the managed NGINX ingress support bridge ends in November 2026. See [AKS Gateway API routing](https://learn.microsoft.com/en-us/azure/aks/app-routing-gateway-api). NGINX inside the app container is just the static file server.

The Gateway must forward the original paths, query strings, request bodies and client forwarding headers. The API trusts one proxy hop in these manifests. Adjust `TRUST_PROXY_HOPS` to your actual trusted proxy chain. Support release uploads up to 200 MB and long release requests. The HTTPRoute sets an API request timeout of 600 seconds; confirm your Gateway implements this field. The API readiness probe `/health` requires both Storage and Redis; `/health/live` checks the process without restarting it for an external service outage.

## Microsoft Entra configuration

Use separate Entra registrations per environment where possible:

1. **API registration:** expose a delegated scope such as `api://<api-client-id>/access_as_user`. Set `api.requestedAccessTokenVersion` to **2**. The token audience (`MSAL_API_AUDIENCE`) is the API registration's client ID for v2 access tokens.
2. **Admin SPA registration:** configure `https://<host>/admin/auth` as a **Single-page application** redirect URI. Add the API's delegated scope and grant admin consent. Set the logout return URL as appropriate for `https://<host>/admin/signed-out`. Set `MSAL_CLIENT_ID` to this registration's client ID.
3. **CLI registration:** configure a public client, enable public client/device code flows, add the same delegated API scope and grant consent. Set `MSAL_CLI_CLIENT_ID`. You may reuse the SPA registration if it also permits public client flows; otherwise keep them separate.
4. Set `MSAL_TENANT_ID` to the concrete tenant GUID. `common` and multi-tenant issuers are not accepted by the new exchange endpoint.
5. Optionally expose an API user app role and set `MSAL_REQUIRED_ROLE` to its value. Assign users/groups to that role. The token must then include it. Also use enterprise application assignment policies to restrict who can sign in.

The browser initializes MSAL, processes redirect responses and attempts silent token acquisition. It redirects to Microsoft automatically when interaction is needed; there is no initial login button. Denial/configuration errors stop and show a retry action. The browser exchanges the delegated Entra access token for a normal CodePush session, held in sessionStorage, and renews it as needed. Sign-out uses Entra logout. There is no browser client secret or arbitrary API-server selector.

The exchange validates the signature, v2 issuer, tenant, audience, expiry, delegated scope, immutable object ID, and allowed SPA/CLI client IDs. App-only tokens and ID tokens are not accepted. Existing accounts must already link to the same Azure AD `oid` or the same API-audience `sub`; **email alone cannot link accounts**. Reuse the existing Azure AD/API registration when retaining subject-based legacy links. If a legacy subject differs after an app registration change, migrate the verified provider binding explicitly before cutover; do not overwrite identities based solely on email.

`ENABLE_ACCOUNT_REGISTRATION=false` in the AKS configuration prevents unregistered accounts from being created. For a new installation, deliberately enable registration for initial assigned users, sign in, and then disable it again through your managed configuration. For an existing installation, preserve registered identities and provider bindings. Legacy OAuth credentials can remain in the environment Secret and legacy CLI login continues working.

`MSAL_SESSION_TTL_SECONDS` defaults to 28,800 (8 hours), and accepts 300–5,184,000 seconds. The endpoint returns the standard access key as `accessToken`, its `tokenType`, `expiresIn` and `expiresAt`. The response also includes `sessionName` so the browser can revoke its key on renewal and sign-out. Entra authorization is checked when the key is issued; subsequent requests use existing CodePush key validation until expiry or revocation. Keep a short session lifetime if timely Entra access revocation matters.

## Kubernetes Secrets

Create `code-push`, then provision `uat-codepush-secrets` and `prod-codepush-secrets` through your normal secret manager. Each is an Opaque Secret with at least:

```text
AZURE_STORAGE_ACCOUNT=<environment storage account>
AZURE_STORAGE_ACCESS_KEY=<environment storage access key>
REDIS_HOST=<environment Redis host>
REDIS_KEY=<environment Redis access key>
```

Redis uses TLS and port 6380 by default, and must support database 1 (`SELECT 1`), which this server uses for metrics. Keep using a compatible existing Redis service. Override `REDIS_PORT` in the Secret if your service uses another TLS port. Retain legacy `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, `MICROSOFT_TENANT_ID`, `GITHUB_CLIENT_ID`, and `GITHUB_CLIENT_SECRET` in prod if those providers are in use. Avoid putting credentials in committed YAML or GitHub variables. Leave `EMULATED` and `HTTPS` unset in AKS: the existing server treats their presence as enabled, including a string value of `false`. TLS terminates on the Gateway.

For local/manual provisioning, an environment file can be passed to `kubectl create secret generic <environment>-codepush-secrets --from-env-file=<secure-file> -n code-push`. Keep that file outside the repository. Existing production secrets/data are not migrated by this repository.

## GitHub Actions pipeline

Configure GitHub Environments named `uat` and `prod`. Protect `prod` with required reviewers and allowed deployment branches. Configure an Azure federated identity for each GitHub Environment (`repo:<owner>/<repo>:environment:<environment>`); no Azure client secret is needed.

Set these **environment variables** in GitHub:

| Variable | Purpose |
| --- | --- |
| `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID` | CI workload identity |
| `ACR_NAME` | Registry resource name |
| `AKS_RESOURCE_GROUP`, `AKS_CLUSTER_NAME` | Destination cluster |
| `PUBLIC_HOST` | Environment hostname, without protocol/path |
| `GATEWAY_NAME`, `GATEWAY_NAMESPACE` | Existing HTTPS Gateway |
| `GATEWAY_LISTENER` | HTTPS listener name; defaults to `https` |
| `MSAL_CLIENT_ID` | SPA client ID |
| `MSAL_CLI_CLIENT_ID` | CLI public client ID; defaults to SPA client ID |
| `MSAL_TENANT_ID` | Tenant GUID |
| `MSAL_API_AUDIENCE` | API token audience |
| `MSAL_API_SCOPE` | Full delegated scope URI |
| `MSAL_REQUIRED_ROLE` | Optional API user role |

The `Build and deploy CodePush to AKS` workflow builds both images on changes to `main` and deploys **UAT**. Manual runs select `uat` or `prod`. Supply `image_tag` with an existing full commit SHA to promote an already-built pair of images without rebuilding. Tags resolve to image digests before deployment. Protect release tags from overwrites using your registry policy and retain both images for rollback.

The job checks the Secret and Gateway, renders public settings, runs a Kubernetes server-side dry run, applies manifests, waits for both Deployments and route acceptance, then checks the public API and `/admin/`. A failed rollout or health check fails the job. It does not automatically roll back or modify application data.

To roll back an image release, manually run the workflow with the previous successful commit SHA. This restores API and app images together; public configuration still comes from the chosen GitHub Environment.

## Manual rendering

Use Python 3 and `kubectl` with Kustomize. Export the public settings listed above and `API_IMAGE` / `APP_IMAGE` as complete image references, preferably digests, then:

```bash
bash deploy/render.sh uat > /tmp/codepush-uat.yaml
kubectl apply --dry-run=server -f /tmp/codepush-uat.yaml
kubectl apply -f /tmp/codepush-uat.yaml
kubectl get pods -n code-push -l environment=uat
```

Substitution happens **before** Kustomize computes ConfigMap hashes, so changing public authentication settings rolls the API. Services and HTTPRoute backend references include the environment prefix, preventing UAT/prod cross-routing. Public settings are not secrets. ConfigMap generations remain for rollout history; clean up old unreferenced generations according to your cluster retention policy.

## Telemetry

The overview reads existing per-release metrics, aggregates downloads, successful installs, failed installs and active devices, and computes install/download and failure ratios. The API does not store dated download history. The UI therefore shows cumulative recorded activity and an observed downloads/minute rate between successful refreshes in the current browser session. Rate resets when the target set or metric labels change, counters decrease, or any deployment fails to load. It does not invent historical graphs. Redis must persist its metrics database if counters should survive Redis replacement.
