# Vercel and Cloud Run configuration

[Back to README](../README.md) · [Docker/Caddy deployment](../VPS-DEPLOY.md)

This is an alternative deployment configuration retained in the repository. Confirm project ownership, runtime settings, database compatibility, and the active production destination before using it. The current database schema has moved to a single `DATABASE_URL`; older Supabase pooler/direct-URL instructions do not apply unchanged.

## Browser request path

```text
Browser → Vercel frontend /api/* → Cloud Run Express API → PostgreSQL
```

Set Vercel’s project Root Directory to `frontend/`, build with `npm run build`, and serve `dist/`. Set build-time variables:

- `VITE_API_BASE_URL=/api`
- `VITE_GOOGLE_CLIENT_ID`: the same public client ID used by the backend.

`frontend/vercel.json` rewrites `/api/:path*` to its configured Cloud Run URL and all other paths to `/index.html`. Update the destination deliberately if changing backend services. Preserve the `/api` prefix and the `x-vercel-enable-rewrite-caching: 0` header. Do not introduce shared caching for authenticated responses.

Same-origin browser requests allow the session cookie to use `SameSite=Lax` and avoid cross-site-cookie dependence. `FRONTEND_ORIGIN` still configures credentialed CORS for requests that reach the API directly; it should match the frontend’s origin. Configure Google’s allowed JavaScript origins for that frontend.

## Cloud Run backend

Deploy from `backend/` so the build uses its Dockerfile. The image installs dependencies, generates Prisma Client, and runs `start.sh`: migration deploy, seed, then `node server.js`. Cloud Run supplies `PORT`; the server reads it. Production cookies require HTTPS at the frontend/proxy.

Inject these runtime values through the deployment platform:

| Configuration | Value/purpose |
| --- | --- |
| `NODE_ENV` | `production` |
| `GOOGLE_CLIENT_ID` | Frontend’s Google client ID |
| `FRONTEND_ORIGIN` | Exact frontend origin |
| `ADMIN_EMAILS` | Semicolon-separated administrator emails for the seed |
| `DATABASE_URL` | Private PostgreSQL connection URL usable by migrations and runtime |
| `JWT_SECRET` | Private session-signing secret |
| `SLACK_USER_TOKEN` | Optional private Slack user token |

Use Secret Manager or the platform’s equivalent for credentials. Do not pass real secrets in command-line examples or commit runtime configuration. `GOOGLE_CLIENT_SECRET` and `DIRECT_URL` are not consumed by this code. The public frontend client ID is not a secret.

A deployment command template (replace the uppercase deployment placeholders before running, and create the referenced secrets first):

```bash
cd backend
gcloud run deploy YOUR_SERVICE \
  --source . \
  --region YOUR_REGION \
  --allow-unauthenticated \
  --max-instances=1 \
  --env-vars-file=env-vars.yaml \
  --set-secrets="JWT_SECRET=JWT_SECRET:latest,DATABASE_URL=DATABASE_URL:latest,SLACK_USER_TOKEN=SLACK_USER_TOKEN:latest"
```

If Slack is not configured, omit its secret mapping. The private, git-ignored `backend/env-vars.yaml` can contain:

```yaml
NODE_ENV: production
GOOGLE_CLIENT_ID: "YOUR_PUBLIC_GOOGLE_CLIENT_ID"
FRONTEND_ORIGIN: "https://YOUR_FRONTEND_HOST"
ADMIN_EMAILS: "admin@example.com;another-admin@example.com"
```

Public platform ingress is needed for Vercel to reach this example backend; API authorization still runs in Express. Review access/network settings for the chosen environment. The single-instance setting keeps the example conservative, but is not a PostgreSQL requirement. Rate-limit counters are process-local, and connection budgets/startup migrations need consideration before scaling.

## Database compatibility and cutover

The schema uses PostgreSQL with one connection URL. If a managed provider supplies transaction-pooled and session/direct endpoints, select an endpoint suitable for migrations too, or deliberately implement and validate a separate migration configuration before deploying. This repository currently has no such split.

The cloud configuration does not automatically connect to Compose’s private `db` hostname. Provision reachable PostgreSQL with the required network and TLS settings. Moving domains or changing the proxy does not copy company data; database export/import, admin provisioning, secrets, and verification are separate operator responsibilities.

On an empty database, container startup seeds six sample companies. On a populated database, company seeding is skipped; admin seeding only adds emails. Review the [backend seed behavior](../backend/README.md#database-and-seeding) before a first deployment or cutover.

## Verification

Check the frontend login page and a deep link, then call `/api/auth/me` on the frontend domain: an unauthenticated request should return JSON 401, not HTML. In a browser, test Google login, role-specific navigation, Platform Guide, readiness save, maturity submission, and exports with a test company. Verify an optional Slack conversation separately. Inspect deployment logs if startup fails.

Repository configuration alone cannot verify deployed secrets, Google/Slack permissions, current DNS, or live database contents.
