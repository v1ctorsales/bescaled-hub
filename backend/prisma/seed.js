import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";

// Snapshot of the data the API used to serve from memory (the old
// companiesSeed.js): 6 sample companies with readiness levels, maturity
// answers, guide progress and settings.
const companies = JSON.parse(
  readFileSync(new URL("./seed-data.json", import.meta.url), "utf8"),
);

const prisma = new PrismaClient();

// Google accounts allowed to log in as admins: ADMIN_EMAILS in .env,
// ";"-separated, normalized to lowercase with blank entries dropped.
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(";")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

async function seedAdmins() {
  if (ADMIN_EMAILS.length === 0) {
    console.log("ADMIN_EMAILS is not set — skipping admin seeding.");
    return;
  }
  // upsert, so re-running the seed never duplicates or fails on existing rows.
  for (const email of ADMIN_EMAILS) {
    await prisma.adminEmail.upsert({ where: { email }, update: {}, create: { email } });
  }
  console.log(`Ensured ${ADMIN_EMAILS.length} admin emails.`);
}

// Fully idempotent: upserts the company row, then replaces its child rows
// (login emails, readiness levels, maturity answers, guide progress)
// wholesale. Safe to run against an empty database (a fresh container start,
// per backend/Dockerfile) or an already-seeded one — either way it ends in
// the exact same state, so it never fails on duplicate keys.
async function seedCompany(c) {
  await prisma.$transaction(async (tx) => {
    await tx.company.upsert({
      where: { id: c.id },
      update: {
        name: c.name,
        contactEmail: c.contactEmail,
        subscribed: c.subscribed,
        filledReadinessForm: c.filledReadinessForm,
        filledMaturityTest: c.filledMaturityTest,
        settingsDescription: c.settings.description,
        settingsBatch: c.settings.batch,
      },
      create: {
        id: c.id,
        name: c.name,
        contactEmail: c.contactEmail,
        subscribed: c.subscribed,
        filledReadinessForm: c.filledReadinessForm,
        filledMaturityTest: c.filledMaturityTest,
        settingsDescription: c.settings.description,
        settingsBatch: c.settings.batch,
      },
    });

    await tx.companyLoginEmail.deleteMany({ where: { companyId: c.id } });
    await tx.companyLoginEmail.createMany({
      data: c.settings.loginEmails.map((email, position) => ({
        companyId: c.id,
        position,
        email,
      })),
    });

    await tx.readinessLevel.deleteMany({ where: { companyId: c.id } });
    await tx.readinessLevel.createMany({
      data: Object.entries(c.readinessLevels).flatMap(([year, metrics]) =>
        Object.entries(metrics).map(([metric, value]) => ({
          companyId: c.id,
          year,
          metric,
          value,
        })),
      ),
    });

    await tx.maturityAnswer.deleteMany({ where: { companyId: c.id } });
    await tx.maturityAnswer.createMany({
      data: Object.entries(c.maturityAnswers).flatMap(([dimensionId, stages]) =>
        Object.entries(stages).map(([stageId, a]) => ({
          companyId: c.id,
          dimensionId,
          stageId,
          score: a.score,
          comment: a.comment,
          dontUnderstand: a.dontUnderstand,
        })),
      ),
    });

    await tx.guideProgress.deleteMany({ where: { companyId: c.id } });
    await tx.guideProgress.createMany({
      data: Object.entries(c.guideProgress).map(([key, status]) => {
        const [metric, level, bulletIndex] = key.split(":");
        return {
          companyId: c.id,
          metric,
          level: Number(level),
          bulletIndex: Number(bulletIndex),
          status,
        };
      }),
    });
  });
}

async function main() {
  await seedAdmins();
  for (const c of companies) {
    await seedCompany(c);
  }
  console.log(`Ensured ${companies.length} sample companies.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
