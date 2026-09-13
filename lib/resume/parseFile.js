// Resume file -> plain text, entirely in the browser (nothing is uploaded).
// Parsers are dynamically imported so they never land in the main bundle.

async function parsePdf(file) {
  const pdfjs = await import("pdfjs-dist");
  // Worker is served from /public (same approach as the sql.js wasm).
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const pages = [];
  for (let i = 1; i <= doc.numPages; i += 1) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();

    // Re-assemble lines by y-position: PDF text comes as positioned fragments,
    // and resumes lose all their structure if we just join them with spaces.
    const rows = new Map();
    for (const item of content.items) {
      if (!item.str) continue;
      const y = Math.round(item.transform[5]);
      if (!rows.has(y)) rows.set(y, []);
      rows.get(y).push({ x: item.transform[4], str: item.str });
    }
    const lines = [...rows.entries()]
      .sort((a, b) => b[0] - a[0]) // top of page first
      .map(([, frags]) =>
        frags.sort((a, b) => a.x - b.x).map((f) => f.str).join(" ").replace(/\s+/g, " ").trim()
      )
      .filter(Boolean);
    pages.push(lines.join("\n"));
  }
  return pages.join("\n");
}

async function parseDocx(file) {
  const mammoth = await import("mammoth/mammoth.browser.js");
  const lib = mammoth.default || mammoth;
  const { value } = await lib.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  return value;
}

export async function parseResumeFile(file) {
  const name = (file?.name || "").toLowerCase();
  if (name.endsWith(".pdf")) return parsePdf(file);
  if (name.endsWith(".docx")) return parseDocx(file);
  if (name.endsWith(".txt") || name.endsWith(".md")) return file.text();
  throw new Error("Unsupported file type — upload a PDF, DOCX, or TXT.");
}
