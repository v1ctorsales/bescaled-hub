#!/bin/sh
# Container entrypoint, run on every start:
#   1. apply any pending migrations (against DIRECT_URL)
#   2. seed (admins from ADMIN_EMAILS + sample companies; idempotent upserts,
#      see prisma/seed.js — safe to run against a database that's already
#      been seeded, but note it re-applies the 6 sample companies' data
#      every time, so a company edited since the last deploy gets reset)
#   3. start the API
#
# The database (Postgres/Supabase) is persistent — see backend/README.md —
# unlike the old SQLite setup this used to run against, where every start
# began from an empty file and re-seeding was harmless by construction.
set -e

npx prisma migrate deploy
npx prisma db seed
exec node server.js
