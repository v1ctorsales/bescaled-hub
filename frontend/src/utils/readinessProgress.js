import { READINESS_METRICS } from "../config";
import { READINESS_LEVEL_GUIDE } from "../data/readinessLevelGuide";
import { getDuePeriods } from "./readinessPeriods";

// A level-guide "section" is one metric (CRL, TRL, ...). Any status (achieved,
// not achieved or not applicable) counts as a bullet being answered.

// True when every bullet of one level of the metric has been answered.
export function isLevelComplete(metric, level, progress) {
  const bullets = READINESS_LEVEL_GUIDE[metric]?.stages?.[level]?.bullets ?? [];
  return bullets.every((_, index) => Boolean(progress[`${metric}:${level}:${index}`]));
}

// True when every bullet of one level is marked "achieved" (not just answered).
export function isLevelAchieved(metric, level, progress) {
  const bullets = READINESS_LEVEL_GUIDE[metric]?.stages?.[level]?.bullets ?? [];
  return (
    bullets.length > 0 &&
    bullets.every((_, index) => progress[`${metric}:${level}:${index}`] === "achieved")
  );
}

// The single progress rule for the Innovation Readiness Level assessment,
// shared by the level guide's progress bar and the dashboard card:
// - total: every level-guide bullet (all levels 1–9 of the 6 metrics) plus the
//   readiness table cells of the periods that are already due (6 per period);
// - completed: bullets with any status set plus due cells with a value > 0
//   (0 means "not filled in yet").
// Periods that aren't due yet (see utils/readinessPeriods.js) count for neither.
export function getReadinessItemCounts(readinessLevels, guideProgress, now = new Date()) {
  let total = 0;
  let completed = 0;

  READINESS_METRICS.forEach((metric) => {
    Object.entries(READINESS_LEVEL_GUIDE[metric]?.stages ?? {}).forEach(([level, stage]) => {
      stage.bullets.forEach((_, index) => {
        total += 1;
        if (guideProgress?.[`${metric}:${level}:${index}`]) completed += 1;
      });
    });
  });

  getDuePeriods(now).forEach((period) => {
    READINESS_METRICS.forEach((metric) => {
      total += 1;
      if ((readinessLevels?.[period]?.[metric] ?? 0) > 0) completed += 1;
    });
  });

  return { completed, total };
}

// Percentage for a completed/total pair. Only reaches 100 when every item is
// done — 200 of 201 stays at 99.5, and the UI floors it to 99, never 100.
export function toCompletionPercent(completed, total) {
  if (total <= 0) return 0;
  if (completed >= total) return 100;
  return (completed / total) * 100;
}

// The KTH percentage shown on the dashboard card — same counts as the level
// guide's progress bar. Returns 0–100.
export function getReadinessCompletionPercent(readinessLevels, guideProgress, now = new Date()) {
  const { completed, total } = getReadinessItemCounts(readinessLevels, guideProgress, now);
  return toCompletionPercent(completed, total);
}
