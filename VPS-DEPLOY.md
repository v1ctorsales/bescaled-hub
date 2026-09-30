# BeScaled Hub — VPS deploy (in progress)

Self-hosted alternative to the Supabase/Cloud Run setup, being prepared on a
Zone.ee VPS with Docker. **Not cut over yet** — Supabase and Cloud Run remain
the live production backend until that happens; see `backend/README.md`.

## Stack

`docker-compose.yml` (project root) runs three services, on the VPS:

- **`db`** — Postgres 16, data in the named volume `pgdata` (persists across
  `docker compose down`/`up`; only `docker compose down -v` would drop it).
- **`app`** — the backend, built from `backend/Dockerfile`. Published only on
  `127.0.0.1:3001` — reachable from inside the VPS (e.g. `curl
  http://localhost:3001/api/auth/me`) for debugging, but not from the
  internet. No direct, unencrypted, unproxied access to it exists.
- **`caddy`** — reverse proxy in front of `app`, and the only service with
  ports open to the internet (80/443). Caddy requests and renews its own
  HTTPS certificate from Let's Encrypt automatically — nothing manual
  (Certbot, etc.) is involved. Certs/state live in the named volumes
  `caddy_data`/`caddy_config`; without those persisting, every `docker
  compose up` would re-request a certificate and eventually hit Let's
  Encrypt's rate limit.

Public access: **`https://$SITE_DOMAIN`** (see below) → Caddy → `app:8080`
inside the Docker network.

## Setup (on the VPS)

```bash
cp .env.example .env   # fill in real values; .env is git-ignored, never commit it
docker compose up -d --build
```

`.env.example` lists every variable `docker-compose.yml` needs, including
`SITE_DOMAIN` — the public hostname Caddy serves and gets a certificate for.
It's currently the hostname Zone.ee provided
(`uvn-76-252.tll01.zonevs.eu`, pointing at `217.146.76.252`); when the
university's official domain is ready, **changing `SITE_DOMAIN` in `.env` is
the only change needed** — it's not hardcoded anywhere else (`Caddyfile`
reads it as `{$SITE_DOMAIN}`, substituted by Caddy at startup). After
changing it, that domain's DNS needs to point at the VPS before Caddy can get
a cert for it, and a `docker compose up -d` (to recreate `caddy` with the new
env var) is needed for it to take effect.

## Layout

- `docker-compose.yml` — the three services above
- `Caddyfile` — Caddy's config (one `reverse_proxy` block)
- `.env.example` — every variable the compose file reads (copy to `.env`)
