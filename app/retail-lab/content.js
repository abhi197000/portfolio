// Copy and look for each Retail Lab page. Order and ids match lib/retail/engine.
// `theme` picks the visual world of the LinkedIn video the use case came from.
import { fmt, usd } from "./_kit/format";

export const LAB = {
  "agentic-overview": {
    n: 1,
    theme: "t-overview",
    video: "Agentic AI in retail",
    kicker: "Agentic AI in retail",
    title: ["Closing the gap between ", "knowing and doing."],
    intro: "Every morning the agent scans each store × style position: who runs out before the next truck, which nearby store can cover it, what's excess, and where replenishment levels have drifted.",
    how: [
      "Stockout risk: on-hand ÷ daily selling rate, compared with the store's next delivery day.",
      "Transfers only within 60 km, and only when the margin saved beats the freight.",
      "Excess with sales trending up is slow but healthy; falling sales under 3% weekly sell-through is truly dead.",
      "Order-up-to levels re-tuned per store from its own rate and noise, not one chain-wide min/max.",
    ],
    headline: (r) => ({ value: r.stockouts.length, label: "stockouts caught before the next truck" }),
  },
  "avg-per-store": {
    n: 2,
    theme: "t-avg",
    video: "Average per store",
    kicker: "Demand type · Average per store",
    title: ["Forecast where there's history. ", "Instinct where there isn't."],
    intro: "Before an allocation runs, the agent reads each item's demand signal: how much history it has, whether stockouts have censored it, and whether there's enough DC stock to go round.",
    how: [
      "No history, or under 8 weeks of it: average per store, seeded from a like item.",
      "Stocked out in 4 of the last 10 weeks: history understates demand, so average per store.",
      "Not enough DC stock to give every store a real run: average per store, scaled to fit.",
      "Otherwise the forecast leads.",
    ],
    headline: (r) => ({ value: `${r.items.filter((i) => i.method === "avg_per_store").length} of ${r.items.length}`, label: "items need an average per store" }),
  },
  "size-curves": {
    n: 3,
    theme: "t-size",
    video: "Size curves",
    kicker: "Size curves",
    title: ["Right style. Right store. ", "Right size."],
    intro: "Every store sells sizes differently. The agent compares each store's last 13 weeks by size with the chain curve and picks the curve its allocation should follow.",
    how: [
      "More than 10% away from the chain curve (total variation): the store gets its own curve.",
      "Under 40 units in 13 weeks is too noisy: borrow the region's curve.",
      "Splits use largest-remainder rounding, so units always add up.",
      "Decent stock but a core size at zero is flagged as a broken size run.",
    ],
    headline: (r) => ({ value: r.stores.filter((s) => s.method !== "chain").length, label: "stores off the chain curve" }),
  },
  "fixed-push": {
    n: 4,
    theme: "t-push",
    video: "Fixed push",
    kicker: "Demand type · Fixed push",
    title: ["Push to start. Read the shelf. ", "Chase demand."],
    intro: "A launch has no history. The agent pushes a share of DC stock by store grade, holds the rest back, checks which \"zero demand\" stores were really zero stock, then releases the reserve to the stores that sell.",
    how: [
      "Push a fixed % of DC stock, split by store grade (A 1.75 : B 1.3 : C 1).",
      "A store whose like item sold zero while out of stock 80%+ of the time is censored, not dead: ignore the zero.",
      "Stores past the sell-through trigger share the reserve in proportion to what they sold.",
      "No store gets more than 1.5× its push; the rest stays at the DC.",
    ],
    headline: (r) => ({ value: r.release.released.toLocaleString("en-US"), label: "reserve units released to stores that sell" }),
  },
  "store-depth": {
    n: 5,
    theme: "t-depth",
    video: "Store depth",
    kicker: "Demand type · Store depth",
    title: ["Fill each store ", "to its depth, no more."],
    intro: "Once stores hold stock, a fixed push keeps sending the same amount everywhere. Store depth ships only the gap: depth target − on hand − in transit.",
    how: [
      "Need = depth − on hand − in transit; prorated if the delivery can't cover every gap.",
      "A depth target buying under 4 or over 8 weeks of cover is stale; resized to 6 weeks, never below the display minimum.",
      "Method fit: campaign or launch → push · noisy or lumpy history → depth · 26+ stable weeks → demand.",
      "Launches switch push → depth when most stores are stocked, and depth → demand after 5 clean weeks.",
    ],
    headline: (r) => ({ value: r.kpis.find((k) => k.label.startsWith("Fixed push: sent past")).value.toLocaleString("en-US"), label: "units a fixed push would send past target" }),
  },
  "end-of-season": {
    n: 6,
    theme: "t-eos",
    video: "End of season",
    kicker: "End of season",
    title: ["Flush what sells now. Hold what lasts. ", "Clear the rest."],
    intro: "Weeks before the season ends, what's left in the DC has three ways out. The agent prices each exit per item and compares the mix with one rule for everything.",
    how: [
      "Flush: what stores can still sell before season end, beyond what they hold, at a markdown; the rest clears after.",
      "Hold: carryover styles keep full price minus holding cost; fashion comes back at well under half.",
      "Off-price: a flat recovery, but it frees the DC now.",
      "Targeted flush to the few stores that take 80% of what can move.",
    ],
    headline: (r) => {
      const mix = r.policies.find((p) => p.id === "agent_mix");
      return { value: fmt(mix.recovery, "pct"), label: `recovered by the agent's mix (${usd(r.kpis[3].value)} more than one rule)` };
    },
  },
  bullwhip: {
    n: 7,
    theme: "t-bullwhip",
    video: "The bullwhip effect",
    kicker: "Vendor → DC · Bullwhip",
    title: ["Plan from the shopper, ", "not the echo."],
    intro: "Shoppers barely moved. Store orders swung, and DC orders swung harder. The agent separates real demand from the echo and sizes the next PO on what shoppers bought.",
    how: [
      "Variability per stage = week-to-week std ÷ mean: shoppers vs store orders vs DC orders.",
      "Stores that ran thin just before the spike (stocked out, or under ¾ of a week left) were rebuilding safety stock, not seeing new demand.",
      "The next PO covers the order cycle from shopper sales (POS), plus a small safety margin.",
      "Upcoming campaigns are flagged as one-offs, not baked into the run rate.",
    ],
    headline: (r) => ({ value: `${Math.round(r.variability.store_orders / r.variability.shoppers)}×`, label: "more variable: store orders vs shopper sales" }),
  },
  "lead-time": {
    n: 8,
    theme: "t-lead",
    video: "Lead-time variability",
    kicker: "Vendor → DC · Lead time",
    title: ["Don't plan on the promise. ", "Buffer the spread."],
    intro: "Vendors promise a lead time; POs arrive on a spread. The agent measures each vendor's real arrivals, spots drift, and sizes DC safety stock vendor by vendor.",
    how: [
      "Real lead time = order date → received date, last 12 received POs per vendor.",
      "Buffer days = p90 lead time − promise + 1 day.",
      "Drifting: arriving 3+ days later since August than before.",
      "Compared with one flat 7-day rule: which vendors it overstocks, which it starves.",
    ],
    headline: (r) => {
      const v = r.vendors.find((x) => x.vendor_id === r.focus.vendor_id);
      return { value: `${v.min}–${v.max} days`, label: `${v.name}'s real lead time (promised ${v.promised})` };
    },
  },
};

export const LAB_ORDER = Object.keys(LAB);
