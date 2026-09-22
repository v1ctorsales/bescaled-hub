// Turns Prisma rows back into the exact JSON shapes the API has always
// returned (the frontend consumes these unchanged).

export const companyInclude = {
  loginEmails: { orderBy: { position: "asc" } },
  readinessLevels: { orderBy: { id: "asc" } },
  maturityAnswers: { orderBy: { id: "asc" } },
  guideProgress: { orderBy: { id: "asc" } },
};

// { "10/2026": { CRL: 2, ... }, ... }
export function readinessLevelsToApi(rows) {
  const out = {};
  for (const { year, metric, value } of rows) {
    (out[year] ??= {})[metric] = value;
  }
  return out;
}

// { [dimensionId]: { [stageId]: { score, comment, dontUnderstand } } }
export function maturityAnswersToApi(rows) {
  const out = {};
  for (const { dimensionId, stageId, score, comment, dontUnderstand } of rows) {
    (out[dimensionId] ??= {})[stageId] = { score, comment, dontUnderstand };
  }
  return out;
}

// { "CRL:1:0": "achieved", ... }
export function guideProgressToApi(rows) {
  const out = {};
  for (const { metric, level, bulletIndex, status } of rows) {
    out[`${metric}:${level}:${bulletIndex}`] = status;
  }
  return out;
}

// `company` must have been loaded with `companyInclude`.
export function companyToApi(company) {
  return {
    id: company.id,
    name: company.name,
    contactEmail: company.contactEmail,
    subscribed: company.subscribed,
    filledReadinessForm: company.filledReadinessForm,
    filledMaturityTest: company.filledMaturityTest,
    readinessLevels: readinessLevelsToApi(company.readinessLevels),
    maturityAnswers: maturityAnswersToApi(company.maturityAnswers),
    settings: {
      loginEmails: company.loginEmails.map((e) => e.email),
      description: company.settingsDescription,
      batch: company.settingsBatch,
    },
    guideProgress: guideProgressToApi(company.guideProgress),
  };
}
