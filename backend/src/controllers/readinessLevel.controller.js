import { prisma } from "../db/prismaClient.js";
import { guideProgressToApi, readinessLevelsToApi } from "../db/companySerializer.js";
import { READINESS_METRICS, READINESS_YEARS } from "../data/readinessConfig.js";
import { badRequest, notFound, parseCompanyId } from "../utils/http.js";
import {
  GUIDE_LEVEL_MAX,
  GUIDE_LEVEL_MIN,
  GUIDE_STATUSES,
  READINESS_VALUE_MAX,
  READINESS_VALUE_MIN,
  isIntInRange,
  isPlainObject,
} from "../utils/validation.js";

const MAX_BULLET_INDEX = 99;

async function companyExists(client, id) {
  return (
    id !== null && Boolean(await client.company.findUnique({ where: { id }, select: { id: true } }))
  );
}

export async function getReadinessLevels(req, res) {
  const id = parseCompanyId(req.params.id);
  if (!(await companyExists(prisma, id))) return notFound(res);
  const rows = await prisma.readinessLevel.findMany({
    where: { companyId: id },
    orderBy: { id: "asc" },
  });
  res.json(readinessLevelsToApi(rows));
}

export async function isReadinessFormFilled(req, res) {
  const id = parseCompanyId(req.params.id);
  const company =
    id === null
      ? null
      : await prisma.company.findUnique({ where: { id }, select: { filledReadinessForm: true } });
  if (!company) return notFound(res);
  res.json({ filled: company.filledReadinessForm });
}

export async function updateReadinessLevel(req, res) {
  const id = parseCompanyId(req.params.id);
  const { year, metric, value } = isPlainObject(req.body) ? req.body : {};
  if (
    !READINESS_YEARS.includes(year) ||
    !READINESS_METRICS.includes(metric) ||
    !isIntInRange(value, READINESS_VALUE_MIN, READINESS_VALUE_MAX)
  ) {
    return badRequest(
      res,
      `year (${READINESS_YEARS.join(", ")}), metric (${READINESS_METRICS.join(", ")}) and an integer value from ${READINESS_VALUE_MIN} to ${READINESS_VALUE_MAX} are required`,
    );
  }

  const levels = await prisma.$transaction(async (tx) => {
    if (!(await companyExists(tx, id))) return null;
    await tx.readinessLevel.upsert({
      where: { companyId_year_metric: { companyId: id, year, metric } },
      update: { value },
      create: { companyId: id, year, metric, value },
    });
    await tx.company.update({ where: { id }, data: { filledReadinessForm: true } });
    return tx.readinessLevel.findMany({ where: { companyId: id }, orderBy: { id: "asc" } });
  });
  if (!levels) return notFound(res);
  res.json(readinessLevelsToApi(levels));
}

export async function getGuideProgress(req, res) {
  const id = parseCompanyId(req.params.id);
  if (!(await companyExists(prisma, id))) return notFound(res);
  const rows = await prisma.guideProgress.findMany({
    where: { companyId: id },
    orderBy: { id: "asc" },
  });
  res.json(guideProgressToApi(rows));
}

export async function updateGuideProgress(req, res) {
  const id = parseCompanyId(req.params.id);
  const { metric, level, bulletIndex, status } = isPlainObject(req.body) ? req.body : {};
  if (
    !READINESS_METRICS.includes(metric) ||
    !isIntInRange(level, GUIDE_LEVEL_MIN, GUIDE_LEVEL_MAX) ||
    !isIntInRange(bulletIndex, 0, MAX_BULLET_INDEX) ||
    (status != null && !GUIDE_STATUSES.includes(status))
  ) {
    return badRequest(
      res,
      `metric, an integer level (${GUIDE_LEVEL_MIN}-${GUIDE_LEVEL_MAX}), an integer bulletIndex and an optional status (${GUIDE_STATUSES.join(", ")}) are required`,
    );
  }

  const rows = await prisma.$transaction(async (tx) => {
    if (!(await companyExists(tx, id))) return null;
    const where = {
      companyId_metric_level_bulletIndex: { companyId: id, metric, level, bulletIndex },
    };
    const existing = await tx.guideProgress.findUnique({ where });
    // Same status again (or no status) clears the bullet — the frontend's toggle.
    if (!status || existing?.status === status) {
      if (existing) await tx.guideProgress.delete({ where });
    } else {
      await tx.guideProgress.upsert({
        where,
        update: { status },
        create: { companyId: id, metric, level, bulletIndex, status },
      });
    }
    return tx.guideProgress.findMany({ where: { companyId: id }, orderBy: { id: "asc" } });
  });
  if (!rows) return notFound(res);
  res.json(guideProgressToApi(rows));
}

const MAX_GUIDE_ENTRIES = 500;

// Validates the readinessLevels part of a save. Returns { cells } or { error }.
function parseReadinessLevels(input) {
  if (!isPlainObject(input)) return { error: "readinessLevels must be an object" };
  const cells = [];
  for (const [year, metrics] of Object.entries(input)) {
    if (!READINESS_YEARS.includes(year) || !isPlainObject(metrics)) {
      return { error: `readinessLevels: unknown year "${year}"` };
    }
    for (const [metric, value] of Object.entries(metrics)) {
      if (
        !READINESS_METRICS.includes(metric) ||
        !isIntInRange(value, READINESS_VALUE_MIN, READINESS_VALUE_MAX)
      ) {
        return {
          error: `readinessLevels: ${year}/${metric} must be a known metric with an integer from ${READINESS_VALUE_MIN} to ${READINESS_VALUE_MAX}`,
        };
      }
      cells.push({ year, metric, value });
    }
  }
  return { cells };
}

// Validates the guideProgress part of a save ("CRL:1:0": "achieved", ...).
// Returns { entries } or { error }.
function parseGuideProgress(input) {
  if (!isPlainObject(input)) return { error: "guideProgress must be an object" };
  const keys = Object.keys(input);
  if (keys.length > MAX_GUIDE_ENTRIES) return { error: "guideProgress has too many entries" };
  const entries = [];
  for (const key of keys) {
    const [metric, level, bulletIndex, ...rest] = key.split(":");
    const levelNum = Number(level);
    const bulletNum = Number(bulletIndex);
    const status = input[key];
    if (
      rest.length > 0 ||
      !READINESS_METRICS.includes(metric) ||
      !isIntInRange(levelNum, GUIDE_LEVEL_MIN, GUIDE_LEVEL_MAX) ||
      !isIntInRange(bulletNum, 0, MAX_BULLET_INDEX) ||
      !GUIDE_STATUSES.includes(status)
    ) {
      return { error: `guideProgress: invalid entry "${key}"` };
    }
    entries.push({ metric, level: levelNum, bulletIndex: bulletNum, status });
  }
  return { entries };
}

// PUT /companies/:id/readiness-level — saves the whole KTH form in one request:
// { readinessLevels, guideProgress }. Scores are upserted cell by cell;
// guideProgress is a full snapshot, so bullets missing from it are cleared.
export async function saveReadiness(req, res) {
  const id = parseCompanyId(req.params.id);
  const body = isPlainObject(req.body) ? req.body : {};
  const levels = parseReadinessLevels(body.readinessLevels);
  if (levels.error) return badRequest(res, levels.error);
  const guide = parseGuideProgress(body.guideProgress);
  if (guide.error) return badRequest(res, guide.error);

  const saved = await prisma.$transaction(async (tx) => {
    if (!(await companyExists(tx, id))) return null;

    for (const { year, metric, value } of levels.cells) {
      await tx.readinessLevel.upsert({
        where: { companyId_year_metric: { companyId: id, year, metric } },
        update: { value },
        create: { companyId: id, year, metric, value },
      });
    }
    await tx.guideProgress.deleteMany({ where: { companyId: id } });
    await tx.guideProgress.createMany({
      data: guide.entries.map((entry) => ({ companyId: id, ...entry })),
    });
    await tx.company.update({ where: { id }, data: { filledReadinessForm: true } });

    const [levelRows, guideRows] = await Promise.all([
      tx.readinessLevel.findMany({ where: { companyId: id }, orderBy: { id: "asc" } }),
      tx.guideProgress.findMany({ where: { companyId: id }, orderBy: { id: "asc" } }),
    ]);
    return { levelRows, guideRows };
  });
  if (!saved) return notFound(res);
  res.json({
    readinessLevels: readinessLevelsToApi(saved.levelRows),
    guideProgress: guideProgressToApi(saved.guideRows),
    filled: true,
  });
}
