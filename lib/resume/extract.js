// Heuristic (non-LLM) resume extraction: raw text -> structured draft.
//
// This is a deliberate stub with a stable contract. Swapping in an LLM later
// means replacing the body of extractFromText() only — same input (plain text),
// same output shape. Output is always treated as a *draft* the user corrects in
// the guided form, so imperfect parsing degrades to "some fields pre-filled".

const SECTIONS = [
  { key: "summary", re: /^(summary|profile|objective|about(\s+me)?)\b/i },
  { key: "experience", re: /^(experience|work\s+experience|employment|professional\s+experience|work\s+history)\b/i },
  { key: "projects", re: /^(projects?|selected\s+projects|personal\s+projects|side\s+projects)\b/i },
  { key: "skills", re: /^(skills|technical\s+skills|technologies|tech\s+stack|core\s+competencies)\b/i },
  { key: "education", re: /^(education|academics?|qualifications?)\b/i },
];

const MONTH = "(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*";
const DATE_TOKEN = `(?:${MONTH}\\.?\\s*'?\\d{2,4}|\\d{1,2}\\/\\d{4}|\\d{4})`;
const DATE_RANGE = new RegExp(
  `(${DATE_TOKEN})\\s*(?:-|–|—|to|until)\\s*(present|current|now|${DATE_TOKEN})`,
  "i"
);

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.]+/;
const PHONE_RE = /(\+?\d[\d\s().-]{7,}\d)/;
const URL_RE = /((?:https?:\/\/|www\.)[^\s,|]+|(?:linkedin\.com|github\.com)\/[^\s,|]+)/gi;
const BULLET_RE = /^\s*[•·▪◦*\-–—]\s+/;

function isBullet(line) {
  return BULLET_RE.test(line);
}
function stripBullet(line) {
  return line.replace(BULLET_RE, "").trim();
}
function matchSection(line) {
  const bare = line.replace(/[:\s]+$/, "").trim();
  if (bare.length > 40) return null; // headings are short
  for (const s of SECTIONS) if (s.re.test(bare)) return s.key;
  return null;
}

function extractDates(line) {
  const m = line.match(DATE_RANGE);
  if (!m) return null;
  return { start: m[1].trim(), end: m[2].trim(), raw: m[0] };
}

// "Senior Analyst at Acme" / "Acme — Senior Analyst" / "Senior Analyst, Acme"
function splitRoleCompany(text) {
  const cleaned = text.replace(/[|,–—-]\s*$/, "").trim();
  const at = cleaned.split(/\s+(?:at|@)\s+/i);
  if (at.length === 2) return { role: at[0].trim(), company: at[1].trim() };
  const sep = cleaned.split(/\s*[|–—]\s*|\s{2,}|,\s+/);
  if (sep.length >= 2) return { role: sep[0].trim(), company: sep.slice(1).join(", ").trim() };
  return { role: cleaned, company: "" };
}

function parseEntries(lines, { nameKey = "role" } = {}) {
  const entries = [];
  let cur = null;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    if (isBullet(line)) {
      if (!cur) {
        cur = { role: "", company: "", start: "", end: "", bullets: [] };
        entries.push(cur);
      }
      cur.bullets.push(stripBullet(line));
      continue;
    }

    const dates = extractDates(line);
    const headerText = dates ? line.replace(dates.raw, "").trim() : line;

    // A line with dates, or the first line, starts a new entry. A dateless line
    // right after a header fills in whichever of role/company is still blank.
    if (dates || !cur) {
      cur = { role: "", company: "", start: dates?.start || "", end: dates?.end || "", bullets: [] };
      entries.push(cur);
      if (headerText) Object.assign(cur, splitRoleCompany(headerText));
    } else if (cur.bullets.length === 0 && !cur.company) {
      if (!cur[nameKey]) cur[nameKey] = line;
      else cur.company = line;
    } else {
      cur = { role: line, company: "", start: "", end: "", bullets: [] };
      entries.push(cur);
    }
  }
  return entries.filter((e) => e.role || e.company || e.bullets.length);
}

function parseSkills(lines) {
  const out = [];
  for (const line of lines) {
    const body = stripBullet(line).replace(/^[A-Za-z /&]+:\s*/, ""); // drop "Languages:" prefixes
    for (const piece of body.split(/[,|;•·]/)) {
      const s = piece.trim();
      if (s.length >= 1 && s.length <= 40) out.push(s);
    }
  }
  return [...new Set(out)];
}

function parseEducation(lines) {
  return parseEntries(lines).map((e) => ({
    school: e.company || e.role,
    degree: e.company ? e.role : "",
    year: e.end || e.start || "",
  }));
}

function parseBasics(headLines) {
  const joined = headLines.join("\n");
  const email = (joined.match(EMAIL_RE) || [])[0] || "";
  const phone = (joined.match(PHONE_RE) || [])[0]?.trim() || "";
  const links = [...new Set(joined.match(URL_RE) || [])].map((l) => l.replace(/[.,]$/, ""));

  let name = "";
  let title = "";
  for (const line of headLines) {
    const l = line.trim();
    if (!l) continue;
    if (EMAIL_RE.test(l) || PHONE_RE.test(l) || /https?:|linkedin|github/i.test(l)) continue;
    const words = l.split(/\s+/);
    if (!name && words.length >= 1 && words.length <= 5 && !/\d/.test(l)) {
      name = l;
      continue;
    }
    if (name && !title && l.length <= 80) {
      title = l;
      break;
    }
  }
  return { name, title, email, phone, location: "", links };
}

export function extractFromText(text) {
  const lines = String(text || "").split(/\r?\n/);

  const head = [];
  const buckets = { summary: [], experience: [], projects: [], skills: [], education: [] };
  let current = null;

  for (const line of lines) {
    const key = matchSection(line);
    if (key) {
      current = key;
      continue;
    }
    if (!line.trim()) continue;
    if (current) buckets[current].push(line);
    else head.push(line);
  }

  return {
    basics: parseBasics(head),
    summary: buckets.summary.map((l) => stripBullet(l)).join(" ").trim(),
    experience: parseEntries(buckets.experience),
    projects: parseEntries(buckets.projects).map((p) => ({
      name: p.role || p.company,
      summary: "",
      bullets: p.bullets,
    })),
    skills: parseSkills(buckets.skills),
    education: parseEducation(buckets.education),
  };
}

export function emptyDraft() {
  return {
    basics: { name: "", title: "", email: "", phone: "", location: "", links: [] },
    summary: "",
    experience: [],
    projects: [],
    skills: [],
    education: [],
  };
}

// Very small keyword pass so a newly described project links to skills already
// in the graph (the LLM would do this far better — same contract).
export function inferSkills(text, knownSkills = []) {
  const hay = String(text || "").toLowerCase();
  return knownSkills.filter((s) => hay.includes(String(s).toLowerCase()));
}
