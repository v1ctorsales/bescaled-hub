import { READINESS_YEARS } from "../config";
import { monthYearToIndex } from "./validation";

// A reporting period ("MM/YYYY", see READINESS_YEARS) is due once its month
// has started: 10/2026 is due from October 2026 on, 02/2027 from February
// 2027. Periods that aren't due yet can't be measured, so they stay out of
// the progress count. `now` is a parameter so tests can fix the date.
export function isPeriodDue(period, now = new Date()) {
  const periodIndex = monthYearToIndex(period);
  if (periodIndex === null) return false;
  return periodIndex <= now.getFullYear() * 12 + now.getMonth() + 1;
}

// The READINESS_YEARS periods that are due at `now`, in order.
export function getDuePeriods(now = new Date()) {
  return READINESS_YEARS.filter((period) => isPeriodDue(period, now));
}
