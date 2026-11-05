# Docker and Caddy deployment

[Back to README](README.md) · [Cloud configuration](docs/CLOUD-DEPLOY.md)

This guide describes the configuration committed in the repository. It does not confirm deployment health, current DNS, or whether traffic has moved from the cloud stack. Check with the operator before changing an existing service.

## Topology

```text
Browser → HTTPS Caddy
  bescaled-batches.tlu.ee:
    /api/* → app:8080 → db:5432
    all other paths → /srv/frontend (SPA fallback to index.html)
  SITE_DOMAIN:
    all paths → app:8080
```

`SITE_DOMAIN` defaults in `.env.example` to the host-provided hostname; the university domain is a separate hardcoded block in `Caddyfile`. The backend-only hostname still uses `/api/...` paths; forwarding does not remove that prefix. `/` on that hostname returns the API’s JSON 404.

| Service | Purpose | Storage/network |
| --- | --- | --- |
| `db` | PostgreSQL **17** | `pgdata`; no published database port |
| `app` | Express API; migrates and seeds on startup | Private Docker network; debugging port `127.0.0.1:3001` forwards to 8080 |
| `frontend-build` | Builds Vite, copies static files, exits | `frontend_dist`, shared with Caddy |
| `caddy` | HTTPS, API proxy, static frontend | Public 80/443; persistent `caddy_data` and `caddy_config`; read-only frontend volume |

The API waits for database health. Caddy waits for the app to start and the frontend build/copy to complete successfully; this does not constitute an API readiness check.

## First deployment

Prerequisites: Docker with Compose v2 on the server, DNS for both configured hostnames pointing to it, and inbound ports 80/443 available to Caddy. Configure Google’s allowed JavaScript origins for the frontend address.

From the repository root, create `.env` only if it does not already exist:

```bash
cp -n .env.example .env
```

Fill all required values. Use URL-safe database password characters (or correctly encode credentials in connection URLs); Compose inserts the password directly into `DATABASE_URL`.

| Root variable | Used by |
| --- | --- |
| `POSTGRES_PASSWORD` | Database initialization and API database connection |
| `GOOGLE_CLIENT_ID` | API runtime and frontend build (`VITE_GOOGLE_CLIENT_ID`) |
| `JWT_SECRET` | API session signing |
| `FRONTEND_ORIGIN` | API CORS; set to the frontend origin, normally `https://bescaled-batches.tlu.ee` |
| `ADMIN_EMAILS` | API startup seed; semicolon-separated Google emails |
| `SLACK_USER_TOKEN` | Optional shared Slack user token, API only |
| `SITE_DOMAIN` | Backend-only Caddy hostname; the university hostname remains in Caddyfile |

Compose sets `NODE_ENV=production`, `PORT=8080`, and a database URL pointing to `db:5432`. The frontend defaults to relative `/api`, so the university site serves UI and API from the same origin. Frontend Google configuration is embedded at build time; rebuild it after client-ID changes.

Check syntax without printing interpolated secret values, then build/start:

```bash
docker compose config --quiet
docker compose up -d --build
docker compose ps -a
docker compose logs --tail=100 app caddy frontend-build
```

Expect `frontend-build` to exit successfully and the other services to stay running. Backend startup applies committed migrations and seeds. A new empty database receives six sample companies; existing companies are left untouched. See [database and seeding](backend/README.md#database-and-seeding) for provisioning details and admin-removal semantics.

## Verify the deployment

```bash
curl -I https://bescaled-batches.tlu.ee/login
curl -i https://bescaled-batches.tlu.ee/api/auth/me
```

Expect a successful frontend response and a JSON 401 for the unauthenticated session request. There is no dedicated health endpoint. An HTML response for `/api/auth/me` indicates a routing/configuration problem.

In a browser, verify Google admin sign-in, company listing, Admin help, and a direct refresh of `/admin/help`. Use a dedicated test company to check company sign-in, readiness saving, maturity autosave/submission, and report downloads. If configured, select a Slack conversation and try a small export. Test both roles because successful static serving does not prove cookie or database behavior.

## Updating

After updating the checkout, rebuild the affected services. For changes to both API and UI:

```bash
docker compose up -d --build app frontend-build
```

For frontend-only changes:

```bash
docker compose up -d --build frontend-build
```

New files are copied into the shared volume; Caddy serves them without restarting. The copy step is not an atomic release switch and does not remove old assets. Assess deployment timing if users are actively working.

After editing only `Caddyfile`, validate and reload it:

```bash
docker compose exec caddy caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
docker compose exec caddy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile
```

Changing root environment values requires recreating affected containers with `docker compose up -d` (and rebuilding the frontend if its client ID changed). In particular, an existing Caddy container needs recreation to pick up a new `SITE_DOMAIN`; a config reload alone does not update container environment variables.

Changing `POSTGRES_PASSWORD` in `.env` does not change the password in an already-initialized PostgreSQL volume. Plan a coordinated database credential rotation instead of assuming a restart applies it.

## Persistence and recovery

`pgdata` holds company and assessment data. `caddy_data` holds certificates and keys; `caddy_config` holds Caddy configuration state. `frontend_dist` contains generated frontend files. Ordinary container recreation retains these volumes. Do not use volume deletion as a routine restart or troubleshooting step: it can remove the database and certificate state.

No automatic backup or recovery workflow is supplied. Before migrations or a database move, take a database backup and verify its restore procedure in a separate environment. For a custom-format PostgreSQL dump from the running Compose database, replace the output path below with an existing secure backup directory outside the checkout:

```bash
docker compose exec -T db pg_dump -U bescaledhub -d bescaledhub -Fc > /path/to/secure-backups/bescaledhub-backup.dump
```

Store backups outside the checkout and server, with appropriate access controls. This dump does not include PostgreSQL roles or Caddy certificate state. Application report exports cannot restore the database.

## Troubleshooting

- **Caddy cannot issue a certificate:** check both hostnames’ DNS and inbound 80/443, then inspect Caddy logs. Keep certificate volumes across restarts.
- **502 from the API:** check app and database state/logs; migrations or seeding may have stopped startup.
- **Frontend deep links fail:** check that Caddy mounts `frontend_dist` and retains `try_files {path} /index.html` inside the frontend handler.
- **Login fails only in production:** check the Google client ID/origin, HTTPS, cookie behavior, and that `/api/*` is routed to the API before the SPA fallback.
- **Database password changed but login fails:** an existing PostgreSQL volume keeps the previously configured credential.
- **Slack missing or unauthorized:** check the runtime token and account scopes/membership using the [backend guide](backend/README.md#slack-configuration).
