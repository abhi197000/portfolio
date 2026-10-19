export function usd(v) {
  const a = Math.abs(v);
  const s = a >= 1e6 ? `$${(a / 1e6).toFixed(1)}M` : a >= 1e3 ? `$${(a / 1e3).toFixed(a >= 1e5 ? 0 : 1)}K` : `$${Math.round(a)}`;
  return v < 0 ? `−${s}` : s;
}

export const pct = (v, d = 0) => `${(v * 100).toFixed(d)}%`;
export const signedPct = (v, d = 1) => `${v >= 0 ? "+" : "−"}${Math.abs(v * 100).toFixed(d)}%`;
export const num = (v) => (Number.isInteger(v) ? v.toLocaleString("en-US") : v.toLocaleString("en-US", { maximumFractionDigits: 1 }));

export function fmt(value, format) {
  if (value == null) return "—";
  if (typeof value === "string") return value;
  switch (format) {
    case "usd":
      return usd(value);
    case "pct":
      return pct(value, Math.abs(value) < 0.1 ? 1 : 0);
    case "pct_signed":
      return signedPct(value);
    case "days":
      return `${value} days`;
    case "x":
      return `${value}×`;
    default:
      return num(value);
  }
}

export const shortDate = (iso) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
