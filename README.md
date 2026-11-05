# BeScaled Hub

A portal for companies participating in the BeScaled program to assess innovation readiness and responsible AI maturity. Company users complete their own assessments; administrators manage companies and batches, review results, export reports, and browse a connected Slack workspace.

## Documentation

- **Administrators:** sign in and choose **Platform Guide** in the header, or visit `/admin/help`. The searchable guide covers admin workflows, guiding companies through assessments, and common problems.
- **Developers:** start with the setup below, then read [architecture and behavior](docs/ARCHITECTURE.md) and the [backend/API reference](backend/README.md).
- **Operators:** see [Docker and Caddy deployment](VPS-DEPLOY.md) or the [Vercel/Cloud Run configuration](docs/CLOUD-DEPLOY.md).

The repository contains both deployment configurations. These files do not establish which service is currently serving production; verify that with the operator before deploying or changing DNS.

## Stack and repository map

React 19 + Vite + React Router on the frontend; Node.js + Express + Prisma with PostgreSQL on the backend. Both packages use JavaScript ES modules. The root package coordinates them with `concurrently`; it is not an npm-workspaces configuration.

```text
frontend/
  src/pages/          Login, company assessments, admin screens, Platform Guide
  src/components/     Shared UI, charts, dialogs, file previews
  src/context/        Authentication and company/admin state
  src/services/       API calls and common fetch wrapper
  src/data/           Assessment rubrics and administrator help content
  src/utils/          Progress calculations and browser-generated exports
backend/
  server.js           Environment loading, startup, shutdown
  src/app.js          Middleware, route mounting, error handling
  src/routes/         Endpoint definitions and permission checks
  src/controllers/    Validation and persistence
  src/services/       Server-side Slack integration
  src/db/             Prisma client and API serialization
  prisma/             Schema, committed migrations, initial sample data
Caddyfile             Hostname routing for the VPS
docker-compose.yml   PostgreSQL, API, frontend build, Caddy
```

The root `src/pages/ReadinessLevelPage.jsx` is an older, unreferenced copy. The application uses `frontend/src/pages/ReadinessLevelPage.jsx`.

## Local development

### Prerequisites

- Node.js **22.12 or newer** in the Node 22 line (or Node 20.19+), with npm. These are the installed Vite packages’ minimum engine ranges; Docker currently uses Node 20 images.
- A reachable PostgreSQL database. The Compose configuration uses PostgreSQL 17. For local development, use a disposable development database, not production.
- A Google OAuth web client ID, with the frontend origin (normally `http://localhost:5173`) allowed in its Google configuration. The same ID must be used by frontend and backend. This app verifies ID tokens and does not use a Google client secret.

### 1. Install dependencies

From the repository root:

```bash
npm ci
npm run install:all
```

`npm ci` installs the root runner. `install:all` installs the frontend and backend packages. Each package has its own committed lockfile; use `npm ci --prefix frontend` and `npm ci --prefix backend` for lockfile-based installs in CI.

### 2. Configure local environments

Create these files only if they do not already exist:

```bash
cp -n frontend/.env.example frontend/.env
cp -n backend/.env.example backend/.env
```

Edit the placeholders before starting. Never commit real `.env` files.

| File | Variables | Purpose |
| --- | --- | --- |
| `frontend/.env` | `VITE_API_BASE_URL=http://localhost:3001/api` | Local browser-to-API URL; Vite has no local API proxy configured |
| `frontend/.env` | `VITE_GOOGLE_CLIENT_ID` | Public Google web client ID |
| `backend/.env` | `DATABASE_URL` | PostgreSQL connection string used by both Prisma Client and migrations |
| `backend/.env` | `GOOGLE_CLIENT_ID`, `JWT_SECRET` | Google token audience and private session-signing secret |
| `backend/.env` | `ADMIN_EMAILS` | Semicolon-separated Google emails added to the admin table by seeding |
| `backend/.env` | `PORT`, `FRONTEND_ORIGIN` | Defaults: `3001`, `http://localhost:5173` |
| `backend/.env` | `SLACK_USER_TOKEN` | Optional private Slack user OAuth token; see backend setup |

The root `.env` supplies **Docker Compose**. The frontend also accepts its public `GOOGLE_CLIENT_ID` as a fallback when `VITE_GOOGLE_CLIENT_ID` is unset; an explicit frontend value takes priority. The direct npm backend still needs `backend/.env`. Vite variables are public build inputs: never put credentials in a `VITE_` variable. Restart the relevant development server after changing environment files; rebuild the frontend for production changes.

### 3. Initialize the development database

From `backend/`, using your development database URL:

```bash
cd backend
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
cd ..
```

Migrations create the tables. Seeding adds admin emails without removing existing admins and creates six sample companies only if the Company table is empty. It does not overwrite companies in an already-populated database. Review [seeding details](backend/README.md#database-and-seeding) before using it outside development.

### 4. Start both applications

```bash
npm run dev
```

Open `http://localhost:5173`. The API runs at `http://localhost:3001/api`. Sign in with a Google email listed in `ADMIN_EMAILS` and seeded into the database. There is no password or mock-login mode. Company access is configured through admin company settings.

To start one package independently:

```bash
npm run dev --prefix frontend
npm run dev --prefix backend
```

## Build and verification

```bash
npm run build
npm run lint --prefix frontend
```

The root build creates `frontend/dist/` only; the backend runs directly with Node. `npm run preview --prefix frontend` serves the built frontend for inspection, but does not provide an API proxy: use an appropriate build-time API URL and matching backend `FRONTEND_ORIGIN` when checking authenticated behavior.

There is currently no automated test script or test suite. Validate changes to authentication, assessment persistence, reports, or deployment using the relevant manual workflows as well as a successful build. Database migrations and seed commands write data; do not use them against production as a casual verification step.

## Common setup problems

- **`/api` returns HTML or JSON parsing fails locally:** set `VITE_API_BASE_URL=http://localhost:3001/api` in `frontend/.env` and restart Vite.
- **Google sign-in fails:** check that both packages use the same client ID and that Google allows the actual frontend origin. The frontend accepts `VITE_GOOGLE_CLIENT_ID` or falls back to root `GOOGLE_CLIENT_ID`; startup/build fails with an explanatory error if both are missing.
- **Google account is unauthorized:** seed the admin email or assign it as a company login email. Editing `ADMIN_EMAILS` alone does not update the database until the seed runs.
- **Login succeeds but later requests fail:** check the frontend URL, API origin, cookie handling, and `FRONTEND_ORIGIN`. Production requires HTTPS for the Secure session cookie. Prefer the provided same-origin proxy configurations.
- **Database startup fails:** verify `DATABASE_URL`, database availability, and applied migrations. The schema uses one connection URL; `DIRECT_URL` is no longer read.
- **Too many requests:** API requests are limited per client IP; large Slack exports and frequent answer saves can reach the configured limit. See the backend reference.

## Maintaining documentation

Update [Platform Guide content](frontend/src/data/adminHelp.js) when labels or admin workflows change. Update the backend reference when routes, payloads, validation, or authorization change. Keep deployment instructions aligned with `docker-compose.yml`, `Caddyfile`, Dockerfiles, and `frontend/vercel.json`. See the architecture guide for assessment rules and their source files.
