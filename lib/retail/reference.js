// Reference data for the retail demo: a fictional US apparel chain whose numbers
// are generated (lib/retail/generate.js) but whose stores, vendors and products
// are hand-picked so every LinkedIn video's scenario lives in the data.
import { AS_OF } from "./calendar.js";

export const RETAILER = {
  name: "Cobalt Lane Apparel",
  fictional: true,
  currency: "USD",
  as_of: AS_OF,
  note: "Fictional retailer. All stores, vendors, products and numbers are generated demo data.",
};

export const SIZE_GROUPS = {
  alpha: ["S", "M", "L", "XL", "XXL"],
  waist: ["28", "30", "32", "34", "36", "38"],
  shoe: ["7", "8", "9", "10", "11", "12"],
  one: ["OS"],
};

export const DCS = [
  { dc_id: "DC-E", name: "Columbus DC", city: "Columbus", state: "OH", serves: "East, Midwest, South" },
  { dc_id: "DC-W", name: "Reno DC", city: "Reno", state: "NV", serves: "West, Mountain, Southwest" },
];

// climate drives what sells where (outerwear in Chicago, linen in Miami); grade drives volume.
// [store_no, name, city, state, region, climate, grade, format, sqft, opened_on, lat, lng, dc]
const S = [
  [3, "SoHo", "New York", "NY", "Northeast", "cold", "A", "street", 9500, "2014-04-11", 40.7233, -74.0003, "DC-E"],
  [5, "Newbury St", "Boston", "MA", "Northeast", "cold", "A", "street", 8200, "2015-03-20", 42.3503, -71.0810, "DC-E"],
  [7, "Westfarms", "Hartford", "CT", "Northeast", "cold", "C", "mall", 4000, "2018-09-14", 41.7231, -72.7623, "DC-E"],
  [8, "Williamsburg", "Brooklyn", "NY", "Northeast", "cold", "B", "street", 6400, "2018-05-04", 40.7143, -73.9612, "DC-E"],
  [9, "Rittenhouse", "Philadelphia", "PA", "Northeast", "cold", "B", "street", 6800, "2016-10-07", 39.9496, -75.1718, "DC-E"],
  [11, "Georgetown", "Washington", "DC", "Northeast", "mild", "B", "street", 6000, "2017-06-02", 38.9051, -77.0651, "DC-E"],
  [12, "Century City", "Los Angeles", "CA", "West", "warm", "A", "mall", 9000, "2013-11-15", 34.0584, -118.4177, "DC-W"],
  [14, "Michigan Ave", "Chicago", "IL", "Midwest", "cold", "A", "street", 11000, "2012-08-24", 41.8944, -87.6242, "DC-E"],
  [16, "Mall of America", "Bloomington", "MN", "Midwest", "cold", "A", "mall", 8800, "2015-08-21", 44.8549, -93.2422, "DC-E"],
  [19, "Sherman Ave", "Evanston", "IL", "Midwest", "cold", "B", "street", 5200, "2019-04-26", 42.0470, -87.6818, "DC-E"],
  [21, "Somerset", "Troy", "MI", "Midwest", "cold", "B", "mall", 6200, "2017-03-17", 42.5601, -83.1838, "DC-E"],
  [22, "Lenox Square", "Atlanta", "GA", "South", "warm", "B", "mall", 7000, "2016-09-09", 33.8462, -84.3621, "DC-E"],
  [24, "Brickell", "Miami", "FL", "South", "warm", "B", "mall", 6600, "2018-11-23", 25.7674, -80.1932, "DC-E"],
  [25, "SouthPark", "Charlotte", "NC", "South", "mild", "C", "mall", 4800, "2019-07-12", 35.1525, -80.8288, "DC-E"],
  [27, "State Street", "Ann Arbor", "MI", "Midwest", "cold", "C", "street", 3800, "2020-08-28", 42.2790, -83.7409, "DC-E"],
  [29, "The Gulch", "Nashville", "TN", "South", "mild", "C", "street", 4200, "2021-05-14", 36.1518, -86.7894, "DC-E"],
  [31, "Cherry Creek", "Denver", "CO", "Mountain", "cold", "B", "mall", 6000, "2017-10-20", 39.7170, -104.9530, "DC-W"],
  [33, "City Creek", "Salt Lake City", "UT", "Mountain", "cold", "C", "mall", 4600, "2019-03-22", 40.7687, -111.8943, "DC-W"],
  [34, "Scottsdale Fashion Sq", "Scottsdale", "AZ", "Southwest", "warm", "B", "mall", 6400, "2016-11-04", 33.5022, -111.9289, "DC-W"],
  [36, "Summerlin", "Las Vegas", "NV", "West", "warm", "C", "mall", 4400, "2020-10-09", 36.1520, -115.3300, "DC-W"],
  [38, "Fashion Valley", "San Diego", "CA", "West", "warm", "B", "mall", 6100, "2016-05-13", 32.7678, -117.1670, "DC-W"],
  [39, "Union Square", "San Francisco", "CA", "West", "mild", "A", "street", 8700, "2013-06-07", 37.7880, -122.4074, "DC-W"],
  [41, "Legacy West", "Plano", "TX", "Southwest", "warm", "B", "mall", 6300, "2018-08-17", 33.0774, -96.8261, "DC-W"],
  [43, "The Galleria", "Houston", "TX", "Southwest", "warm", "A", "mall", 8600, "2014-10-24", 29.7390, -95.4637, "DC-W"],
  [44, "NorthPark", "Dallas", "TX", "Southwest", "warm", "B", "mall", 6700, "2015-11-13", 32.8680, -96.7738, "DC-W"],
  [46, "South Congress", "Austin", "TX", "Southwest", "warm", "C", "street", 4100, "2021-03-05", 30.2500, -97.7494, "DC-W"],
  [47, "ABQ Uptown", "Albuquerque", "NM", "Southwest", "mild", "C", "mall", 3600, "2019-09-27", 35.1044, -106.5650, "DC-W"],
  [49, "University Village", "Seattle", "WA", "West", "mild", "A", "mall", 8100, "2014-07-18", 47.6627, -122.2990, "DC-W"],
  [50, "Pearl District", "Portland", "OR", "West", "mild", "B", "street", 5600, "2017-04-21", 45.5262, -122.6816, "DC-W"],
  [52, "The Village", "Boise", "ID", "Mountain", "cold", "C", "mall", 3900, "2022-03-25", 43.6110, -116.3540, "DC-W"],
  [53, "Country Club Plaza", "Kansas City", "MO", "Midwest", "mild", "C", "street", 4300, "2018-04-13", 39.0428, -94.5920, "DC-E"],
  [54, "Plaza Frontenac", "St. Louis", "MO", "Midwest", "mild", "C", "mall", 4000, "2019-10-18", 38.6290, -90.4130, "DC-E"],
  [55, "Shadyside", "Pittsburgh", "PA", "Northeast", "cold", "C", "street", 3700, "2020-09-11", 40.4530, -79.9350, "DC-E"],
  [56, "Easton", "Columbus", "OH", "Midwest", "cold", "B", "mall", 6200, "2016-06-17", 40.0510, -82.9150, "DC-E"],
  [57, "Keystone", "Indianapolis", "IN", "Midwest", "cold", "C", "mall", 4200, "2019-05-24", 39.9130, -86.1080, "DC-E"],
  [58, "North Hills", "Raleigh", "NC", "South", "mild", "C", "mall", 3900, "2026-05-15", 35.8370, -78.6430, "DC-E"],
  [59, "Mall at Millenia", "Orlando", "FL", "South", "warm", "B", "mall", 6000, "2018-03-09", 28.4850, -81.4320, "DC-E"],
  [60, "Magazine Street", "New Orleans", "LA", "South", "warm", "C", "street", 3500, "2021-11-12", 29.9220, -90.0910, "DC-E"],
  [61, "5th Avenue", "Anchorage", "AK", "West", "cold", "C", "mall", 3400, "2020-11-06", 61.2170, -149.8900, "DC-W"],
  [62, "Third Ward", "Milwaukee", "WI", "Midwest", "cold", "C", "street", 3600, "2021-08-20", 43.0330, -87.9080, "DC-E"],
];

export const STORES = S.map(([store_no, site, city, state, region, climate, grade, format, sqft, opened_on, lat, lng, dc_id]) => ({
  store_no,
  name: `Store ${store_no} · ${city}`,
  site,
  city,
  state,
  region,
  climate,
  grade,
  format,
  sqft,
  opened_on,
  lat,
  lng,
  dc_id,
}));

// Lead-time behaviour is the point of the lead-time video: same promise, very different spread.
export const VENDORS = [
  { vendor_id: "SOLA", name: "Sola Cotton", country: "Mexico", ship_mode: "truck", promised_lead_days: 10, moq: 600, fill_rate: 0.99, notes: "Steady; ships weekly by truck" },
  { vendor_id: "BALTIC", name: "Baltic Denim", country: "Turkey", ship_mode: "ocean+rail", promised_lead_days: 14, moq: 400, fill_rate: 0.98, notes: "Tight, reliable lead times" },
  { vendor_id: "NORTHLINE", name: "Northline Knits", country: "Portugal", ship_mode: "ocean", promised_lead_days: 14, moq: 500, fill_rate: 0.94, notes: "Wide spread; drifting later since August" },
  { vendor_id: "KORA", name: "Kora Leather", country: "Italy", ship_mode: "ocean", promised_lead_days: 21, moq: 200, fill_rate: 0.97, notes: "Port congestion at Newark since September" },
  { vendor_id: "RIDGEWAY", name: "Ridgeway Outerwear", country: "Vietnam", ship_mode: "ocean", promised_lead_days: 35, moq: 800, fill_rate: 0.97, notes: "Seasonal outerwear; long but predictable" },
  { vendor_id: "MARIGOLD", name: "Marigold Prints", country: "India", ship_mode: "ocean", promised_lead_days: 42, moq: 600, fill_rate: 0.95, notes: "Prints and linen; variable" },
  { vendor_id: "CALDER", name: "Calder Footwear", country: "Vietnam", ship_mode: "ocean", promised_lead_days: 45, moq: 300, fill_rate: 0.98, notes: "Footwear; collab drops in limited runs" },
];

// base = weekly units in an average (grade B) store at peak.
// climate: how weather tilts demand · curve: shape of demand over the season
// current_method: how the allocator has the item set up today (the agent may disagree)
const P = (o) => ({ end_date: null, carryover: false, like_item: null, base: 0, climate: "neutral", curve: "flat", ...o });
export const PRODUCTS = [
  P({ style_id: "CREW-TEE", name: "Core crew tee", department: "Unisex", category: "Tops", lifecycle: "core", season: "Core", vendor_id: "SOLA", unit_cost: 6, full_price: 18, launch_date: "2024-02-05", size_group: "alpha", case_pack: 12, presentation_min: 10, base: 13, current_method: "demand", min_qty: 12, max_qty: 36 }),
  P({ style_id: "WHITE-TEE", name: "Core white tee", department: "Unisex", category: "Tops", lifecycle: "core", season: "Core", vendor_id: "SOLA", unit_cost: 5, full_price: 16, launch_date: "2024-09-02", size_group: "alpha", case_pack: 12, presentation_min: 10, base: 11, current_method: "depth" }),
  P({ style_id: "POLO-TEE", name: "Piqué polo tee", department: "Men", category: "Tops", lifecycle: "core", season: "Core", vendor_id: "SOLA", unit_cost: 10, full_price: 30, launch_date: "2024-03-04", size_group: "alpha", case_pack: 12, presentation_min: 10, base: 7, climate: "warm-wear", curve: "summer", current_method: "demand" }),
  P({ style_id: "OXFORD", name: "Oxford shirt", department: "Men", category: "Tops", lifecycle: "core", season: "Core", vendor_id: "SOLA", unit_cost: 18, full_price: 54, launch_date: "2024-01-08", size_group: "alpha", case_pack: 6, presentation_min: 8, base: 4, current_method: "demand" }),
  P({ style_id: "SOCKS-3PK", name: "Crew socks 3-pack", department: "Unisex", category: "Accessories", lifecycle: "core", season: "Core", vendor_id: "SOLA", unit_cost: 4, full_price: 14, launch_date: "2023-09-04", size_group: "one", case_pack: 24, presentation_min: 12, base: 9, current_method: "demand" }),
  P({ style_id: "SLIM-DENIM", name: "Slim denim", department: "Men", category: "Bottoms", lifecycle: "core", season: "Core", vendor_id: "BALTIC", unit_cost: 22, full_price: 68, launch_date: "2023-08-07", size_group: "waist", case_pack: 6, presentation_min: 12, base: 6, current_method: "demand" }),
  P({ style_id: "CHINO-KHK", name: "Slim chino · Khaki", department: "Men", category: "Bottoms", lifecycle: "core", season: "Core", vendor_id: "BALTIC", unit_cost: 19, full_price: 58, launch_date: "2024-02-05", size_group: "waist", case_pack: 6, presentation_min: 24, base: 13, current_method: "push" }),
  P({ style_id: "CHINO-BLK", name: "Slim chino · Black", department: "Men", category: "Bottoms", lifecycle: "seasonal", season: "Fall '26", vendor_id: "BALTIC", unit_cost: 19, full_price: 60, launch_date: "2026-08-03", end_date: "2026-11-08", carryover: true, size_group: "waist", case_pack: 6, presentation_min: 24, base: 4, curve: "fall", current_method: "depth" }),
  P({ style_id: "CARGO-PANT", name: "Relaxed cargo pant", department: "Men", category: "Bottoms", lifecycle: "fashion", season: "Fall '26", vendor_id: "BALTIC", unit_cost: 21, full_price: 64, launch_date: "2026-06-01", end_date: "2026-11-08", size_group: "waist", case_pack: 6, presentation_min: 12, base: 3, current_method: "demand" }),
  P({ style_id: "CORD-JACKET", name: "Corduroy trucker jacket", department: "Men", category: "Outerwear", lifecycle: "seasonal", season: "Fall '26", vendor_id: "BALTIC", unit_cost: 32, full_price: 98, launch_date: "2026-08-03", end_date: "2026-11-08", size_group: "alpha", case_pack: 6, presentation_min: 6, base: 3, climate: "cold-wear", curve: "fall", current_method: "demand" }),
  P({ style_id: "HOODIE", name: "Core fleece hoodie", department: "Unisex", category: "Tops", lifecycle: "core", season: "Core", vendor_id: "NORTHLINE", unit_cost: 15, full_price: 48, launch_date: "2024-09-02", size_group: "alpha", case_pack: 10, presentation_min: 10, base: 14, curve: "hoodie", current_method: "demand" }),
  P({ style_id: "MERINO-CREW", name: "Merino crewneck", department: "Men", category: "Knitwear", lifecycle: "seasonal", season: "Fall '26", vendor_id: "NORTHLINE", unit_cost: 26, full_price: 72, launch_date: "2026-08-17", end_date: "2027-01-03", size_group: "alpha", case_pack: 6, presentation_min: 8, base: 2.4, climate: "cold-wear", curve: "rising", current_method: "demand" }),
  P({ style_id: "KNIT-BEANIE", name: "Rib-knit beanie", department: "Unisex", category: "Accessories", lifecycle: "seasonal", season: "Fall '26", vendor_id: "NORTHLINE", unit_cost: 7, full_price: 22, launch_date: "2026-09-07", end_date: "2027-01-31", size_group: "one", case_pack: 12, presentation_min: 8, base: 4, climate: "cold-wear", curve: "rising", current_method: "demand" }),
  P({ style_id: "PROMO-HOODIE", name: "Graphic hoodie (campaign)", department: "Unisex", category: "Tops", lifecycle: "promo", season: "Holiday '26", vendor_id: "NORTHLINE", unit_cost: 14, full_price: 44, launch_date: "2026-10-23", end_date: "2026-11-29", size_group: "alpha", case_pack: 10, presentation_min: 10, current_method: "depth" }),
  P({ style_id: "FAIRISLE", name: "Holiday fair-isle cardigan", department: "Women", category: "Knitwear", lifecycle: "launch", season: "Holiday '26", vendor_id: "NORTHLINE", unit_cost: 28, full_price: 78, launch_date: "2026-11-02", end_date: "2027-01-03", size_group: "alpha", case_pack: 6, presentation_min: 8, like_item: "MERINO-CREW", current_method: "demand" }),
  P({ style_id: "WOOL-COAT", name: "Wool overcoat", department: "Men", category: "Outerwear", lifecycle: "seasonal", season: "Fall '26", vendor_id: "RIDGEWAY", unit_cost: 45, full_price: 120, launch_date: "2026-08-03", end_date: "2026-11-08", size_group: "alpha", case_pack: 6, presentation_min: 6, base: 5.5, climate: "cold-wear", curve: "fall", current_method: "demand" }),
  P({ style_id: "PUFFER-VEST", name: "Puffer vest", department: "Unisex", category: "Outerwear", lifecycle: "seasonal", season: "Fall '26", vendor_id: "RIDGEWAY", unit_cost: 32, full_price: 90, launch_date: "2026-08-03", end_date: "2026-11-08", size_group: "alpha", case_pack: 6, presentation_min: 6, base: 2.6, climate: "cold-only", curve: "fall", current_method: "demand" }),
  P({ style_id: "PARKA", name: "New-season parka", department: "Unisex", category: "Outerwear", lifecycle: "launch", season: "Winter '26", vendor_id: "RIDGEWAY", unit_cost: 58, full_price: 160, launch_date: "2026-10-12", end_date: "2027-02-28", size_group: "alpha", case_pack: 6, presentation_min: 6, like_item: "WOOL-COAT", current_method: "push" }),
  P({ style_id: "RAIN-SHELL", name: "Packable rain shell", department: "Unisex", category: "Outerwear", lifecycle: "core", season: "Core", vendor_id: "RIDGEWAY", unit_cost: 38, full_price: 110, launch_date: "2025-02-03", size_group: "alpha", case_pack: 6, presentation_min: 6, base: 2.5, current_method: "demand" }),
  P({ style_id: "PRINT-SHIRT", name: "Printed camp shirt", department: "Men", category: "Tops", lifecycle: "fashion", season: "Fall '26", vendor_id: "MARIGOLD", unit_cost: 15, full_price: 50, launch_date: "2026-08-03", end_date: "2026-11-08", size_group: "alpha", case_pack: 6, presentation_min: 6, base: 3, curve: "dud", current_method: "demand" }),
  P({ style_id: "LINEN-SHIRT", name: "Linen shirt", department: "Men", category: "Tops", lifecycle: "seasonal", season: "SS '26", vendor_id: "MARIGOLD", unit_cost: 16, full_price: 52, launch_date: "2026-03-02", end_date: "2026-08-30", size_group: "alpha", case_pack: 6, presentation_min: 8, base: 5, climate: "warm-wear", curve: "summer", current_method: "demand" }),
  P({ style_id: "RETRO-RUNNER", name: "Retro runner sneaker", department: "Unisex", category: "Footwear", lifecycle: "fashion", season: "Fall '26", vendor_id: "CALDER", unit_cost: 40, full_price: 110, launch_date: "2026-09-28", end_date: "2027-03-28", size_group: "shoe", case_pack: 6, presentation_min: 6, base: 3, curve: "launch", current_method: "depth" }),
  P({ style_id: "COLLAB-SNKR", name: "Collab sneaker (limited)", department: "Unisex", category: "Footwear", lifecycle: "limited", season: "Holiday '26", vendor_id: "CALDER", unit_cost: 55, full_price: 140, launch_date: "2026-10-30", end_date: "2026-12-31", size_group: "shoe", case_pack: 6, presentation_min: 6, like_item: "RETRO-RUNNER", current_method: "demand" }),
  P({ style_id: "CHELSEA-BOOT", name: "Leather Chelsea boot", department: "Men", category: "Footwear", lifecycle: "core", season: "Core", vendor_id: "KORA", unit_cost: 55, full_price: 150, launch_date: "2025-09-01", size_group: "shoe", case_pack: 6, presentation_min: 6, base: 1.8, climate: "cold-wear", current_method: "demand" }),
  P({ style_id: "LEATHER-BELT", name: "Leather belt", department: "Men", category: "Accessories", lifecycle: "core", season: "Core", vendor_id: "KORA", unit_cost: 12, full_price: 40, launch_date: "2024-01-08", size_group: "one", case_pack: 12, presentation_min: 6, base: 2.5, current_method: "demand" }),
];

export const PROMOTIONS = [
  { promo_id: "PR-2611", style_id: "PROMO-HOODIE", name: "Fall graphic hoodie campaign", start_date: "2026-10-23", end_date: "2026-11-01", discount_pct: 20, scope: "All stores · national email + social" },
  { promo_id: "PR-2612", style_id: "COLLAB-SNKR", name: "Collab sneaker drop", start_date: "2026-10-30", end_date: "2026-11-15", discount_pct: 0, scope: "All stores · limited run of 600 pairs" },
  { promo_id: "PR-2613", style_id: "FAIRISLE", name: "Holiday knitwear launch", start_date: "2026-11-02", end_date: "2026-12-24", discount_pct: 0, scope: "All stores" },
];

// What each use case looks at by default. The API lets a caller override most of these.
export const SCENARIOS = {
  avgPerStore: { styles: ["CREW-TEE", "FAIRISLE", "COLLAB-SNKR", "SLIM-DENIM", "LINEN-SHIRT"], coverWeeks: 4 },
  sizeCurves: { style: "POLO-TEE", store: 27, allocateUnits: 24 },
  fixedPush: { style: "PARKA", pushPct: 0.6, releaseTrigger: 0.6, heroStores: [14, 22, 31, 47, 58] },
  storeDepth: { style: "CHINO-KHK", heroStores: [14, 22, 31, 47, 58], targetCoverWeeks: 6, healthyCover: [4, 8], methodStyles: ["PARKA", "CHINO-KHK", "PROMO-HOODIE", "WHITE-TEE", "RETRO-RUNNER", "HOODIE"] },
  endOfSeason: { season: "Fall '26", seasonEnd: "2026-11-08", nextSeasonStart: "2026-11-09", holdingCostPct: 0.08, offPriceRecovery: 0.35, postSeasonClearance: 0.25, flushMarkdown: 0.25 },
  bullwhip: { style: "HOODIE", weeks: 12, coverWeeks: 4, safetyPct: 0.01 },
  leadTime: { vendor: "NORTHLINE", style: "HOODIE", flatRuleDays: 7, window: 12 },
  crossDock: { asn: 30418, safetyDays: 3, targetWeeks: 2, heroStore: 14 },
  overview: { replenStyle: "CREW-TEE", transferRadiusKm: 60, transferCostPerUnit: 0.9, transferFixedCost: 35 },
};
