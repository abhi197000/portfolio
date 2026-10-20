// The retail demo's use cases, one per LinkedIn video, in video order. Each engine
// is deterministic decision logic over the demo data — no model calls.
import { AS_OF } from "../calendar.js";
import { generatedSource, dataVersion } from "../source.js";
import * as overview from "./agentOverview.js";
import * as avgPerStore from "./avgPerStore.js";
import * as sizeCurves from "./sizeCurves.js";
import * as fixedPush from "./fixedPush.js";
import * as storeDepth from "./storeDepth.js";
import * as endOfSeason from "./endOfSeason.js";
import * as bullwhip from "./bullwhip.js";
import * as leadTime from "./leadTime.js";
import * as crossDock from "./crossDock.js";

export const ENGINES = [overview, avgPerStore, sizeCurves, fixedPush, storeDepth, endOfSeason, bullwhip, leadTime, crossDock];
const BY_ID = Object.fromEntries(ENGINES.map((e) => [e.meta.id, e]));

export const useCases = () => ENGINES.map(({ meta: { minDataVersion, ...m } }) => m);

export async function runUseCase(id, source, params = {}) {
  const engine = BY_ID[id];
  if (!engine) return null;
  // a use case newer than the seeded data runs on the generated copy until the seed catches up
  const needs = engine.meta.minDataVersion;
  const src = needs && (await dataVersion(source)) < needs ? generatedSource() : source;
  const { minDataVersion, ...meta } = engine.meta;
  const result = await engine.run(src, params);
  return { use_case: meta, as_of: AS_OF, source: src.kind, ...result };
}
