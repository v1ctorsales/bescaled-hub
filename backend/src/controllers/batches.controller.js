import { prisma } from "../db/prismaClient.js";
import { badRequest } from "../utils/http.js";
import {
  BATCH_MAX,
  BATCH_MIN,
  isIntInRange,
  isPlainObject,
  monthYearToIndex,
} from "../utils/validation.js";

// Always answers with one entry per batch number (1-9), dates null until set.
async function listBatches() {
  const rows = await prisma.batch.findMany();
  const byNumber = new Map(rows.map((r) => [r.number, r]));
  return Array.from({ length: BATCH_MAX - BATCH_MIN + 1 }, (_, i) => {
    const number = BATCH_MIN + i;
    const row = byNumber.get(number);
    return { batch: number, startDate: row?.startDate ?? null, endDate: row?.endDate ?? null };
  });
}

export async function getBatches(req, res) {
  res.json(await listBatches());
}

// "" / null / undefined mean "not set".
const normalizeDate = (v) => (v === undefined || v === null || v === "" ? null : v);

// Returns { entries } (normalized) or { error }.
function parseBatches(input) {
  if (!Array.isArray(input) || input.length > BATCH_MAX - BATCH_MIN + 1) {
    return { error: "batches must be an array with at most one entry per batch" };
  }
  const seen = new Set();
  const entries = [];
  for (const item of input) {
    if (!isPlainObject(item) || !isIntInRange(item.batch, BATCH_MIN, BATCH_MAX)) {
      return { error: `each entry needs a batch from ${BATCH_MIN} to ${BATCH_MAX}` };
    }
    if (seen.has(item.batch)) return { error: `batch ${item.batch} appears more than once` };
    seen.add(item.batch);

    const startDate = normalizeDate(item.startDate);
    const endDate = normalizeDate(item.endDate);
    const start = startDate === null ? null : monthYearToIndex(startDate);
    const end = endDate === null ? null : monthYearToIndex(endDate);
    if ((startDate !== null && start === null) || (endDate !== null && end === null)) {
      return { error: `batch ${item.batch}: dates must be in MM/YYYY format` };
    }
    if (start !== null && end !== null && end < start) {
      return { error: `batch ${item.batch}: end date can't be before the start date` };
    }
    entries.push({ number: item.batch, startDate, endDate });
  }
  return { entries };
}

// PUT /api/batches — saves the dates of every batch sent, in one request.
// A batch sent with no dates has its row removed.
export async function saveBatches(req, res) {
  const { entries, error } = parseBatches(isPlainObject(req.body) ? req.body.batches : undefined);
  if (error) return badRequest(res, error);

  await prisma.$transaction(
    entries.map(({ number, startDate, endDate }) =>
      startDate === null && endDate === null
        ? prisma.batch.deleteMany({ where: { number } })
        : prisma.batch.upsert({
            where: { number },
            update: { startDate, endDate },
            create: { number, startDate, endDate },
          }),
    ),
  );
  res.json(await listBatches());
}
