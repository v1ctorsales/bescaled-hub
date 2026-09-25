# BeScaled Hub

Monorepo with two packages:

- `frontend/` — Vite + React (JavaScript) SPA.
- `backend/` — Node.js + Express API backed by Postgres on Supabase (via Prisma).
  Login is real Google OAuth (admins vs. company users). See `backend/README.md`.

## Running everything together

From the repo root:

```bash
npm run install:all   # installs both frontend/ and backend/ dependencies
npm run dev            # starts both at once (frontend on :5173, backend on :3001)
```

## Running one side at a time

```bash
cd frontend && npm install && npm run dev     # http://localhost:5173
cd backend  && npm install && npx prisma migrate deploy && npx prisma db seed   # first time only
cd backend  && npm run dev                    # http://localhost:3001
```

The frontend talks to the backend over HTTP via `frontend/src/services/`.
Each service file there is scoped to one domain (`authService.js`,
`companiesService.js`, `readinessLevelService.js`, `maturityTestService.js`)
and calls the matching route in `backend/src/routes/`. No component talks to
the backend directly — everything goes through those services.

## Environment variables

Copy the `.env.example` in each package to `.env` and adjust if needed:

- `frontend/.env.example` → `VITE_API_BASE_URL` (where the frontend expects the API) and `VITE_GOOGLE_CLIENT_ID`.
- `backend/.env.example` → `PORT`, `FRONTEND_ORIGIN` (for CORS), `DATABASE_URL`/`DIRECT_URL` (Postgres/Supabase), `GOOGLE_CLIENT_ID`, `JWT_SECRET` and `ADMIN_EMAILS`.

## Deploying

- **Frontend (Vercel):** set the project's **Root Directory** to `frontend/`.
- **Backend (Cloud Run):** see "Deploy (Cloud Run)" in `backend/README.md`.

In production the browser never calls the Cloud Run URL directly —
`frontend/vercel.json` rewrites `/api/*` to the backend server-side (Vercel →
Cloud Run), so the API is same-site with the frontend from the browser's
point of view. This is what lets the session cookie use `SameSite=Lax`
everywhere instead of the cross-site `SameSite=None`, which was causing
intermittent login failures (some browsers' cross-site tracking protections
could silently drop that cookie). See "Proxy (Vercel rewrite)" in
`backend/README.md` for the full explanation.
