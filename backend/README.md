# BeScaled Hub — backend

Express API backed by **Postgres** (hosted on [Supabase](https://supabase.com)),
accessed through **Prisma**. The public API (routes, request/response shapes)
is documented by the code in `src/routes/` and `src/controllers/`; the data
model lives in `prisma/schema.prisma`.

## Setup

```bash
npm install
cp .env.example .env            # fill in DATABASE_URL, DIRECT_URL, GOOGLE_CLIENT_ID, JWT_SECRET, ADMIN_EMAILS
npx prisma migrate deploy       # applies prisma/migrations to the database
npx prisma db seed              # admins from ADMIN_EMAILS (always synced) + 6 sample companies (first run only)
npm run dev                     # http://localhost:3001
```

While changing the schema, use `npx prisma migrate dev --name <change>`.

## Database

Postgres on Supabase, via two connection strings (both in `.env`, see
`.env.example` for the exact format):

- **`DATABASE_URL`** — pooled (Supavisor, transaction mode, port 6543). What
  the running app uses for every query.
- **`DIRECT_URL`** — used only by Prisma Migrate (`migrate dev`/`migrate deploy`),
  which needs session-level features the transaction pooler doesn't support.
  Supabase's actual direct host (`db.<project-ref>.supabase.co:5432`) is
  IPv6-only; if your network can't reach it (this was the case running
  locally during this setup), use the **Session pooler** instead — same
  pooler host as `DATABASE_URL`, port 5432, no `?pgbouncer=true`.

Unlike the SQLite setup this replaced, the database is **persistent** — it
survives restarts and redeploys instead of resetting every time. `prisma/seed.js`
still runs on every container start (see `start.sh`), but its two halves
behave differently precisely because of that:

- **Admins are always synced** from `ADMIN_EMAILS` (upsert by email, never
  deletes a row) — safe to re-run on every start, so it just runs every time.
- **Sample companies are seeded once** — only the first time the seed runs
  against an empty `Company` table (a brand-new database). Once any company
  exists, every later run skips company seeding entirely (logs "Companies
  already exist — skipping company seed."), so real edits and real companies
  are never reset by a deploy or restart. There's no flag or command to force
  a reseed — to repopulate a test environment, run `npx prisma db seed`
  against an empty database.

## Authentication

Google sign-in (ID-token flow). The frontend sends the Google ID token to
`POST /api/auth/google`; the backend verifies it against `GOOGLE_CLIENT_ID`, then:

- email in `AdminEmail` → role `admin`
- else email in `CompanyLoginEmail` → role `company` (with that `companyId`)
- else → `403`, no session

The session is a JWT (signed with `JWT_SECRET`, 8h) in an httpOnly, `SameSite=Lax`
cookie (`Secure` when `NODE_ENV=production`). Only `{ role, name, email, avatar, companyId }`
is returned in bodies. `GET /api/auth/me` reads the session; `POST /api/auth/logout` clears it.

Everything under `/api/companies` requires a session: admins can use every route,
company users only the routes for their own company (`/current`, `/:id`, `/:id/...`).
Admins are managed in the `AdminEmail` table (seeded in `prisma/seed.js`); company login
emails are edited in the admin UI and stored lowercase.

`GOOGLE_CLIENT_SECRET` is not used (no authorization-code exchange). Never commit it or `JWT_SECRET`.

## Slack discussions (admin-only)

The admin dashboard has a read-only Slack discussions page at `/admin/slack`.
The backend calls Slack's Web API; the user token never reaches the browser.
Configure `SLACK_USER_TOKEN` as a backend secret. The admin page fetches the
user's accessible channels and DMs first, and only requests a conversation's messages
after an admin selects it. Every Slack endpoint requires an admin session.
Admins can export a conversation's complete message history, thread replies, and
attached files as a ZIP containing a styled PDF transcript and the original
files. The transcript includes clickable link cards and thumbnails for
supported image attachments.

For a Slack sandbox workspace, configure a Slack app with these user token
scopes, install it to the workspace, and provide the resulting user OAuth
token (`xoxp-`) as `SLACK_USER_TOKEN`:

- `channels:read` and `channels:history` for public channels
- `groups:read` and `groups:history` for private channels
- `im:read` and `im:history` for one-to-one DMs
- `mpim:read` and `mpim:history` for group DMs
- `users:read` to display message authors' names
- `files:read` to retrieve file details and download shared files

Links included in message text and Slack attachment metadata are returned
as link cards using Slack-provided titles and descriptions; linked sites are
not fetched for previews. PDF, PPTX, DOCX, image, and MP4 attachments are
previewed inline. File downloads are proxied through the authenticated backend
and are limited to files shared in the selected conversation; the user token
is never sent to the browser.

Public/private channels and one-to-one/group DMs are listed according to the
user token's scopes. The Slack user who authorized the token must have access
to a conversation to read its messages. After changing scopes, reinstall the
app to the workspace so the user token receives the updated permissions. For
the Docker Compose deployment, put the token in the repository-root `.env`
(ignored by Git), then rebuild/restart the backend with
`docker compose up -d --build app frontend-build` so both the backend API and
admin page are updated. For direct local backend development, put the token in
`backend/.env`. In Cloud Run, add the token to Secret Manager and expose it to
the backend as `SLACK_USER_TOKEN`.
The integration is optional, so the backend can run without these settings,
but the Slack page will report that it is not configured.

## Proxy (Vercel rewrite)

The frontend never calls this backend's Cloud Run URL directly from the
browser. `frontend/vercel.json` rewrites `/api/*` on the frontend's own domain
to the Cloud Run backend, server-side (Vercel → Cloud Run, no CORS involved —
the browser never sees the Cloud Run domain at all). As far as the browser is
concerned, the API is same-site with the page, which is what lets the session
cookie use `SameSite=Lax` in every environment instead of `SameSite=None`.

This exists because `SameSite=None` (required for a real cross-site cookie,
frontend on `vercel.app` calling a backend on `run.app`) was causing
intermittent login failures in production: some browsers' cross-site tracking
protections (Safari ITP most notably, but not only there) can silently drop
or block that kind of cookie in ways that aren't fully predictable — a login
would succeed, then the very next request would come back `401` seconds
later, non-deterministically. Routing through a same-site proxy removes the
whole class of problem instead of working around it browser by browser.

Two things this changes:

- The frontend calls a relative path (`/api`) in production, not the Cloud
  Run URL — see `VITE_API_BASE_URL` in `frontend/.env.example`.
- `frontend/vercel.json`'s rewrite carries an
  `x-vercel-enable-rewrite-caching: 0` header on `/api/*`. Vercel caches
  rewritten responses that carry upstream cache headers by default; this API
  is entirely session-scoped and per-company, so caching any of it — even by
  accident — could leak one user's data to another. Keep that header even if
  the backend never sends explicit cache headers today.

`backend/src/app.js`'s CORS (`cors({ origin: FRONTEND_ORIGIN, credentials:
true })`) is untouched and still relevant for local dev (frontend calls the
backend directly there) and for manual testing (curl/Postman) — it's just no
longer what real browser traffic in production relies on, since that traffic
now looks like Vercel calling Cloud Run server-to-server.

## Layout

- `prisma/schema.prisma` — data model (Postgres) · `prisma/migrations/` — committed SQL migrations
- `prisma/seed.js` + `prisma/seed-data.json` — sample data
- `src/db/prismaClient.js` — the single shared `PrismaClient`
- `src/db/companySerializer.js` — turns DB rows back into the API's JSON shapes
- `src/utils/validation.js` — request-body validation (rejects with `400` before touching the DB)

## Deploy (Cloud Run)

Source-based deploy (`--source .`) — builds and runs `backend/Dockerfile`, whose
entrypoint (`start.sh`) applies migrations, seeds the database and starts the
server on every container start. Non-secret config is passed via
`--env-vars-file` rather than `--set-env-vars`: a single `--set-env-vars`
string couldn't carry `ADMIN_EMAILS` correctly (the `@` and `;` in its value
collided with that flag's own comma-separated format).

Before your first deploy, create `backend/env-vars.yaml` (git-ignored — not
versioned, since it holds real admin emails; every deployer creates their own
copy) from this example, filling in `ADMIN_EMAILS`:

```yaml
NODE_ENV: production
GOOGLE_CLIENT_ID: "411205543016-jjfqjjttaplrt0ulnab649j41m9v1tm2.apps.googleusercontent.com"
FRONTEND_ORIGIN: "https://bescaled-hub.vercel.app"
ADMIN_EMAILS: "PREENCHER_MANUALMENTE"
```

`DATABASE_URL` and `DIRECT_URL` don't go in that file either — like
`JWT_SECRET`, `GOOGLE_CLIENT_SECRET`, and `SLACK_USER_TOKEN`, they contain
credentials, so they come from Secret Manager via `--set-secrets` (create the
corresponding secrets there first):

```bash
gcloud run deploy bescale-hub-backend \
  --source . \
  --region europe-west1 \
  --allow-unauthenticated \
  --max-instances=1 \
  --env-vars-file=env-vars.yaml \
  --set-secrets="JWT_SECRET=JWT_SECRET:latest,GOOGLE_CLIENT_SECRET=GOOGLE_CLIENT_SECRET:latest,DATABASE_URL=DATABASE_URL:latest,DIRECT_URL=DIRECT_URL:latest,SLACK_USER_TOKEN=SLACK_USER_TOKEN:latest"
```

`--max-instances=1` was a guard against multiple instances each getting their
own isolated SQLite file; Postgres handles concurrent connections from
several instances fine, so it's no longer strictly needed. Left as-is —
removing it is a call to make separately, not part of this change.

## Security notes

- `.env` and `backend/env-vars.yaml` are git-ignored — never commit them.
  `DATABASE_URL`/`DIRECT_URL` (like `JWT_SECRET`/`GOOGLE_CLIENT_SECRET`) hold a
  real password, and `SLACK_USER_TOKEN` is a credential; keep them in Secret
  Manager or a local `.env`.
- Unexpected errors (including Prisma/Postgres failures) are logged server-side
  only; clients get a generic `500 {"error":"Internal server error"}`.
- All queries go through Prisma Client (parameterized) — no raw SQL.
- The process disconnects Prisma on `SIGINT`/`SIGTERM` so connections close cleanly.
