// Request-body validators used by the controllers, so bad input is rejected
// with a 400 before anything reaches the database.

export const isPlainObject = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
export const isNonEmptyString = (v, max) =>
  typeof v === "string" && v.trim().length > 0 && v.length <= max;
export const isIntInRange = (v, min, max) => Number.isInteger(v) && v >= min && v <= max;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const isEmail = (v) => typeof v === "string" && v.length <= 254 && EMAIL_RE.test(v);

// Ids for maturity dimensions/stages are frontend-owned content (e.g.
// "human-agency-oversight"), so only their shape is checked here.
export const isSlug = (v) => typeof v === "string" && /^[a-z0-9-]{1,64}$/.test(v);

// 0 = "not filled yet" (what every new company starts with); 1-9 is the KTH scale.
export const READINESS_VALUE_MIN = 0;
export const READINESS_VALUE_MAX = 9;
export const GUIDE_LEVEL_MIN = 1;
export const GUIDE_LEVEL_MAX = 9;
export const MATURITY_SCORE_MIN = 0;
export const MATURITY_SCORE_MAX = 4;
export const GUIDE_STATUSES = ["achieved", "not-achieved", "not-applicable"];
export const MAX_LOGIN_EMAILS = 3;
export const BATCH_MIN = 1;
export const BATCH_MAX = 9;

// Months are "MM/YYYY" (e.g. "10/2026"). Returns a sortable month index
// (year * 12 + month) or null when the text isn't a real month.
export function monthYearToIndex(value) {
  const match = typeof value === "string" ? /^(\d{2})\/(\d{4})$/.exec(value) : null;
  if (!match) return null;
  const month = Number(match[1]);
  const year = Number(match[2]);
  if (month < 1 || month > 12 || year < 2000 || year > 2100) return null;
  return year * 12 + month;
}
