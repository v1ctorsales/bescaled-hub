import { READINESS_SCALE_MIN } from "../config";

// The backend stores 0 for "not filled in yet" (every new company starts
// there), but the scale — and the level guide, table and radar chart — start
// at READINESS_SCALE_MIN. Use this wherever a stored level is displayed or
// used to look up a guide stage.
export function levelOrMin(value) {
  return Number.isFinite(value) && value >= READINESS_SCALE_MIN ? value : READINESS_SCALE_MIN;
}
