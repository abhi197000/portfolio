import Link from "next/link";
import { getSource } from "../../lib/retail/source";
import { runUseCase, useCases } from "../../lib/retail/engine";
import { LAB } from "./content";
import { Shell } from "./_kit/ui";
import { shortDate } from "./_kit/format";

export const revalidate = 600;

export default async function RetailLabHub() {
  const source = await getSource();
  const [meta, stores, products, vendors, results] = await Promise.all([
    source.meta(),
    source.get("stores"),
    source.get("products"),
    source.get("vendors"),
    Promise.all(useCases().map((u) => runUseCase(u.id, source))),
  ]);

  return (
    <Shell theme="t-hub" source={source.kind} asOf={meta.as_of}>
      <section className="lab-hero hub">
        <p className="lab-kicker">
          <span>{String(results.length).padStart(2, "0")}</span>LinkedIn series · live
        </p>
        <h1>
          The decisions from the videos, <em>running on real-looking data.</em>
        </h1>
        <p className="lab-intro">
          Each episode of my allocation series became an agent here. They run on {meta.name}, a fictional US retailer: {stores.length} stores, {products.length} styles, {vendors.length} vendors and {meta.history_weeks} weeks of
          sales, as of {shortDate(meta.as_of)}, 2026. Pick a decision and change the inputs; the agent re-runs on the spot.
        </p>
      </section>

      <Link href="/retail-lab/planner" className="lab-hub-story">
        <span className="lab-hub-story-k">★ New · one story</span>
        <strong>A planner&apos;s Monday: all nine decisions, {stores.length} stores, 56 articles</strong>
        <span>Every style-color tagged with the action it needs most, the evidence behind the tag, and the video that explains it.</span>
        <span className="lab-hub-go">Read the story →</span>
      </Link>

      <div className="lab-hub-grid">
        {results.map((r) => {
          const c = LAB[r.use_case.id];
          const h = c.headline(r);
          return (
            <Link key={r.use_case.id} href={`/retail-lab/${r.use_case.id}`} className={`lab-hub-card ${c.theme}`}>
              <span className="lab-hub-swatch" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              <span className="lab-hub-n">{String(c.n).padStart(2, "0")} · {c.video}</span>
              <strong>{r.use_case.question}</strong>
              <span className="lab-hub-stat">
                <b>{h.value}</b>
                {h.label}
              </span>
              <span className="lab-hub-go">Open the agent →</span>
            </Link>
          );
        })}
      </div>

      <section className="lab-panel lab-hub-about">
        <h2>What&apos;s under the hood</h2>
        <ul>
          <li>
            <b>The data</b> is simulated week by week: stores can only sell what they hold, so stockouts censor sales the way they do in real history.
          </li>
          <li>
            <b>The agents</b> are deterministic decision rules. Every recommendation can be traced back to a number on the page.
          </li>
          <li>
            <b>Every case from the videos</b> is in the data: Store 14&apos;s Thursday stockout, Denver&apos;s &ldquo;zero demand&rdquo;, PO 4471&apos;s 27-day crossing, Monday&apos;s Sola truck into Columbus.
          </li>
        </ul>
      </section>
    </Shell>
  );
}
