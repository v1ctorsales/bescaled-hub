import { READINESS_METRICS, READINESS_YEARS, READINESS_SCALE_MIN } from "../config";
import { READINESS_LEVEL_GUIDE } from "../data/readinessLevelGuide";

// A level-guide "section" is one metric (CRL, TRL, ...). Any status (achieved,
// not achieved or not applicable) counts as a bullet being answered.

// True when every bullet of one level of the metric has been answered.
export function isLevelComplete(metric, level, progress) {
  const bullets = READINESS_LEVEL_GUIDE[metric]?.stages?.[level]?.bullets ?? [];
  return bullets.every((_, index) => Boolean(progress[`${metric}:${level}:${index}`]));
}

// True when every bullet of one level is "achieved" or "not-applicable" — what
// moves the level guide's "You are here" progress bar forward. "Not achieved"
// is an answer, but it doesn't clear the level.
export function isLevelCleared(metric, level, progress) {
  const bullets = READINESS_LEVEL_GUIDE[metric]?.stages?.[level]?.bullets ?? [];
  return bullets.every((_, index) => {
    const status = progress[`${metric}:${level}:${index}`];
    return status === "achieved" || status === "not-applicable";
  });
}

// True when every bullet of one level is marked "achieved" (not just answered).
export function isLevelAchieved(metric, level, progress) {
  const bullets = READINESS_LEVEL_GUIDE[metric]?.stages?.[level]?.bullets ?? [];
  return (
    bullets.length > 0 &&
    bullets.every((_, index) => progress[`${metric}:${level}:${index}`] === "achieved")
  );
}

// A level-guide section (metric) counts as complete once its level 1 is fully
// answered — the same moment its "*" disappears on the level guide tabs.
export function isSectionComplete(metric, progress) {
  return isLevelComplete(metric, READINESS_SCALE_MIN, progress);
}

// The KTH percentage shown on the dashboard: 50% is the readiness chart (share
// of year × metric scores the company has filled in — 0 means "not filled
// yet") and 50% is the level guide, where each of the 6 sections adds an equal
// share (8.33%) once complete. Returns 0–100.
export function getReadinessCompletionPercent(readinessLevels, guideProgress) {
  const totalCells = READINESS_YEARS.length * READINESS_METRICS.length;
  const filledCells = READINESS_YEARS.reduce(
    (count, year) =>
      count + READINESS_METRICS.filter((metric) => (readinessLevels[year]?.[metric] ?? 0) > 0).length,
    0,
  );
  const chartPercent = (filledCells / totalCells) * 50;

  const completeSections = READINESS_METRICS.filter((metric) =>
    isSectionComplete(metric, guideProgress),
  ).length;
  const guidePercent = (completeSections / READINESS_METRICS.length) * 50;

  return chartPercent + guidePercent;
}
