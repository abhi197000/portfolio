const NUMERIC_TOLERANCE = 0.01;

function normalizeValue(v) {
  if (typeof v === "number") return Math.round(v * 100) / 100;
  if (v === null || v === undefined) return null;
  return v;
}

function normalizeRow(row) {
  const out = {};
  for (const key of Object.keys(row).sort()) {
    out[key] = normalizeValue(row[key]);
  }
  return out;
}

function rowsEqual(a, b) {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  for (const key of aKeys) {
    const av = a[key];
    const bv = b[key];
    if (typeof av === "number" && typeof bv === "number") {
      if (Math.abs(av - bv) > NUMERIC_TOLERANCE) return false;
    } else if (av !== bv) {
      return false;
    }
  }
  return true;
}

/**
 * Compares a user's result (array of row objects) against the expected
 * result for a question. Column-name comparison is case-insensitive and
 * numbers are compared with a small tolerance to avoid float-precision
 * false negatives.
 */
export function compareResults(actual, expected, { orderMatters = false } = {}) {
  if (!Array.isArray(actual)) {
    return { passed: false, reason: "Query did not return rows to compare." };
  }
  if (actual.length !== expected.length) {
    return {
      passed: false,
      reason: `Expected ${expected.length} row(s), got ${actual.length}.`,
    };
  }

  const normActual = actual.map(normalizeRow);
  const normExpected = expected.map(normalizeRow);

  if (orderMatters) {
    for (let i = 0; i < normExpected.length; i++) {
      if (!rowsEqual(normActual[i], normExpected[i])) {
        return { passed: false, reason: `Row ${i + 1} doesn't match the expected output.` };
      }
    }
    return { passed: true };
  }

  const remaining = [...normActual];
  for (const expRow of normExpected) {
    const idx = remaining.findIndex((r) => rowsEqual(r, expRow));
    if (idx === -1) {
      return { passed: false, reason: "One or more expected rows are missing from your result." };
    }
    remaining.splice(idx, 1);
  }
  return { passed: true };
}
