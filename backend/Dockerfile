# syntax=docker/dockerfile:1

# ---- deps: install packages and generate the Prisma client -----------------
FROM node:20-slim AS deps
WORKDIR /app

# Prisma's query engine needs OpenSSL on Debian-based images.
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

# ---- runtime -----------------------------------------------------------
FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# node_modules (with the generated Prisma client) from the deps stage —
# everything else (source, prisma/schema+migrations+seed) comes from the
# build context below, via .dockerignore-filtered `COPY . .`.
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN chmod +x start.sh

# Runs as the `node` user (uid 1000), already present in the base image,
# instead of root — the database itself is remote (Postgres/Supabase, see
# backend/README.md), so this is just standard least-privilege, not needed
# for any local file the app writes.
RUN chown -R node:node /app
USER node

# Cloud Run injects PORT (usually 8080) and expects the server to listen on
# it; server.js already reads process.env.PORT with a 3001 fallback for
# local/non-Cloud-Run use. 8080 here is just the image's documented default.
EXPOSE 8080
CMD ["./start.sh"]
