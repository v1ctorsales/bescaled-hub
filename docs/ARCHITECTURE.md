# Architecture and application behavior

[Back to README](../README.md)

## Request and state flow

```text
React page / component
  → AuthContext, CompanyDataContext, or CompaniesContext
  → frontend/src/services/* (apiFetch sends the session cookie)
  → backend/src/routes/* (authentication and role/company checks)
  → backend/src/controllers/* (validation and transactions)
  → shared Prisma Client → PostgreSQL
  → companySerializer → JSON response → React state
```

Some pages, such as Slack discussions, call services directly. The shared JSON fetch wrapper is `frontend/src/services/apiConfig.js`; file downloads use a separate cookie-authenticated fetch. There is no Redux store, background worker, or separate report-generation server. PDF/XLSX/ZIP files are assembled in the browser using data returned by the API.

`frontend/src/main.jsx` mounts Google OAuth, BrowserRouter, and App. App defines the routes and wraps them in AuthProvider and session-scoped data providers. The providers remount when the signed-in email changes so data from one account does not remain visible to the next account.

| Context | Responsibility |
| --- | --- |
| AuthContext | Load `/auth/me`, sign in through Google, log out |
| CompanyDataContext | Load a company’s assessments, maintain readiness drafts, save readiness, autosave maturity answers and submit |
| CompaniesContext | Load admin company directory and batch dates; manage company/settings/batch mutations |

Directory data is loaded into memory, not kept live through subscriptions. Refresh to pick up another user’s later saves. Company detail pages read the already-loaded admin directory, including its nested assessment data.

## Frontend routes

| Route | Access |
| --- | --- |
| `/login` | Public; signed-in users go to their role’s home |
| `/dashboard` | Company |
| `/dashboard/readiness` | Company |
| `/dashboard/maturity-test` | Company |
| `/admin` | Admin |
| `/admin/companies/:id` | Admin |
| `/admin/slack` | Admin |
| `/admin/help` | Admin |

Unknown paths go to `/login`. `RequireRole` waits for session loading, redirects anonymous users to login, and sends users with the wrong role to their own home. API middleware independently enforces data access; frontend route guards are not the security boundary.

## Authentication

Vite resolves the public client ID from `VITE_GOOGLE_CLIENT_ID` (frontend environment or process), falling back to `GOOGLE_CLIENT_ID` from the root environment. Only that selected public value is inlined; root secrets are not exposed. Missing configuration stops frontend startup/build with an explicit error.

The frontend submits a Google ID token to `POST /api/auth/google`. The backend verifies its audience and verified email, then checks `AdminEmail` first, followed by `CompanyLoginEmail`. Unauthorized emails receive 403. There is no authorization-code exchange and no Google client secret is used.

The backend signs an HS256 JWT containing the email, name, avatar, role, and company ID. It is stored in the `bescaled_session` HTTP-only cookie for eight hours. Cookies use `SameSite=Lax`, and `Secure` when `NODE_ENV=production`. The JWT is not returned in the JSON body. Logout clears the browser’s cookie; there is no server-side session registry or immediate revocation mechanism.

Permission changes are checked at sign-in, while existing sessions use their signed claims until expiry. Removing a login email or an admin database row does not immediately revoke an existing JWT. All administrators use the same server-configured Slack connection.

## Data model

See [schema.prisma](../backend/prisma/schema.prisma) and the committed SQL migrations. `Company` has child rows for login emails, readiness scores, maturity answers, and guide progress. Deleting a company cascades to those children. `AdminEmail` and `Batch` are independent tables. Batch membership is an integer on Company, rather than a foreign-key relation to Batch; batch dates are optional.

The database is normalized, but `backend/src/db/companySerializer.js` returns nested API objects:

```json
{
  "readinessLevels": { "10/2026": { "CRL": 2 } },
  "maturityAnswers": {
    "human-agency-oversight": {
      "conceptual": { "score": 2, "comment": "Example", "dontUnderstand": false }
    }
  },
  "guideProgress": { "CRL:1:0": "achieved" },
  "settings": { "loginEmails": ["participant@example.com"], "description": "Example", "batch": 1 }
}
```

## Innovation readiness rules

- Six metrics: CRL, TRL, BRL, IPRL, TmRL, FRL. Reporting periods are fixed to `10/2026`, `02/2027`, `09/2027` in both `frontend/src/config.js` and `backend/src/data/readinessConfig.js`; change them together.
- Scores are stored as integers 0–9. The visible scale is 1–9; display helpers clamp missing/zero values to 1 in charts and guide markers. The UI table shows a dash for zero/missing values; exports may retain zero.
- Guide content belongs to `frontend/src/data/readinessLevelGuide.js`. Guide answers are keyed by metric, level, and bullet index. Status is `achieved`, `not-achieved`, or `not-applicable`; missing means unanswered. Reordering rubric bullets changes what stored indexes refer to, so rubric changes need a data migration strategy.
- Company edits remain in React state until Save. A single PUT saves score upserts and replaces the entire guide-progress snapshot in a transaction. Missing guide keys are deleted; score cells omitted from a request are left unchanged.
- When every bullet of a level is achieved, the UI may raise that metric’s first-period score. It never automatically lowers it and does not require every earlier level to be achieved. This calculation runs in the frontend; the backend validates values, not the rubric logic.
- Saving sets `filledReadinessForm=true`, even for a partial valid form. The admin Completed badge reads that flag, not the percentage.
- Dashboard progress uses saved values. It counts every guide bullet with any status and score cells for periods whose month has started. The first-period cell also counts once the full metric guide is answered, even if the score remains zero. See `readinessProgress.js` and `readinessPeriods.js`.

## AI maturity rules

`frontend/src/data/maturityDimensions.js` owns nine dimensions × five stages (45 items), blank answers, and merging of sparse saved answers. Ratings are integers 0–4, with optional comments and `dontUnderstand` flags. The backend checks dimension/stage slug format rather than whether an ID exists in this rubric.

Answers save through individual PATCH requests; the frontend updates optimistically and reports failures without rolling the displayed answer back. Submit only sets `filledMaturityTest=true`; the backend does not validate questionnaire completeness or lock further edits. The current admin details table and PDF show maturity answers after submission. A company XLSX includes saved draft answers as well.

Dashboard maturity progress uses a browser-session touched-item set. After reloading a submitted test, all items are considered touched; an unsubmitted draft does not reconstruct this touched set from saved answers. Do not use that percentage as a durable completeness audit.

## Reports and Slack

`frontend/src/utils/export.js` handles company assessment exports. `adminExport.js` handles directory and company reports; `radarCanvas.js` draws chart images for PDFs. Directory XLSX is a summary, while company XLSX includes Info, KTH, KTH Level Guide, and AI Maturity sheets. PDF and XLSX content differ; see the in-app Platform Guide.

Slack calls run through `backend/src/services/slack.service.js`. Conversations/history/files are fetched on demand; author names have a five-minute in-memory cache. Slack is not replicated into the application database. Files are proxied only after conversation association checks and must come from the supported Slack file origin.

Slack exports fetch paginated history and thread replies, download attachments, render a PDF, and build a ZIP in the browser. Export all processes member conversations sequentially. Large histories can hit application/Slack rate limits or browser memory limits; there is no queued export job or automatic retry. A failed attachment request can stop the export. Available history remains subject to Slack’s retention and permissions.

## Configuration and operational boundaries

Caddy on the VPS and Vercel rewrites provide same-origin `/api` requests. Vite’s default `/api` URL relies on such a proxy; local development explicitly uses the backend URL. There is no development proxy in `vite.config.js`.

The API trusts one proxy hop, permits one configured CORS origin with credentials, and rate-limits API requests in memory. See [backend middleware and limits](../backend/README.md#errors-and-request-limits). No health endpoint, automated test suite, backup scheduler, invitation mailer, report import, or admin-role editor is provided in this repository.
