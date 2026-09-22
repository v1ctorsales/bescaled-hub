# BeScaled Hub — backend

Express API backed by **SQLite**, accessed through **Prisma**. The public API
(routes, request/response shapes) is documented by the code in `src/routes/` and
`src/controllers/`; the data model lives in `prisma/schema.prisma`.

## Setup

```bash
npm install
cp .env.example .env            # then fill in GOOGLE_CLIENT_ID and JWT_SECRET
npx prisma migrate deploy       # creates backend/prisma/data.db from prisma/migrations
npx prisma db seed              # admin emails (upsert) + 6 sample companies (skipped if the DB isn't empty)
npm run dev                     # http://localhost:3001
```

While changing the schema, use `npx prisma migrate dev --name <change>`.
`DATABASE_URL` paths are relative to `prisma/schema.prisma`, so `file:./data.db`
is `backend/prisma/data.db`.

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
In production with the frontend on a different site, the cookie needs `SameSite=None; Secure`
(or serve both under one site) — revisit `src/utils/session.js` when deploying.

## Layout

- `prisma/schema.prisma` — data model · `prisma/migrations/` — committed SQL migrations
- `prisma/seed.js` + `prisma/seed-data.json` — sample data
- `src/db/prismaClient.js` — the single shared `PrismaClient`
- `src/db/companySerializer.js` — turns DB rows back into the API's JSON shapes
- `src/utils/validation.js` — request-body validation (rejects with `400` before touching the DB)

## Security notes

- The `.db` file and `.env` are git-ignored — never commit them.
- **Production:** the `.db` file (and its `-journal`) must be readable/writable
  **only by the OS user running the backend** (e.g. `chmod 600`, directory `700`),
  and must never live in a folder served as static files.
- Unexpected errors (including Prisma/SQLite failures) are logged server-side only;
  clients get a generic `500 {"error":"Internal server error"}`.
- All queries go through Prisma Client (parameterized) — no raw SQL.
- The process disconnects Prisma on `SIGINT`/`SIGTERM` so no stale lock/journal is left.
