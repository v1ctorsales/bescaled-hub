import { prisma } from "../db/prismaClient.js";
import { maturityAnswersToApi } from "../db/companySerializer.js";
import { badRequest, notFound, parseCompanyId } from "../utils/http.js";
import {
  MATURITY_SCORE_MAX,
  MATURITY_SCORE_MIN,
  isIntInRange,
  isPlainObject,
  isSlug,
} from "../utils/validation.js";

const PATCH_KEYS = ["score", "comment", "dontUnderstand"];
const MAX_COMMENT_LENGTH = 5000;

// Returns the raw stored answers (possibly missing dimensions/stages the
// company hasn't touched yet) — filling in a full blank shape is the
// frontend's job (it already owns the dimension/stage rubric content in
// src/data/maturityDimensions.js), not the backend's.
export async function getMaturityTest(req, res) {
  const id = parseCompanyId(req.params.id);
  const company =
    id === null
      ? null
      : await prisma.company.findUnique({
          where: { id },
          select: {
            filledMaturityTest: true,
            maturityAnswers: { orderBy: { id: "asc" } },
          },
        });
  if (!company) return notFound(res);
  res.json({
    answers: maturityAnswersToApi(company.maturityAnswers),
    filled: company.filledMaturityTest,
  });
}

// Returns an error message for an invalid patch, or null.
function validatePatch(patch) {
  if (!isPlainObject(patch)) return "patch must be an object";
  if (Object.keys(patch).some((k) => !PATCH_KEYS.includes(k))) {
    return `patch may only contain: ${PATCH_KEYS.join(", ")}`;
  }
  if ("score" in patch && !isIntInRange(patch.score, MATURITY_SCORE_MIN, MATURITY_SCORE_MAX)) {
    return `score must be an integer from ${MATURITY_SCORE_MIN} to ${MATURITY_SCORE_MAX}`;
  }
  if (
    "comment" in patch &&
    (typeof patch.comment !== "string" || patch.comment.length > MAX_COMMENT_LENGTH)
  ) {
    return `comment must be a string of at most ${MAX_COMMENT_LENGTH} characters`;
  }
  if ("dontUnderstand" in patch && typeof patch.dontUnderstand !== "boolean") {
    return "dontUnderstand must be a boolean";
  }
  return null;
}

export async function updateMaturityAnswer(req, res) {
  const id = parseCompanyId(req.params.id);
  const { dimensionId, stageId, patch } = isPlainObject(req.body) ? req.body : {};
  if (!isSlug(dimensionId) || !isSlug(stageId)) {
    return badRequest(res, "dimensionId and stageId are required");
  }
  const patchError = validatePatch(patch);
  if (patchError) return badRequest(res, patchError);

  const rows = await prisma.$transaction(async (tx) => {
    if (id === null || !(await tx.company.findUnique({ where: { id }, select: { id: true } }))) {
      return null;
    }
    await tx.maturityAnswer.upsert({
      where: { companyId_dimensionId_stageId: { companyId: id, dimensionId, stageId } },
      update: patch,
      create: { companyId: id, dimensionId, stageId, ...patch },
    });
    return tx.maturityAnswer.findMany({ where: { companyId: id }, orderBy: { id: "asc" } });
  });
  if (!rows) return notFound(res);
  res.json(maturityAnswersToApi(rows));
}

export async function submitMaturityTest(req, res) {
  const id = parseCompanyId(req.params.id);
  const { count } =
    id === null
      ? { count: 0 }
      : await prisma.company.updateMany({ where: { id }, data: { filledMaturityTest: true } });
  if (count === 0) return notFound(res);
  res.json({ filled: true });
}
