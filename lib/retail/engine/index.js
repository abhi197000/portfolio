// The retail demo's use cases, one per LinkedIn video, in video order. Each engine
// is deterministic decision logic over the demo data — no model calls.
import { AS_OF } from "../calendar.js";
import * as overview from "./agentOverview.js";
import * as avgPerStore from "./avgPerStore.js";
import * as sizeCurves from "./sizeCurves.js";
import * as fixedPush from "./fixedPush.js";
import * as storeDepth from "./storeDepth.js";
import * as endOfSeason from "./endOfSeason.js";
import * as bullwhip from "./bullwhip.js";
import * as leadTime from "./leadTime.js";

export const ENGINES = [overview, avgPerStore, sizeCurves, fixedPush, storeDepth, endOfSeason, bullwhip, leadTime];
const BY_ID = Object.fromEntries(ENGINES.map((e) => [e.meta.id, e]));

export const useCases = () => ENGINES.map((e) => e.meta);

export async function runUseCase(id, source, params = {}) {
  const engine = BY_ID[id];
  if (!engine) return null;
  const result = await engine.run(source, params);
  return { use_case: engine.meta, as_of: AS_OF, source: source.kind, ...result };
}
