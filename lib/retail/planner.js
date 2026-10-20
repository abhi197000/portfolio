// The planner's Monday: every article (style-color) tagged with the one action it needs
// most, and the numbers behind the tag. It runs the nine use-case engines once, splits
// their style-level results down to colors, and checks each article against the rules
// below in order of urgency: inbound trucks first, then launches, season end, and the
// stores. The first rule whose numbers hold wins; any later ones show up as "also".
import { AS_OF, addDays, daysBetween, weekday, pretty } from "./calendar.js";
import { apportion, sum, round } from "./stats.js";
import { runUseCase } from "./engine/index.js";
import { deriveArticles, articleStats } from "./articles.js";
import { generatedSource, dataVersion } from "./source.js";

// articles arrived in v3: an older seed runs the story on the generated copy until it's upgraded
export async function plannerData(source) {
  return runPlanner((await dataVersion(source)) < 3 ? generatedSource() : source);
}

export const PERSONA = {
  name: "Jordan Ellis",
  role: "Allocation & replenishment planner",
  team: "Cobalt Lane Apparel · Merchandise planning",
  scope: "56 articles across 40 stores and 2 DCs",
};

export const ACTIONS = {
  cross_dock: { label: "Cross-dock at receipt", use_case: "cross-dock", chapter: "inbound" },
  trim_po: { label: "Trim the draft PO", use_case: "bullwhip", chapter: "inbound" },
  buffer: { label: "Raise the DC buffer", use_case: "lead-time", chapter: "inbound" },
  fixed_push: { label: "Fixed push, then chase", use_case: "fixed-push", chapter: "launch" },
  avg_per_store: { label: "Allocate by average per store", use_case: "avg-per-store", chapter: "launch" },
  flush: { label: "Flush to stores", use_case: "end-of-season", chapter: "season" },
  hold: { label: "Hold for next season", use_case: "end-of-season", chapter: "season" },
  off_price: { label: "Sell off-price", use_case: "end-of-season", chapter: "season" },
  markdown: { label: "Mark down the color", use_case: "agentic-overview", chapter: "stores" },
  transfer: { label: "Transfer before the stockout", use_case: "agentic-overview", chapter: "stores" },
  store_depth: { label: "Fill to store depth", use_case: "store-depth", chapter: "stores" },
  size_curve: { label: "Allocate on store size curves", use_case: "size-curves", chapter: "stores" },
  chase: { label: "Chase the color", use_case: "agentic-overview", chapter: "stores" },
  on_track: { label: "On track", use_case: null, chapter: "on_track" },
};

export const CHAPTERS = [
  { id: "inbound", n: 1, title: "Before the trucks land", kicker: "Vendor → DC", actions: ["cross_dock", "trim_po", "buffer"], intro: "Monday starts upstream: what's on the dock today, which POs are about to go out too big, and which vendors are drifting late." },
  { id: "launch", n: 2, title: "Launches and campaigns", kicker: "No history yet", actions: ["fixed_push", "avg_per_store"], intro: "Articles without a sales history can't be forecast. Push to start and read the shelf, or allocate on an average per store by grade." },
  { id: "season", n: 3, title: "Season's end", kicker: "Fall '26 closes Nov 8", actions: ["flush", "hold", "off_price"], intro: "Three weeks before the season ends, every unit left in the DC gets an exit: flush it to stores that still sell, hold it for next year, or sell it off-price now." },
  { id: "stores", n: 4, title: "Stores this week", kicker: "DC → store", actions: ["transfer", "chase", "markdown", "store_depth", "size_curve"], intro: "Then the stores: a stockout before the next truck, colors selling faster or slower than their stock, depth targets gone stale, and size runs that don't match the chain." },
  { id: "on_track", n: 5, title: "On track", kicker: "No action today", actions: ["on_track"], intro: "The rest need nothing today: no rule's numbers hold for them. A few carry a lot of stock but aren't losing share, so they're worth watching. The agent checks them all again tomorrow." },
];

// thresholds, in one place so the page can quote them
export const RULES = {
  markdown: { cover: 12, mixTrend: -0.03 },
  chase: { mixTrend: 0.03, mixGap: 0.8 },
};

const pct = (x) => `${Math.round(x * 100)}%`;
const pct1 = (x) => `${(x * 100).toFixed(1)}%`;
const money = (v) => (v >= 1000 ? `$${(v / 1000).toFixed(1)}K` : `$${Math.round(v)}`);
const n = (v) => Math.round(v).toLocaleString("en-US");

export async function runPlanner(src) {
  const [articles, products, stores, vendors, salesWeekly, storeInventory, dcInventory] = await Promise.all([
    src.get("articles"),
    src.get("products"),
    src.get("stores"),
    src.get("vendors"),
    src.get("salesWeekly"),
    src.get("storeInventory"),
    src.get("dcInventory"),
  ]);
  const ids = ["agentic-overview", "avg-per-store", "size-curves", "fixed-push", "store-depth", "end-of-season", "bullwhip", "lead-time", "cross-dock"];
  const uc = Object.fromEntries(await Promise.all(ids.map(async (id) => [id, await runUseCase(id, src)])));
  const productBy = Object.fromEntries(products.map((p) => [p.style_id, p]));
  const vendorBy = Object.fromEntries(vendors.map((v) => [v.vendor_id, v]));
  const storeBy = Object.fromEntries(stores.map((s) => [s.store_no, s]));
  const { weeks, articles: derived } = deriveArticles({ articles, stores, salesWeekly, storeInventory, dcInventory });
  const siblings = (styleId) => articles.filter((a) => a.style_id === styleId);
  const styleWeekly = {};
  for (const a of articles) {
    const w = derived[a.article_id].weekly;
    styleWeekly[a.style_id] = styleWeekly[a.style_id] ? styleWeekly[a.style_id].map((v, i) => v + w[i]) : [...w];
  }
  // split a style-level number across its colors by mix, in whole case packs when asked
  const share = (styleId, articleId, total, { mix = "sales_mix", pack = 1 } = {}) => {
    const sib = siblings(styleId);
    const parts = apportion(Math.round(total / pack), sib.map((a) => Number(a[mix])));
    return parts[sib.findIndex((a) => a.article_id === articleId)] * pack;
  };

  const xd = uc["cross-dock"];
  const bw = uc.bullwhip;
  const lt = uc["lead-time"];
  const eos = uc["end-of-season"];
  const aps = uc["avg-per-store"];
  const fp = uc["fixed-push"];
  const sd = uc["store-depth"];
  const sc = uc["size-curves"];
  const ov = uc["agentic-overview"];
  const ltBy = Object.fromEntries(lt.vendors.map((v) => [v.vendor_id, v]));

  // each rule returns null, or { label?, why, evidence: [[label, value, tone?]], rule, stake? }
  const RULESET = [
    ["cross_dock", (a, p, s, d) => {
      const line = xd.lines.find((l) => l.style_id === a.style_id);
      if (!line || !["cross_dock", "split"].includes(line.decision)) return null;
      const units = share(a.style_id, a.article_id, line.cross_dock, { pack: p.case_pack });
      if (!units) return null;
      const onTruck = share(a.style_id, a.article_id, line.units, { pack: p.case_pack });
      const protectedUsd = (line.sales_protected * units) / Math.max(1, line.cross_dock) * Number(p.full_price);
      return {
        why: `${line.stores} ${xd.asn.dc_id === "DC-E" ? "Columbus" : "Reno"} stores run thin on ${p.name.toLowerCase()} before the next allocation run could reach them, and the DC has ${line.reserve_before ? n(line.reserve_before) : "none"} in reserve. Sort ${n(units)} ${a.color.toLowerCase()} units to store doors the day ${xd.asn.vendor}'s truck lands.`,
        evidence: [[`On ASN ${xd.asn.asn_no}`, `${n(onTruck)} units`], ["Straight to stores", `${n(units)} units`, "accent"], ["Dock to store", `${xd.totals.dock_to_store_put_away} → ${xd.totals.dock_to_store_cross_dock} days`], [`${xd.asn.dc_id === "DC-E" ? "Columbus" : "Reno"} reserve`, n(d.dc[xd.asn.dc_id] ?? 0), d.dc[xd.asn.dc_id] ? "" : "bad"]],
        rule: "A store is cross-docked if, waiting for the put-away route, it would dip under its display minimum plus 3 days of sales.",
        stake: { usd: protectedUsd, label: "sales protected" },
      };
    }],
    ["trim_po", (a, p) => {
      const po = bw.po_check;
      if (bw.focus?.style_id !== a.style_id || !po || po.delta >= 0) return null;
      const drafted = share(a.style_id, a.article_id, po.drafted_qty, { pack: p.case_pack });
      const suggested = share(a.style_id, a.article_id, po.suggested_qty, { pack: p.case_pack });
      return {
        why: `Shoppers moved ${pct(bw.variability.shoppers)} week to week; store orders swung ${pct(bw.variability.store_orders)} and DC orders ${pct(bw.variability.dc_orders)}. Size ${a.color.toLowerCase()} on PO ${po.po_no} from shopper sales: ${n(suggested)}, not ${n(drafted)}.`,
        evidence: [["Draft PO line", `${n(drafted)} units`], ["From shopper sales", `${n(suggested)} units`, "accent"], ["Shopper variability", pct(bw.variability.shoppers)], ["DC order variability", pct(bw.variability.dc_orders), "bad"]],
        rule: "The next PO covers the order cycle from shopper sales (POS) plus a small safety margin, not from store orders.",
        stake: { usd: (drafted - suggested) * Number(p.unit_cost), label: "of cash not tied up" },
      };
    }],
    ["buffer", (a, p, s) => {
      const v = ltBy[p.vendor_id];
      if (!v || !["drifting", "watch"].includes(v.status) || !s.weekly_rate) return null;
      const coverDays = s.dc_units / (s.weekly_rate / 7);
      // a PO placed today lands at the vendor's real p90; the DC has to last that long plus the buffer
      if (coverDays >= v.p90 + v.buffer_days) return null;
      const lateBy = Math.max(0, Math.round(v.p90 - v.promised));
      return {
        why: `${v.name} promises ${v.promised} days but its recent POs took up to ${Math.round(v.p90)}${v.status === "drifting" ? `, ${round(v.drift_days, 1)} days later since August` : ""}. ${a.color} has ${Math.round(coverDays)} days of DC stock: size its buffer to ${v.buffer_days} days, not the flat 7.`,
        evidence: [["Promised lead time", `${v.promised} days`], ["Real p90", `${Math.round(v.p90)} days`, "bad"], ["DC cover", `${Math.round(coverDays)} days`, "warn"], ["Buffer it needs", `${v.buffer_days} days`, "accent"]],
        rule: "Vendor drifting or on watch, and DC cover shorter than its real p90 lead time plus the buffer it needs.",
        stake: { usd: (s.weekly_rate / 7) * lateBy * Number(p.full_price), label: "of sales a late PO would cost" },
      };
    }],
    ["fixed_push", (a, p, s) => {
      const m = sd.methods.find((x) => x.style_id === a.style_id);
      if (!m || m.recommended !== "push") return null;
      if (fp.focus?.style_id === a.style_id) {
        const released = share(a.style_id, a.article_id, fp.release.released, { pack: p.case_pack });
        return {
          label: "Release the reserve",
          why: `Launched ${pretty(p.launch_date)} on a fixed push by store grade, with ${pct(1 - fp.focus.push_pct)} held back. ${fp.release.stores.length} stores sold past the trigger; release ${n(released)} ${a.color.toLowerCase()} units to them.`,
          evidence: [["Pushed at launch", `${pct(fp.focus.push_pct)} of the DC`], ["Stores past trigger", String(fp.release.stores.length), "accent"], ["Release now", `${n(released)} units`, "accent"], ["Left in DC", n(s.dc_units)]],
          rule: "Push a fixed % by grade at launch; stores past the sell-through trigger share the reserve by what they sold.",
        };
      }
      const promo = m.reason;
      return {
        label: "Fixed push before the campaign",
        why: `${promo}. ${n(s.dc_units)} ${a.color.toLowerCase()} units are in the DC and stores hold none: push them by grade so all ${Object.keys(derived[a.article_id].stores).length} stores open with stock.`,
        evidence: [["Starts", pretty(p.launch_date)], ["In the DC", `${n(s.dc_units)} units`, "accent"], ["In stores", n(s.store_units), "bad"], ["Method today", m.current]],
        rule: "Campaigns and launches start on a fixed push: every store needs stock on day one.",
      };
    }],
    ["avg_per_store", (a, p, s) => {
      const it = aps.items.find((x) => x.style_id === a.style_id);
      if (!it || it.method !== "avg_per_store") return null;
      const g = it.per_store_by_grade ?? {};
      const per = (k) => (g[k] != null ? Math.max(0, Math.round(g[k] * Number(a.sales_mix))) : null);
      return {
        why: `${it.reason}. Allocate ${a.color.toLowerCase()} on an average per store by grade${it.basis ? `, seeded from ${it.basis.startsWith("like item: ") ? `its like item, the ${it.basis.slice(11).toLowerCase()}` : it.basis}` : ""}.`,
        evidence: [["Grade A store", per("A") != null ? `${per("A")} units` : "—", "accent"], ["Grade B store", per("B") != null ? `${per("B")} units` : "—"], ["Grade C store", per("C") != null ? `${per("C")} units` : "—"], ["In the DC", n(s.dc_units)]],
        rule: "No history, under 8 weeks of it, 4+ stocked-out weeks in 10, or not enough DC stock to go round: average per store.",
      };
    }],
    ["eos", (a, p, s) => {
      const it = eos.items.find((x) => x.style_id === a.style_id);
      if (!it) return null;
      const id = it.best;
      const weeksLeft = Math.max(0, Math.round(daysBetween(AS_OF, p.end_date ?? AS_OF) / 7));
      const why = {
        flush: `${n(s.dc_units)} ${a.color.toLowerCase()} units are still in the DC with ${weeksLeft} weeks of season left, and stores can still sell them at ${n(s.weekly_rate)} a week. Flush them to the stores that sell, at a markdown, before Nov 8.`,
        hold: `A carryover style: ${a.color.toLowerCase()} comes back next fall at full price, so holding ${n(s.dc_units)} units beats any markdown, after holding cost.`,
        off_price: `Sales are falling and won't clear ${n(s.dc_units)} units in ${weeksLeft} weeks. Sell ${a.color.toLowerCase()} off-price now and free the DC.`,
      }[id];
      return {
        id,
        why,
        evidence: [["Left in DC", `${n(s.dc_units)} units`, "accent"], ["Sells", `${n(s.weekly_rate)} / week`], ["Season ends", pretty(p.end_date)], ["Recovers", pct(it.recovery[id])]],
        rule: "Price each exit (flush, hold, off-price) per item and take the one that recovers the most.",
        stake: { usd: it.recovery[id] * s.dc_units * Number(p.full_price), label: "recovered" },
      };
    }],
    ["markdown", (a, p, s) => {
      const r = RULES.markdown;
      if (!s.weeks_of_cover || s.weeks_of_cover < r.cover || s.mix_trend > r.mixTrend) return null;
      return {
        why: `${a.color} holds ${pct(a.stock_mix)} of the ${p.name.toLowerCase()} stock, but its share of sales is falling ${pct1(-s.mix_trend)} a week (${pct(s.share_of_sales)} now). That's ${s.weeks_of_cover} weeks of cover: stop replenishing it and mark it down while it still has value.`,
        evidence: [["Weeks of cover", String(s.weeks_of_cover), "bad"], ["Share of sales", `${pct1(s.mix_trend)} / week`, "bad"], ["Stock vs sales mix", `${pct(a.stock_mix)} vs ${pct(s.share_of_sales)}`], ["Units", n(s.store_units + s.in_transit + s.dc_units)]],
        rule: `Over ${r.cover} weeks of cover, and the color's share of its style's sales falling more than ${pct1(-r.mixTrend)} a week.`,
        stake: { usd: (s.store_units + s.dc_units) * Number(p.unit_cost), label: "of stock at cost" },
      };
    }],
    ["store_depth", (a, p) => {
      const m = sd.methods.find((x) => x.style_id === a.style_id);
      if (!m || m.recommended !== "depth") return null;
      const focus = sd.focus?.style_id === a.style_id;
      const stale = focus ? sd.staleness.filter((x) => x.status === "too_shallow" || x.status === "too_deep").length : null;
      if (!m.flagged && !stale) return null; // already on depth, targets fine
      return {
        why: `${m.reason.split(";")[0]}. ${focus ? `A fixed push would send ${n(sd.kpis.find((k) => k.label.startsWith("Fixed push: sent past")).value)} units past target; fill each store to its depth instead, and fix the ${stale} depth targets that went stale.` : `Fill each store to its ${a.color.toLowerCase()} depth target instead of a flat push.`}`,
        evidence: focus
          ? [["Method today", m.current], ["Should be", "store depth", "accent"], ["Stale targets", String(stale), "warn"], ["Push overshoot", `${n(sd.kpis.find((k) => k.label.startsWith("Fixed push: sent past")).value)} units`, "bad"]]
          : [["Method today", m.current], ["Should be", "store depth", "accent"]],
        rule: "Stores hold stock and history is noisy or lumpy: fill to depth (depth − on hand − in transit).",
      };
    }],
    ["size_curve", (a) => {
      if (sc.focus?.style_id !== a.style_id) return null;
      const own = sc.stores.filter((x) => x.method === "own").length;
      const cluster = sc.stores.filter((x) => x.method === "cluster").length;
      return {
        why: `${own} stores sell sizes far enough from the chain curve to get their own, and ${cluster} small stores borrow their region's. Allocate ${a.color.toLowerCase()} on those curves${sc.broken_sizes.length ? `; ${sc.broken_sizes.length} store already has a broken size run` : ""}.`,
        evidence: [["Own curve", `${own} stores`, "accent"], ["Cluster curve", `${cluster} stores`], ["Chain curve", `${sc.stores.length - own - cluster} stores`], ["Broken runs", String(sc.broken_sizes.length), sc.broken_sizes.length ? "bad" : ""]],
        rule: "More than 10% from the chain curve: own curve. Under 40 units in 13 weeks: borrow the region's.",
      };
    }],
    ["chase", (a, p, s) => {
      const r = RULES.chase;
      if (s.mix_trend < r.mixTrend || s.mix_gap > r.mixGap) return null;
      return {
        why: `${a.color} is ${pct(s.share_of_sales)} of ${p.name.toLowerCase()} sales and gaining ${pct1(s.mix_trend)} a week, but holds only ${pct(a.stock_mix)} of the stock: ${s.weeks_of_cover} weeks of cover. Re-weight replenishment toward it before it runs out.`,
        evidence: [["Share of sales", `+${pct1(s.mix_trend)} / week`, "good"], ["Sales vs stock mix", `${pct(s.share_of_sales)} vs ${pct(a.stock_mix)}`, "warn"], ["Weeks of cover", String(s.weeks_of_cover), "warn"], ["Sells", `${n(s.weekly_rate)} / week`]],
        rule: `The color's share of its style's sales rising over ${pct1(r.mixTrend)} a week, with a stock share under ${pct(r.mixGap)} of its sales share.`,
      };
    }],
    ["transfer", (a, p, s, d) => {
      for (const so of ov.stockouts.filter((x) => x.style_id === a.style_id)) {
        const st = d.stores[so.store_no];
        if (!st || !st.rate || st.in_transit > 0) continue;
        const daily = st.rate / 7;
        const runsIn = st.on_hand / daily;
        const toTruck = daysBetween(AS_OF, st.next_delivery);
        if (runsIn >= toTruck) continue;
        const t = so.transfer;
        const units = t ? share(a.style_id, a.article_id, t.units) : 0;
        const doIt = t?.recommended && units > 0;
        if (!doIt && !d.dc[storeBy[so.store_no].dc_id]) continue; // nothing in the DC to pull forward
        return {
          label: doIt ? "Transfer before the stockout" : "Pull forward on the next truck",
          why: `${storeBy[so.store_no].name} holds ${st.on_hand} ${a.color.toLowerCase()} and sells ${round(st.rate, 1)} a week: it runs out ${weekday(addDays(AS_OF, Math.floor(runsIn)))}, and its truck comes ${weekday(st.next_delivery)}. ${doIt ? `Move ${units} from ${t.from_name}, ${t.km} km away, where it has weeks to spare: the margin saved beats the freight.` : "Pull it forward on the next DC truck."}`,
          evidence: [["Store", storeBy[so.store_no].name.replace("Store ", "#")], ["On hand", String(st.on_hand), "bad"], ["Runs out", weekday(addDays(AS_OF, Math.floor(runsIn))), "bad"], ["Next truck", weekday(st.next_delivery)]],
          rule: "On hand ÷ daily rate lands before the next delivery; transfer only within 60 km and only if the margin saved beats the freight.",
          stake: doIt ? { usd: t.margin_saved * (units / Math.max(1, t.units)), label: "margin saved" } : null,
        };
      }
      return null;
    }],
  ];

  const tagged = articles.map((a) => {
    const p = productBy[a.style_id];
    const d = derived[a.article_id];
    const s = articleStats(a, d, styleWeekly[a.style_id]);
    const hits = [];
    for (const [id, fn] of RULESET) {
      const r = fn(a, p, s, d);
      if (r) hits.push({ id: r.id ?? id, ...r });
    }
    const top = hits[0];
    const action = top ? top.id : "on_track";
    const onTrack = {
      why:
        s.weeks_of_cover > RULES.markdown.cover
          ? `Plenty of stock (${s.weeks_of_cover} weeks of cover at ${n(s.weekly_rate)} a week), but the color is holding its share of sales, so it doesn't need a markdown yet. Worth watching.`
          : `${s.weeks_of_cover ?? "—"} weeks of cover at ${n(s.weekly_rate)} a week, and the color sells in line with its stock (${pct(a.sales_mix)} of sales, ${pct(a.stock_mix)} of stock). Nothing needs a decision today.`,
      evidence: [["Weeks of cover", String(s.weeks_of_cover ?? "—"), s.weeks_of_cover > RULES.markdown.cover ? "warn" : "good"], ["Sells", `${n(s.weekly_rate)} / week`], ["Trend", `${s.trend >= 0 ? "+" : ""}${pct(s.trend)} / week`], ["Stores", String(Object.keys(d.stores).length)]],
      rule: "No rule fired.",
    };
    const t = top ?? onTrack;
    return {
      article_id: a.article_id,
      style_id: a.style_id,
      style: p.name.endsWith(` · ${a.color}`) ? p.name.slice(0, -(a.color.length + 3)) : p.name,
      color: a.color,
      hex: a.hex,
      department: p.department,
      category: p.category,
      lifecycle: p.lifecycle,
      vendor: vendorBy[p.vendor_id]?.name ?? p.vendor_id,
      price: Number(p.full_price),
      action,
      label: t.label ?? ACTIONS[action].label,
      use_case: ACTIONS[action].use_case,
      chapter: ACTIONS[action].chapter,
      why: t.why,
      evidence: t.evidence.map(([label, value, tone]) => ({ label, value, tone: tone ?? "" })),
      rule: t.rule,
      stake: t.stake && t.stake.usd > 0 ? { usd: Math.round(t.stake.usd), label: t.stake.label, text: `${money(t.stake.usd)} ${t.stake.label}` } : null,
      also: hits.slice(1).map((h) => h.label ?? ACTIONS[h.id].label),
      stats: s,
      weekly: d.weekly.map((v) => Math.round(v)),
    };
  });

  const count = (id) => tagged.filter((x) => x.action === id).length;
  const chapters = CHAPTERS.map((c) => ({
    ...c,
    groups: c.actions
      .map((id) => ({ action: id, label: ACTIONS[id].label, use_case: ACTIONS[id].use_case, articles: tagged.filter((x) => x.action === id).sort((x, y) => (y.stake?.usd ?? 0) - (x.stake?.usd ?? 0)) }))
      .filter((g) => g.articles.length),
  })).map((c) => ({ ...c, count: sum(c.groups.map((g) => g.articles.length)) }));
  const needAction = tagged.filter((x) => x.action !== "on_track");

  return {
    as_of: AS_OF,
    source: src.kind,
    persona: PERSONA,
    weeks,
    counts: Object.fromEntries(Object.keys(ACTIONS).map((id) => [id, count(id)])),
    summary: {
      articles: tagged.length,
      styles: new Set(tagged.map((x) => x.style_id)).size,
      need_action: needAction.length,
      on_track: count("on_track"),
      at_stake: Math.round(sum(needAction.map((x) => x.stake?.usd ?? 0))),
      kinds: new Set(needAction.map((x) => x.action)).size,
    },
    actions: ACTIONS,
    rules: RULES,
    chapters,
    articles: tagged,
    // the engine numbers the story narrates, trimmed to what it needs
    context: {
      crossDock: { asn: xd.asn, totals: xd.totals, lines: xd.lines.map(({ name, units, cross_dock, stores, decision, reserve_before }) => ({ name, units, cross_dock, stores, decision, reserve_before })), hero: xd.hero && { name: xd.hero.name, style: xd.hero.style, runs_out: xd.hero.runs_out, via_put_away: xd.hero.via_put_away, via_cross_dock: xd.hero.via_cross_dock } },
      bullwhip: { style: bw.focus?.name, variability: bw.variability, po: bw.po_check, unit_cost: Number(productBy[bw.focus?.style_id]?.unit_cost ?? 0) },
      leadTime: lt.vendors.filter((v) => v.status !== "ok").map(({ vendor_id, name, promised, p90, drift_days, buffer_days, status }) => ({ vendor_id, name, promised, p90, drift_days, buffer_days, status })),
      fixedPush: { style: fp.focus?.name, push_pct: fp.focus?.push_pct, released: fp.release.released, stores: fp.release.stores.length, promo: sd.methods.find((m) => m.style_id !== fp.focus?.style_id && m.recommended === "push") },
      avgPerStore: aps.items.filter((i) => i.method === "avg_per_store").map(({ name, reason }) => ({ name, reason })),
      endOfSeason: { kpis: Object.fromEntries(eos.kpis.map((k) => [k.label, k.value])), items: eos.items.map(({ name, best, dc_units }) => ({ name, best, dc_units })) },
      storeDepth: { style: sd.focus?.name, past_target: sd.kpis.find((k) => k.label.startsWith("Fixed push: sent past"))?.value, stale: sd.staleness.filter((x) => x.status !== "ok" && x.status !== "no_sales").length },
      sizeCurves: { style: sc.focus?.name, own: sc.stores.filter((x) => x.method === "own").length, cluster: sc.stores.filter((x) => x.method === "cluster").length, broken: sc.broken_sizes.length },
    },
  };
}
