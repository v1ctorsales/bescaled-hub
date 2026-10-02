# BeScaled Hub — VPS deploy (in progress)

Self-hosted alternative to the Supabase/Cloud Run + Vercel setup, being
prepared on a Zone.ee VPS with Docker. **Not cut over yet** — Vercel
(frontend) and Cloud Run/Supabase (backend) remain live in production, in
parallel, until that's confirmed working here and switched over deliberately;
see `backend/README.md`.

## Domains

Two separate hostnames, both DNS A records pointing at the VPS
(`217.146.76.252`), serving different things:

- **`uvn-76-252.tll01.zonevs.eu`** — the hostname Zone.ee (the VPS host)
  provided. Backend only (`/api/...` isn't actually under a path here — this
  domain *is* the API, same as before).
- **`bescaled-batches.tlu.ee`** — the university's official domain, now live.
  Serves the frontend's static build, and proxies `/api/*` to the backend —
  both under one origin, so the browser talks to the API same-site/same-origin,
  no proxy-for-CORS trick needed (unlike the Vercel + Cloud Run setup, which
  needed `frontend/vercel.json`'s rewrite specifically to get that).

Each is its own block in `Caddyfile`. The Zone.ee one stays as a
backend-only fallback/debug entry point; day-to-day use once cut over is
meant to be through the university domain.

## Stack

`docker-compose.yml` (project root) runs four services on the VPS:

- **`db`** — Postgres 16, data in the named volume `pgdata` (persists across
  `docker compose down`/`up`; only `docker compose down -v` would drop it).
- **`app`** — the backend, built from `backend/Dockerfile`. Published only on
  `127.0.0.1:3001` — reachable from inside the VPS (e.g. `curl
  http://localhost:3001/api/auth/me`) for debugging, but not from the
  internet. No direct, unencrypted, unproxied access to it exists.
- **`frontend-build`** — builds the frontend (`frontend/Dockerfile.build`,
  `npm run build`) and copies `dist/` into the named volume `frontend_dist`.
  Doesn't stay running — it builds, copies, and exits; `caddy` depends on it
  with `condition: service_completed_successfully`, so Caddy only starts once
  that copy has actually finished. The build doesn't set `VITE_API_BASE_URL`:
  the fallback already in `frontend/src/services/apiConfig.js` (relative
  `/api`) is exactly right here, since frontend and API are served from the
  same origin on `bescaled-batches.tlu.ee`. It does pass
  `VITE_GOOGLE_CLIENT_ID` as a build arg, from the same `GOOGLE_CLIENT_ID`
  the backend already reads — one value, used both places, not a second
  variable.
- **`caddy`** — reverse proxy/static file server, and the only service with
  ports open to the internet (80/443). Mounts `frontend_dist` read-only to
  serve the frontend's build (with SPA fallback — any unmatched path falls
  back to `index.html`, so deep links like `/login` work) and proxies
  `/api/*` to `app:8080` on the university domain; proxies everything to
  `app:8080` on the Zone.ee domain. Requests and renews its own HTTPS
  certificates from Let's Encrypt automatically, per domain — nothing manual
  (Certbot, etc.) is involved. Certs/state live in the named volumes
  `caddy_data`/`caddy_config`; without those persisting, every
  `docker compose up` would re-request a certificate and eventually hit
  Let's Encrypt's rate limit.

## Setup (on the VPS)

```bash
cp .env.example .env   # fill in real values; .env is git-ignored, never commit it
docker compose up -d --build
```

`.env.example` lists every variable `docker-compose.yml` needs. `SITE_DOMAIN`
is only the Zone.ee hostname (`uvn-76-252.tll01.zonevs.eu`) — the university
domain is hardcoded in `Caddyfile` instead, since (unlike the Zone.ee one) it
isn't expected to change again.

Rebuilding just the frontend after a change (without restarting `db`/`app`):

```bash
docker compose up -d --build frontend-build
```

(`caddy` picks up the new files on its own — they land in the same
`frontend_dist` volume it already has mounted; no need to restart `caddy`
unless `Caddyfile` itself changed.)

## Layout

- `docker-compose.yml` — the four services above
- `Caddyfile` — both domains' Caddy config
- `frontend/Dockerfile.build` — builds the frontend's static files only (no
  server; see `frontend-build` above)
- `.env.example` — every variable the compose file reads (copy to `.env`)
