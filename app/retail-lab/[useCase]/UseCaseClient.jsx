"use client";

import { useRef, useState } from "react";
import { LAB } from "../content";
import { Shell, Hero, Kpis, HowItDecides, PrevNext } from "../_kit/ui";
import OverviewView from "../_views/OverviewView";
import AvgPerStoreView from "../_views/AvgPerStoreView";
import SizeCurvesView from "../_views/SizeCurvesView";
import FixedPushView from "../_views/FixedPushView";
import StoreDepthView from "../_views/StoreDepthView";
import EndOfSeasonView from "../_views/EndOfSeasonView";
import BullwhipView from "../_views/BullwhipView";
import LeadTimeView from "../_views/LeadTimeView";
import CrossDockView from "../_views/CrossDockView";

const VIEWS = {
  "agentic-overview": OverviewView,
  "avg-per-store": AvgPerStoreView,
  "size-curves": SizeCurvesView,
  "fixed-push": FixedPushView,
  "store-depth": StoreDepthView,
  "end-of-season": EndOfSeasonView,
  bullwhip: BullwhipView,
  "lead-time": LeadTimeView,
  "cross-dock": CrossDockView,
};

// Renders the server's first result, then re-runs the engine through the API
// whenever a control changes (debounced, and only the latest response wins).
export default function UseCaseClient({ id, initial, catalog }) {
  const [data, setData] = useState(initial);
  const [params, setParams] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const timer = useRef(null);
  const latest = useRef(0);

  function update(patch) {
    const next = { ...params, ...patch };
    setParams(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const mine = ++latest.current;
      setLoading(true);
      setError(null);
      try {
        const qs = new URLSearchParams(Object.entries(next).map(([k, v]) => [k, Array.isArray(v) ? v.join(",") : String(v)]));
        const res = await fetch(`/api/retail/${id}?${qs}`);
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || res.statusText);
        if (mine === latest.current) setData(body);
      } catch (err) {
        if (mine === latest.current) setError(err.message);
      } finally {
        if (mine === latest.current) setLoading(false);
      }
    }, 220);
  }

  const View = VIEWS[id];
  return (
    <Shell theme={LAB[id].theme} active={id} source={data.source} asOf={data.as_of}>
      <Hero id={id} question={data.use_case.question} />
      <Kpis items={data.kpis} />
      {error && <p className="lab-error">Couldn&apos;t re-run the agent: {error}</p>}
      <div className={`lab-view ${loading ? "is-loading" : ""}`}>
        <View data={data} params={params} update={update} loading={loading} catalog={catalog} />
      </div>
      <HowItDecides id={id} />
      <PrevNext id={id} />
    </Shell>
  );
}
