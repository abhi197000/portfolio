// Allocation rules shared by the data generator (which "ran" them in the past) and
// the engines (which evaluate them now), so both always agree on the arithmetic.
import { apportion } from "./stats.js";

// relative store volume by grade (a B store is the baseline)
export const GRADE_VOLUME = { A: 1.7, B: 1.0, C: 0.62 };

// a fixed push splits the pushed share across stores by grade, not by demand
export const PUSH_WEIGHT = { A: 1.75, B: 1.3, C: 1.0 };

// store depth targets in units, by grade, for depth-managed styles
export const DEPTH_BY_GRADE = {
  "CHINO-KHK": { A: 120, B: 80, C: 60 },
  "CHINO-BLK": { A: 90, B: 60, C: 40 },
  "WHITE-TEE": { A: 96, B: 64, C: 48 },
  "RETRO-RUNNER": { A: 36, B: 24, C: 18 },
};

export function pushPlan(stores, dcTotal, pct) {
  const pushTotal = Math.round(dcTotal * pct);
  const units = apportion(pushTotal, stores.map((s) => PUSH_WEIGHT[s.grade]));
  return stores.map((s, i) => ({ store_no: s.store_no, grade: s.grade, units: units[i] }));
}
