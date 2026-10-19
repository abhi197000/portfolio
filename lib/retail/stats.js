export const sum = (a) => a.reduce((s, x) => s + x, 0);
export const mean = (a) => (a.length ? sum(a) / a.length : 0);

export function std(a) {
  if (a.length < 2) return 0;
  const m = mean(a);
  return Math.sqrt(sum(a.map((x) => (x - m) ** 2)) / (a.length - 1));
}

export const cv = (a) => (mean(a) ? std(a) / mean(a) : 0);

// linear-interpolated percentile, p in [0, 1]
export function pct(a, p) {
  if (!a.length) return 0;
  const s = [...a].sort((x, y) => x - y);
  const i = (s.length - 1) * p;
  const lo = Math.floor(i);
  const hi = Math.ceil(i);
  return s[lo] + (s[hi] - s[lo]) * (i - lo);
}

export const round = (x, d = 0) => {
  const k = 10 ** d;
  return Math.round(x * k) / k;
};

export const roundUpTo = (x, step) => Math.ceil(x / step) * step;

export function groupBy(rows, key) {
  const out = {};
  for (const r of rows) {
    const k = typeof key === "function" ? key(r) : r[key];
    (out[k] ||= []).push(r);
  }
  return out;
}

// least-squares slope of y against its index
export function slope(y) {
  const n = y.length;
  if (n < 2) return 0;
  const mx = (n - 1) / 2;
  const my = mean(y);
  let num = 0;
  let den = 0;
  y.forEach((v, i) => {
    num += (i - mx) * (v - my);
    den += (i - mx) ** 2;
  });
  return num / den;
}

// great-circle distance in km
export function kmBetween(a, b) {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

// Split `total` across weights so the parts sum exactly to `total` (largest remainder).
export function apportion(total, weights) {
  const w = weights.map((x) => Math.max(0, x));
  const sw = sum(w);
  if (!sw || total <= 0) return w.map(() => 0);
  const raw = w.map((x) => (x / sw) * total);
  const out = raw.map(Math.floor);
  let left = total - sum(out);
  raw
    .map((x, i) => [x - Math.floor(x), i])
    .sort((a, b) => b[0] - a[0])
    .forEach(([, i]) => {
      if (left > 0) {
        out[i] += 1;
        left -= 1;
      }
    });
  return out;
}
