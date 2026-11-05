#!/bin/sh
# Container entrypoint, run on every start:
#   1. apply any pending migrations
#   2. seed (admins are upserted from ADMIN_EMAILS; six sample companies are
#      created only when the Company table is empty; existing companies are
#      never reset — see prisma/seed.js)
#   3. start the API
#
# The database (Postgres) is persistent — see backend/README.md — unlike the
# old SQLite setup this used to run against, where every start began from an
# empty file and re-seeding was harmless by construction.
set -e

npx prisma migrate deploy
npx prisma db seed
exec node server.js
