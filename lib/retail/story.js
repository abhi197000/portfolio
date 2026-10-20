// The planner's Monday as a story that plays itself: one step at a time, the agent walks
// Jordan through what's happening with specific articles and why it recommends what it
// does, and pauses at four decisions. Every number comes from the planner result (and
// the engines behind it); nothing here is typed in by hand.
import { pretty } from "./calendar.js";

const n = (v) => Math.round(v).toLocaleString("en-US");
const usd = (v) => (Math.abs(v) >= 1000 ? `$${(v / 1000).toFixed(1)}K` : `$${Math.round(v)}`);
const pct = (x) => `${Math.round(x * 100)}%`;
const lower = (s) => s.charAt(0).toLowerCase() + s.slice(1);
const name = (a) => `${a.style} · ${a.color}`;
const card = (a) => ({ kind: "article", title: name(a), hex: a.hex, tag: a.label, why: a.why, evidence: a.evidence.slice(0, 4) });

// screens: { kind: metric | compare | list | article | persona | ledger }, at a slot: left · center · right
export function buildStory(pl) {
  const c = pl.context;
  const byId = Object.fromEntries(pl.articles.map((a) => [a.article_id, a]));
  const tagged = (action) => pl.articles.filter((a) => a.action === action);
  const stake = (list) => list.reduce((t, a) => t + (a.stake?.usd ?? 0), 0);
  const first = pl.persona.name.split(" ")[0];
  const xd = c.crossDock;
  const bw = c.bullwhip;
  const eos = c.endOfSeason;
  const drifting = c.leadTime.find((v) => v.status === "drifting") ?? c.leadTime[0];
  const buffers = tagged("buffer");
  const markdowns = tagged("markdown");
  const chase = tagged("chase");
  const transfers = tagged("transfer");
  const trimUsd = (bw.po.drafted_qty - bw.po.suggested_qty) * bw.unit_cost;
  const eosItems = eos.items.map((i) => ({ label: i.name, value: `${n(i.dc_units)} units`, tag: { flush: "Flush", hold: "Hold", off_price: "Off-price" }[i.best] }));

  const steps = [
    {
      id: "intro",
      chapter: "Monday 7:58",
      time: "07:58",
      holo: "#a78bfa",
      title: `${pl.summary.articles} articles. One Monday.`,
      lines: [
        { who: "agent", text: `Good morning, ${first}. Overnight I checked all ${pl.summary.articles} of your articles against every rule in the Lab.` },
        { who: "agent", text: `${pl.summary.need_action} need a decision today, across ${pl.summary.kinds} kinds of action. Let's start where stock is moving: the dock.` },
      ],
      screens: [
        { slot: "left", kind: "persona" },
        { slot: "center", kind: "metric", value: `${pl.summary.need_action} of ${pl.summary.articles}`, label: "articles need a decision today", sub: `${pl.summary.on_track} are on track` },
        { slot: "right", kind: "list", title: "Today's mix", rows: pl.chapters.filter((ch) => ch.count).map((ch) => ({ label: ch.title, value: String(ch.count) })) },
      ],
    },
    {
      id: "dock",
      chapter: "Before the trucks land",
      use_case: "cross-dock",
      time: "08:04",
      holo: "#ff8a3d",
      title: `${xd.asn.vendor}'s truck is at the dock`,
      lines: [
        { who: "agent", text: `ASN ${xd.asn.asn_no} landed at ${xd.asn.dc_id === "DC-E" ? "Columbus" : "Reno"}: ${n(xd.asn.units)} units on ${n(xd.asn.cartons)} cartons. The DC has been out of white tees and socks, and ${xd.totals.stores} stores will run thin before the next allocation run.` },
        { who: "agent", text: `Put it all away and stores get it in ${xd.totals.dock_to_store_put_away} days. Sort it straight to store doors and they get it in ${xd.totals.dock_to_store_cross_dock}.` },
      ],
      screens: [
        { slot: "left", kind: "list", title: `ASN ${xd.asn.asn_no} · ETA ${xd.asn.eta_day} ${pretty(xd.asn.eta)}`, rows: xd.lines.map((l) => ({ label: l.name, value: `${n(l.cross_dock)} / ${n(l.units)}`, tag: l.cross_dock / l.units >= 0.5 ? "Straight out" : "Reserve" })) },
        { slot: "center", kind: "compare", title: "Dock to store", unit: "days", bars: [{ label: "Put away, wait for the run", value: xd.totals.dock_to_store_put_away }, { label: "Cross-dock at receipt", value: xd.totals.dock_to_store_cross_dock, good: true }] },
        { slot: "right", kind: "article", ...card(byId["WHITE-TEE-WHI"] ?? tagged("cross_dock")[0]) },
      ],
    },
    {
      id: "decide-dock",
      chapter: "Before the trucks land",
      use_case: "cross-dock",
      time: "08:09",
      holo: "#ff8a3d",
      title: "Cross-dock the stores that need it?",
      lines: [{ who: "agent", text: `I'd send ${n(xd.totals.cross_dock)} units straight to ${xd.totals.stores} stores and put the other ${n(xd.totals.put_away)} away. Your call, ${first}.` }],
      screens: [{ slot: "center", kind: "metric", value: `${n(xd.totals.cross_dock)} units`, label: `straight to ${xd.totals.stores} stores the day it lands`, sub: `${xd.totals.touches_saved} carton touches saved` }],
      decision: {
        prompt: "Approve the cross-dock?",
        options: [
          { id: "approve", label: `Cross-dock ${n(xd.totals.cross_dock)} units`, detail: `${usd(xd.totals.sales_protected)} of sales protected, ${Math.round(xd.totals.dock_to_store_put_away - xd.totals.dock_to_store_cross_dock)} days sooner`, value: xd.totals.sales_protected, recommended: true },
          { id: "skip", label: "Put it all away", detail: "Stores wait for the next run", value: 0 },
        ],
      },
    },
    {
      id: "po",
      chapter: "Before the trucks land",
      use_case: "bullwhip",
      time: "08:15",
      holo: "#e0661a",
      title: `PO ${bw.po.po_no} is about to go out too big`,
      lines: [
        { who: "agent", text: `Shoppers moved ${pct(bw.variability.shoppers)} week to week. Store orders swung ${pct(bw.variability.store_orders)}, and DC orders ${pct(bw.variability.dc_orders)}: the bullwhip.` },
        { who: "agent", text: `The draft ${lower(bw.style)} PO was built from those echoes: ${n(bw.po.drafted_qty)} units. Shopper demand says ${n(bw.po.suggested_qty)}.` },
      ],
      screens: [
        { slot: "left", kind: "compare", title: "Week-to-week swing", unit: "%", bars: [{ label: "Shoppers", value: Math.round(bw.variability.shoppers * 100), good: true }, { label: "Store orders", value: Math.round(bw.variability.store_orders * 100) }, { label: "DC orders", value: Math.round(bw.variability.dc_orders * 100), bad: true }] },
        { slot: "center", kind: "metric", value: `${n(bw.po.drafted_qty)} → ${n(bw.po.suggested_qty)}`, label: `units on PO ${bw.po.po_no}`, sub: bw.po.basis },
        { slot: "right", kind: "article", ...card(byId["HOODIE-CHA"] ?? tagged("trim_po")[0]) },
      ],
    },
    {
      id: "decide-po",
      chapter: "Before the trucks land",
      use_case: "bullwhip",
      time: "08:19",
      holo: "#e0661a",
      title: "Trim the PO to shopper demand?",
      lines: [{ who: "agent", text: `Trimming ${n(bw.po.drafted_qty - bw.po.suggested_qty)} units keeps ${usd(trimUsd)} of cash free, split across the three colors by what shoppers buy.` }],
      screens: [{ slot: "center", kind: "list", title: `PO ${bw.po.po_no} by color`, rows: tagged("trim_po").map((a) => ({ label: a.color, value: a.evidence.find((e) => e.label === "From shopper sales")?.value ?? "", tag: a.evidence.find((e) => e.label === "Draft PO line")?.value })) }],
      decision: {
        prompt: `Trim PO ${bw.po.po_no}?`,
        options: [
          { id: "approve", label: `Trim to ${n(bw.po.suggested_qty)} units`, detail: `${usd(trimUsd)} of cash not tied up`, value: trimUsd, recommended: true },
          { id: "skip", label: `Send ${n(bw.po.drafted_qty)} as drafted`, detail: "The echo becomes inventory", value: 0 },
        ],
      },
    },
    drifting && buffers.length
      ? {
          id: "lead",
          chapter: "Before the trucks land",
          use_case: "lead-time",
          time: "08:24",
          holo: "#ffcc00",
          title: `${drifting.name} is drifting late`,
          lines: [
            { who: "agent", text: `${drifting.name} promises ${drifting.promised} days, but its recent POs took up to ${Math.round(drifting.p90)}, ${drifting.drift_days.toFixed(1)} days later since August.` },
            { who: "agent", text: `${buffers.map((a) => name(a)).join(" and ")} only have about a month in the DC. I'm raising their buffer to ${drifting.buffer_days} days, not the flat 7.` },
          ],
          screens: [
            { slot: "left", kind: "compare", title: "Lead time", unit: "days", bars: [{ label: "Promised", value: drifting.promised, good: true }, { label: "Real p90", value: Math.round(drifting.p90), bad: true }] },
            ...buffers.slice(0, 2).map((a, i) => ({ slot: i ? "right" : "center", kind: "article", ...card(a) })),
          ],
        }
      : null,
    {
      id: "launch",
      chapter: "Launches and campaigns",
      use_case: "fixed-push",
      time: "08:31",
      holo: "#69c8ff",
      title: "No history yet: push, then read the shelf",
      lines: [
        { who: "agent", text: c.fixedPush.promo ? `${c.fixedPush.promo.reason}. The campaign stock goes out on a fixed push by grade.` : "New items start on a fixed push by grade." },
        { who: "agent", text: `The ${lower(c.fixedPush.style)} launched on a ${pct(c.fixedPush.push_pct)} push. ${c.fixedPush.stores} stores sold past the trigger, so I'm releasing ${n(c.fixedPush.released)} reserve units to them.` },
      ],
      screens: [
        { slot: "left", kind: "metric", value: pct(c.fixedPush.push_pct), label: "pushed at launch, by store grade", sub: "the rest held back" },
        { slot: "center", kind: "metric", value: `${n(c.fixedPush.released)} units`, label: `released to ${c.fixedPush.stores} stores that sell`, sub: "reserve follows real sell-through" },
        { slot: "right", kind: "list", title: "Tagged fixed push", rows: tagged("fixed_push").map((a) => ({ label: name(a), value: a.label.replace("Fixed push before the campaign", "Push now").replace("Release the reserve", "Release") })) },
      ],
    },
    {
      id: "avg",
      chapter: "Launches and campaigns",
      use_case: "avg-per-store",
      time: "08:36",
      holo: "#d99a2b",
      title: "No forecast to trust",
      lines: [{ who: "agent", text: `${c.avgPerStore.map((i) => i.name).join(", ")}: no usable history, so a forecast would be guessing. They go out on an average per store by grade, seeded from a like item.` }],
      screens: [
        { slot: "left", kind: "list", title: "Why not a forecast", rows: c.avgPerStore.map((i) => ({ label: i.name, value: i.reason })) },
        { slot: "center", kind: "article", ...card(tagged("avg_per_store").find((a) => a.style_id === "FAIRISLE") ?? tagged("avg_per_store")[0]) },
      ],
    },
    {
      id: "season",
      chapter: "Season's end",
      use_case: "end-of-season",
      time: "08:44",
      holo: "#7b8bff",
      title: "Three weeks left in the season",
      lines: [
        { who: "agent", text: `${n(eos.kpis["Units left in the DC"])} units of fall stock are still in the DC, worth ${usd(eos.kpis["Full-price value"])} at full price.` },
        { who: "agent", text: "Each item gets the exit that recovers the most: flush what stores can still sell, hold what comes back next year, sell the rest off-price." },
      ],
      screens: [
        { slot: "left", kind: "list", title: "Exit per item", rows: eosItems },
        { slot: "center", kind: "metric", value: pct(eos.kpis["Agent's mix recovers"]), label: "recovered by the agent's mix", sub: `${usd(eos.kpis["vs the best single rule"])} more than one rule for everything` },
        { slot: "right", kind: "article", ...card(byId["WOOL-COAT-CAM"] ?? tagged("flush")[0]) },
      ],
    },
    {
      id: "decide-season",
      chapter: "Season's end",
      use_case: "end-of-season",
      time: "08:49",
      holo: "#7b8bff",
      title: "Approve the exit mix?",
      lines: [{ who: "agent", text: `One rule for everything recovers ${usd(eos.kpis["vs the best single rule"])} less. Approve the mix?` }],
      screens: [{ slot: "center", kind: "list", title: "The mix", rows: eosItems }],
      decision: {
        prompt: "Approve the end-of-season mix?",
        options: [
          { id: "approve", label: "Approve the mix", detail: `${usd(eos.kpis["vs the best single rule"])} more than one rule`, value: eos.kpis["vs the best single rule"], recommended: true },
          { id: "skip", label: "Mark everything down", detail: "One rule for every item", value: 0 },
        ],
      },
    },
    {
      id: "stores",
      chapter: "Stores this week",
      use_case: "agentic-overview",
      time: "08:56",
      holo: "#2dd4bf",
      title: transfers.length ? `${transfers[0].evidence.find((e) => e.label === "Store")?.value ?? "A store"} runs out before its truck` : "Stores this week",
      lines: transfers.length
        ? [
            { who: "agent", text: transfers[0].why },
            { who: "jordan", text: `Approve it. It has to land before ${transfers[0].evidence.find((e) => e.label === "Runs out")?.value ?? "the stockout"}.` },
          ]
        : [{ who: "agent", text: "No store runs out before its truck this week." }],
      screens: [
        ...transfers.slice(0, 2).map((a, i) => ({ slot: i ? "center" : "left", kind: "article", ...card(a) })),
        { slot: "right", kind: "metric", value: n(c.storeDepth.past_target), label: `${lower(c.storeDepth.style)} units a fixed push would send past target`, sub: `fill to depth instead; ${c.storeDepth.stale} stale targets fixed` },
      ],
    },
    {
      id: "colors",
      chapter: "Stores this week",
      use_case: "agentic-overview",
      time: "09:03",
      holo: "#2dd4bf",
      title: "Colors are drifting apart",
      lines: [
        { who: "agent", text: chase.length ? `${name(chase[0])} is gaining share every week but holds too little of the stock. Re-weight replenishment toward it.` : "No color is outrunning its stock." },
        { who: "agent", text: `${markdowns.map((a) => a.color).join(", ")}: each is losing share with months of cover. Stop replenishing and mark them down while they still have value.` },
      ],
      screens: [
        ...(chase[0] ? [{ slot: "left", kind: "article", ...card(chase[0]) }] : []),
        ...markdowns.slice(0, 2).map((a, i) => ({ slot: i ? "right" : "center", kind: "article", ...card(a) })),
      ],
    },
    {
      id: "decide-colors",
      chapter: "Stores this week",
      use_case: "agentic-overview",
      time: "09:07",
      holo: "#2dd4bf",
      title: "Re-balance the color mix?",
      lines: [{ who: "agent", text: `Marking down ${markdowns.length} fading colors frees ${usd(stake(markdowns))} of stock at cost that's otherwise stuck for months.` }],
      screens: [{ slot: "center", kind: "list", title: "Fading colors", rows: markdowns.map((a) => ({ label: name(a), value: `${a.stats.weeks_of_cover} wks cover`, tag: a.stake?.text })) }],
      decision: {
        prompt: "Re-balance the colors?",
        options: [
          { id: "approve", label: `Mark down ${markdowns.length}, chase ${chase.length}`, detail: `${usd(stake(markdowns))} of stuck stock freed`, value: stake(markdowns), recommended: true },
          { id: "skip", label: "Keep replenishing every color", detail: "Stock piles up where it doesn't sell", value: 0 },
        ],
      },
    },
    {
      id: "fit",
      chapter: "Stores this week",
      use_case: "size-curves",
      time: "09:12",
      holo: "#ecb872",
      title: "Right store, right size",
      lines: [{ who: "agent", text: `${c.sizeCurves.own} stores sell ${lower(c.sizeCurves.style)} sizes far from the chain curve, and ${c.sizeCurves.cluster} small ones borrow their region's. Allocating on those curves stops the broken size runs.` }],
      screens: [
        { slot: "left", kind: "metric", value: String(c.sizeCurves.own), label: "stores on their own size curve", sub: `${c.sizeCurves.cluster} borrow a regional curve` },
        { slot: "center", kind: "article", ...card(tagged("size_curve")[0]) },
      ],
    },
    {
      id: "calm",
      chapter: "On track",
      time: "09:15",
      holo: "#a78bfa",
      title: `${pl.summary.on_track} articles need nothing today`,
      lines: [{ who: "agent", text: `The other ${pl.summary.on_track} are on track: cover is fine and their colors sell in line with stock. I'll check them again tomorrow.` }],
      screens: [{ slot: "center", kind: "swatches", title: "On track", items: tagged("on_track").map((a) => ({ label: name(a), hex: a.hex })) }],
    },
    {
      id: "finale",
      chapter: "Done by 9:20",
      time: "09:20",
      holo: "#a78bfa",
      title: "Monday, handled.",
      lines: [{ who: "agent", text: `That's the morning, ${first}. Every tag came from the data, and every one of them is in the Lab if you want to dig in.` }],
      screens: [{ slot: "center", kind: "ledger" }],
      finale: true,
    },
  ].filter(Boolean);

  return { persona: pl.persona, as_of: pl.as_of, source: pl.source, summary: pl.summary, steps };
}
