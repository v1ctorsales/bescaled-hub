import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";

// Snapshot of the data the API used to serve from memory (the old
// companiesSeed.js): 6 sample companies with readiness levels, maturity
// answers, guide progress and settings.
const companies = JSON.parse(
  readFileSync(new URL("./seed-data.json", import.meta.url), "utf8"),
);

const prisma = new PrismaClient();

// Google accounts allowed to log in as admins (always lowercase).
const ADMIN_EMAILS = ["victorsa@tlu.ee", "bauters@tlu.ee", "buhari@tlu.ee"];

async function seedAdmins() {
  // upsert, so re-running the seed never duplicates or fails on existing rows.
  for (const email of ADMIN_EMAILS) {
    await prisma.adminEmail.upsert({ where: { email }, update: {}, create: { email } });
  }
  console.log(`Ensured ${ADMIN_EMAILS.length} admin emails.`);
}

async function main() {
  await seedAdmins();

  // Never clobber real data: only seed an empty database.
  // (`prisma migrate reset` empties it first, then runs this again.)
  if ((await prisma.company.count()) > 0) {
    console.log("Database already has companies — skipping seed.");
    return;
  }

  for (const c of companies) {
    await prisma.company.create({
      data: {
        id: c.id,
        name: c.name,
        contactEmail: c.contactEmail,
        subscribed: c.subscribed,
        filledReadinessForm: c.filledReadinessForm,
        filledMaturityTest: c.filledMaturityTest,
        settingsDescription: c.settings.description,
        settingsBatch: c.settings.batch,
        loginEmails: {
          create: c.settings.loginEmails.map((email, position) => ({ position, email })),
        },
        readinessLevels: {
          create: Object.entries(c.readinessLevels).flatMap(([year, metrics]) =>
            Object.entries(metrics).map(([metric, value]) => ({ year, metric, value })),
          ),
        },
        maturityAnswers: {
          create: Object.entries(c.maturityAnswers).flatMap(([dimensionId, stages]) =>
            Object.entries(stages).map(([stageId, a]) => ({
              dimensionId,
              stageId,
              score: a.score,
              comment: a.comment,
              dontUnderstand: a.dontUnderstand,
            })),
          ),
        },
        guideProgress: {
          create: Object.entries(c.guideProgress).map(([key, status]) => {
            const [metric, level, bulletIndex] = key.split(":");
            return { metric, level: Number(level), bulletIndex: Number(bulletIndex), status };
          }),
        },
      },
    });
  }
  console.log(`Seeded ${companies.length} companies.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
