import "dotenv/config";
import { app } from "./src/app.js";
import { prisma } from "./src/db/prismaClient.js";

// Fail fast instead of answering every login with a 500.
for (const name of ["GOOGLE_CLIENT_ID", "JWT_SECRET"]) {
  if (!process.env[name]) {
    console.error(`Missing required environment variable ${name} (see .env.example)`);
    process.exit(1);
  }
}

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
  console.log(`BeScaled Hub API listening on http://localhost:${PORT}`);
});

// Stop accepting requests, then close the DB connection cleanly so SQLite
// doesn't leave a stale journal/lock file behind.
async function shutdown(signal) {
  console.log(`${signal} received, shutting down...`);
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
