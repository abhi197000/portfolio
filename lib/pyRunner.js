const PYODIDE_VERSION = "0.26.4";
const PYODIDE_CDN = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

let pyodidePromise = null;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

async function getPyodide(onStatus) {
  if (!pyodidePromise) {
    pyodidePromise = (async () => {
      onStatus?.("Loading Python runtime…");
      await loadScript(`${PYODIDE_CDN}pyodide.js`);
      const pyodide = await window.loadPyodide({ indexURL: PYODIDE_CDN });
      onStatus?.("Loading pandas…");
      await pyodide.loadPackage(["pandas", "numpy"]);
      return pyodide;
    })();
  }
  return pyodidePromise;
}

/**
 * Runs a user's Python/pandas snippet against DataFrames built from the
 * question's seed_data. Executes entirely client-side via Pyodide (WASM) —
 * nothing reaches a server. The snippet must assign its answer to `result`
 * (a DataFrame or something json_normalize-able).
 */
export async function runPythonCode({ seedData, code, onStatus }) {
  const pyodide = await getPyodide(onStatus);

  pyodide.globals.set("__seed_data__", pyodide.toPy(seedData || {}));

  const preamble = `
import pandas as pd
import numpy as np
import json as __json

for __name, __rows in __seed_data__.items():
    globals()[__name] = pd.DataFrame(__rows)
`;

  await pyodide.runPythonAsync(preamble);
  await pyodide.runPythonAsync(code);

  // pandas' own to_json (not Python's json.dumps) is used for DataFrame/Series
  // results because it correctly serializes NaN/NaT as JSON null — plain
  // json.dumps emits a literal NaN token, which is invalid JSON and breaks
  // JSON.parse on the JS side (matters for any left-join-with-missing-values
  // question, e.g. reorder-trigger-date).
  const extractor = `
import pandas as __pd
if isinstance(result, __pd.DataFrame):
    __json_str = result.to_json(orient="records", date_format="iso")
elif isinstance(result, __pd.Series):
    __json_str = result.reset_index().to_json(orient="records", date_format="iso")
elif result is None:
    __json_str = "[]"
else:
    __json_str = __json.dumps(result, default=str)
__json_str
`;
  const jsonStr = await pyodide.runPythonAsync(extractor);
  return JSON.parse(jsonStr);
}
