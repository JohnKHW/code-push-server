# CodePush Admin

The React admin workspace is served at `/admin`. Microsoft Entra sign-in redirects automatically using MSAL, and exchanges a delegated API token for a standard CodePush session. The same container image works in UAT and prod; runtime public configuration comes from `GET /auth/msal/config` on the same host.

The workspace includes real delivery telemetry, applications, release uploads, rollout and pause controls, promotion, rollback, collaborators, and access-token management. Data flows through services → Zustand stores → components.

## Develop

```bash
cd app
npm ci
npm run dev
```

Open `http://localhost:4000/admin/`. Vite proxies `/api` to `http://localhost:3000` by default. Set `API_PROXY_TARGET` in `app/.env.local` to change the local development target. Register `http://localhost:4000/admin/auth` as a SPA redirect URI for development, and configure the API's `MSAL_*` variables. No credentials or production API hostname are embedded in the frontend.

```bash
npm run lint
npm run build
```

`npm run preview` serves the built static files, but does not proxy API requests; use Vite dev or a local reverse proxy for authenticated development.

See [AKS deployment and Entra setup](../deploy/README.md) for UAT/prod configuration, Azure prerequisites, GitHub Actions, Secret requirements, and compatibility details.
