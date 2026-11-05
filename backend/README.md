# BeScaled Hub API

Express API using Prisma and PostgreSQL. Start with the [root setup guide](../README.md); see [architecture](../docs/ARCHITECTURE.md) for frontend state and assessment semantics, [VPS deployment](../VPS-DEPLOY.md) for Docker, and [cloud configuration](../docs/CLOUD-DEPLOY.md) for Vercel/Cloud Run.

## Direct local setup

Run these commands from `backend/`. Create `.env` only if it does not already exist, then replace its placeholders before generating or migrating:

```bash
npm ci
cp -n .env.example .env
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

`npm run dev` uses Node’s watch mode; `npm start` runs normally. Unlike the container entrypoint, these commands do not automatically migrate or seed. The default port is 3001. There is no endpoint at `/`; use `/api/auth/me` to check API reachability (401 is expected without a session).

## Environment

| Variable | Behavior |
| --- | --- |
| `DATABASE_URL` | PostgreSQL URL used by both Prisma Client and Prisma Migrate; required for database operations |
| `GOOGLE_CLIENT_ID` | Required at server startup; audience for Google ID token verification |
| `JWT_SECRET` | Required at server startup; private signing key for eight-hour sessions |
| `PORT` | Default `3001`; Compose passes `8080` |
| `FRONTEND_ORIGIN` | One allowed browser origin for credentialed CORS; default `http://localhost:5173` |
| `ADMIN_EMAILS` | Semicolon-separated emails added by `prisma db seed`; not consulted directly on each login |
| `SLACK_USER_TOKEN` | Optional `xoxp-` user OAuth token for the shared Slack connection |
| `NODE_ENV` | `production` enables Secure session cookies; production needs HTTPS at the proxy |

`server.js` loads `.env` from the current working directory. Run direct backend commands from this directory. Root `.env` supplies Docker Compose instead. `GOOGLE_CLIENT_SECRET` and `DIRECT_URL` are not used by the current code/schema.

## Database and seeding

The schema uses one `DATABASE_URL` without a `directUrl`. Self-hosted PostgreSQL in Compose is a plain connection. If using managed PostgreSQL, choose a connection URL that supports Prisma migrations as well as runtime queries; old instructions for separate Supabase pooled/direct URLs no longer describe this schema.

- `prisma/schema.prisma`: model definitions.
- `prisma/migrations/`: committed SQL migrations, including the initial PostgreSQL schema.
- `src/db/prismaClient.js`: shared application Prisma Client.
- `src/db/companySerializer.js`: normalized rows to nested API JSON.
- `prisma/seed.js` and `seed-data.json`: admin provisioning and six sample companies.

On each seed, administrator emails are trimmed, lowercased, and upserted. **Removing an email from `ADMIN_EMAILS` does not remove its database row.** Admin revocation requires a deliberate database change, and existing JWT sessions can remain valid until expiry.

Sample companies are created only when the Company table is empty. If any company exists, all sample company seeding is skipped. Startup does not reset existing assessment data. An empty database receives the samples even when intended for production; plan initial data provisioning accordingly. There is no force-reseed or sample-data-disable flag. Sample rows use explicit IDs from JSON; when preparing an empty database, verify the Company ID sequence before adding new records.

For schema development, run against a development database:

```bash
npx prisma migrate dev --name describe_change
```

Commit the schema and resulting SQL migration together. Apply committed migrations with `npx prisma migrate deploy` in deployment. The container’s `start.sh` runs migration deploy, seed, then the server on every start; `set -e` stops startup if either preceding step fails.

## Authentication and authorization

`POST /api/auth/google` accepts `{ "credential": "<Google ID token>" }`. Verification checks the configured audience and verified email. `AdminEmail` takes priority; otherwise the first matching `CompanyLoginEmail` identifies the company. Unknown emails get 403.

The public session shape is `{ role, name, email, avatar, companyId }`. The JWT remains in an HTTP-only `bescaled_session` cookie, using HS256, an eight-hour TTL, `SameSite=Lax`, path `/`, and Secure in production. `GET /api/auth/me` returns the session or 401; `POST /api/auth/logout` clears the cookie. Requests must include the cookie (`credentials: "include"` in browser fetch).

All company routes require authentication. Admins can access all companies; company users can access only their signed company ID. Company creation, settings, deletion, the directory, batch dates, and Slack are admin-only. `/companies/current` is for company sessions; admins have no current company and receive 404. Permissions are stored in session claims until expiry, rather than rechecked against email tables on every request.

## API reference

All paths below start with `/api`. Successful JSON responses use the named object/array directly, without a common envelope. Errors use `{ "error": "message" }`. Company objects include `id`, `name`, `contactEmail`, `subscribed`, the two filled flags, and nested `settings`, `readinessLevels`, `maturityAnswers`, `guideProgress`.

### Authentication

| Method and path | Request | Response |
| --- | --- | --- |
| `POST /auth/google` | `{ credential }` | Public session and session cookie |
| `GET /auth/me` | None | Public session |
| `POST /auth/logout` | None | `{ success: true }` and cleared cookie |

### Companies

| Method and path | Access | Request / response |
| --- | --- | --- |
| `GET /companies` | Admin | Array of full company objects |
| `GET /companies/current` | Company | Own full company object |
| `GET /companies/:id` | Admin or own company | Full company object |
| `POST /companies` | Admin | `{ name, contactEmail, loginEmails?, description?, batch? }` → created company, 201 |
| `PATCH /companies/:id/settings` | Admin | `{ loginEmails, description, batch }` → updated company (all three required) |
| `DELETE /companies/:id` | Admin | Deletes company and child assessment/login rows; 204 |

Names must be non-empty and at most 200 characters; emails at most 254. Descriptions allow up to 2,000 characters. Login emails are normalized and limited to three; duplicates or emails assigned to an admin/another company are rejected (conflicts return 409). Creation defaults an empty login list to the contact email, description to empty, batch to 1. Updating settings with an empty login list removes company login access. The UI requires a description even though the API permits empty text. The settings UI does not edit company name, contact email, or subscribed status.

### Readiness and guide progress

All paths in this table are beneath `/companies/:id`; access is admin or that company.

| Method and path | Request / response |
| --- | --- |
| `GET /readiness-level` | Nested period → metric → score object |
| `PATCH /readiness-level` | `{ year, metric, value }` → updated scores; sets filled flag |
| `PUT /readiness-level` | `{ readinessLevels, guideProgress }` → `{ readinessLevels, guideProgress, filled: true }` |
| `GET /readiness-level/filled` | `{ filled }` |
| `GET /guide-progress` | Object keyed like `CRL:1:0` |
| `PATCH /guide-progress` | `{ metric, level, bulletIndex, status? }` → updated guide object |

Allowed periods are `10/2026`, `02/2027`, `09/2027`; metrics are CRL, TRL, BRL, IPRL, TmRL, FRL. Scores must be integers 0–9, levels 1–9, bullet indexes 0–99. Guide statuses are `achieved`, `not-achieved`, `not-applicable`. The server validates bounds, not actual rubric bullet existence.

The company UI uses the whole-form PUT. Scores supplied are upserted; omitted score cells remain. Guide progress is a replacement snapshot (up to 500 entries): omitted keys are deleted. Both save atomically and mark readiness as filled; this is not a completeness check.

The standalone guide PATCH is a toggle: omitting/nulling status or repeating the current status clears the row. It does not set the readiness filled flag.

Example whole-form body (a partial score map is valid):

```json
{
  "readinessLevels": { "10/2026": { "CRL": 2, "TRL": 3 } },
  "guideProgress": { "CRL:1:0": "achieved" }
}
```

### AI maturity

All paths below are beneath `/companies/:id`; access is admin or that company.

| Method and path | Request / response |
| --- | --- |
| `GET /maturity-test` | `{ answers, filled }`; answers nested by dimension/stage |
| `PATCH /maturity-test/answers` | `{ dimensionId, stageId, patch: { score?, comment?, dontUnderstand? } }` → updated answers |
| `POST /maturity-test/submit` | No body needed → `{ filled: true }` |

Scores are integers 0–4; comments are at most 5,000 characters; `dontUnderstand` is boolean. Dimension/stage IDs must be lowercase slugs up to 64 characters; their membership in the frontend rubric is not checked. Submit sets the flag without checking all items and does not lock edits.

### Batches

Admin-only `GET /batches` returns nine entries `{ batch, startDate, endDate }`, with unset dates null. `PUT /batches` accepts `{ batches: [{ batch: 1, startDate: "10/2026", endDate: "09/2027" }] }` and returns the updated nine-entry list. Only supplied batches change. Dates are optional MM/YYYY months in years 2000–2100, with end no earlier than start. Supplying both empty/null removes the saved schedule. Batch numbers are 1–9, each at most once per request. These dates do not change assessment reporting periods.

### Slack

Admin-only, using the shared server token:

| GET path | Query / response |
| --- | --- |
| `/slack/channels` | Accessible conversation array, including type and membership |
| `/slack/channels/:channelId/messages` | `cursor?`, `limit?` (1–100, default 50) → `{ messages, nextCursor }` |
| `/slack/channels/:channelId/replies` | Required thread `ts`, `cursor?`, `limit?` (1–100, default 100) → `{ messages, nextCursor }` |
| `/slack/channels/:channelId/files/:fileId` | Streams a file shared in the selected conversation |

Slack JSON/file responses set `Cache-Control: private, no-store`. The token stays server-side. Link cards use Slack metadata; the backend does not fetch arbitrary linked websites. Only supported Slack file URLs are proxied, following file/conversation association checks. Exports are browser-side operations built from these endpoints, not separate API routes.

## Slack configuration

Set `SLACK_USER_TOKEN` to the connected account’s user OAuth token (`xoxp-`). The app reads public/private channels and one-to-one/group DMs according to the account’s access and these scopes:

| Scope group | Required user scopes |
| --- | --- |
| Public channels | `channels:read`, `channels:history` |
| Private channels | `groups:read`, `groups:history` |
| Direct messages | `im:read`, `im:history` |
| Group direct messages | `mpim:read`, `mpim:history` |
| Author names | `users:read` |
| Shared files | `files:read` |

Reinstall the Slack app after scope changes. The connected user must belong to conversations for exports. The backend starts without Slack configured; Slack requests then return a configuration error. Local setup uses `backend/.env`; Compose uses root `.env`; cloud deployments should inject the token as a runtime secret. All portal admins see this connection, not their individual Slack accounts.

## Errors and request limits

Common statuses: 400 invalid input, 401 missing/invalid/expired session or Google credential, 403 forbidden, 404 missing resource, 409 login-email conflict, 429 rate-limited, 500 unexpected server error. Slack integration errors can also return 502 or 503. Unexpected details stay in server logs; malformed JSON returns a specific 400.

`src/middleware/rateLimit.js` applies a per-IP limit of **100 requests per 15 minutes** to `/api`, and **10 login requests per 15 minutes** to `/api/auth/google`. The limiter uses process-local memory, not shared database state. Answer autosaves and paginated Slack exports count toward the general limit. Slack itself can also return rate-limit errors; the current code does not automatically retry.

`app.set("trust proxy", 1)` trusts one reverse-proxy hop. Check the actual proxy topology before changing hosting or relying on client IP rate limits. CORS allows the configured `FRONTEND_ORIGIN` with credentials; it does not replace authentication. Same-origin production proxying supports Lax cookies without third-party-cookie dependencies. Never cache authenticated API responses at a shared proxy.
