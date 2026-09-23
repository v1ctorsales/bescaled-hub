#!/bin/sh
# Container entrypoint. Runs on every start (Cloud Run gives each instance a
# fresh, empty SQLite file — see backend/README.md — so this has to succeed
# from scratch every time, not just on the first deploy):
#   1. apply migrations, creating prisma/data.db if it doesn't exist yet
#   2. seed it (admins + sample companies; idempotent, see prisma/seed.js)
#   3. start the API
set -e

npx prisma migrate deploy
npx prisma db seed
exec node server.js
