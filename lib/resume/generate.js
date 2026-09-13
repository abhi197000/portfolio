// Graph -> rendered resume content. Deterministic today; this is the second
// seam where an LLM can later rewrite/tighten bullets. The contract stays:
// buildResumeContent(graph) -> { basics, summary, sections[] }.

const MONTHS = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
};

// Sortable number from loose date text ("Jan 2023", "2020", "Present").
export function dateRank(text) {
  const s = String(text || "").trim().toLowerCase();
  if (!s) return 0;
  if (/present|current|now/.test(s)) return 999999;
  const year = (s.match(/\d{4}/) || [])[0];
  if (!year) return 0;
  const mon = Object.keys(MONTHS).find((m) => s.startsWith(m));
  return Number(year) * 12 + (mon ? MONTHS[mon] : 0);
}

function formatRange(start, end) {
  if (!start && !end) return "";
  if (start && end) return `${start} — ${end}`;
  return start || end;
}

export function skillsForNode(nodeId, nodes, edges) {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  return edges
    .filter((e) => e.from_node === nodeId && e.relation === "uses")
    .map((e) => byId.get(e.to_node)?.label)
    .filter(Boolean);
}

export function buildResumeContent(graph) {
  const { nodes = [], edges = [] } = graph || {};
  const basicsNode = nodes.find((n) => n.type === "basics");
  const basics = {
    name: basicsNode?.label || "",
    title: basicsNode?.data?.title || "",
    email: basicsNode?.data?.email || "",
    phone: basicsNode?.data?.phone || "",
    location: basicsNode?.data?.location || "",
    links: basicsNode?.data?.links || [],
  };

  const experience = nodes
    .filter((n) => n.type === "experience")
    .sort((a, b) => dateRank(b.data?.start) - dateRank(a.data?.start))
    .map((n) => ({
      title: n.label,
      subtitle: n.data?.company || "",
      meta: formatRange(n.data?.start, n.data?.end),
      bullets: n.data?.bullets || [],
    }));

  const projects = nodes
    .filter((n) => n.type === "project")
    .sort((a, b) => dateRank(b.data?.date) - dateRank(a.data?.date))
    .map((n) => ({
      title: n.label,
      subtitle: skillsForNode(n.id, nodes, edges).join(" · "),
      meta: n.data?.date || "",
      bullets: n.data?.bullets || (n.data?.summary ? [n.data.summary] : []),
    }));

  const skills = nodes.filter((n) => n.type === "skill").map((n) => n.label);

  const education = nodes
    .filter((n) => n.type === "education")
    .sort((a, b) => dateRank(b.data?.year) - dateRank(a.data?.year))
    .map((n) => ({
      title: n.data?.degree || n.label,
      subtitle: n.data?.degree ? n.label : "",
      meta: n.data?.year || "",
      bullets: [],
    }));

  const sections = [
    { id: "experience", title: "Experience", items: experience },
    { id: "projects", title: "Projects", items: projects },
    { id: "skills", title: "Skills", chips: skills, items: [] },
    { id: "education", title: "Education", items: education },
  ].filter((s) => s.items.length > 0 || (s.chips && s.chips.length > 0));

  return {
    basics,
    summary: basicsNode?.data?.summary || "",
    sections,
    generated_at: new Date().toISOString(),
  };
}

// Plain-text export (download / copy-paste into an ATS box).
export function resumeToText(content) {
  const out = [];
  const b = content.basics || {};
  if (b.name) out.push(b.name);
  if (b.title) out.push(b.title);
  const contact = [b.email, b.phone, b.location, ...(b.links || [])].filter(Boolean).join(" | ");
  if (contact) out.push(contact);
  if (content.summary) out.push("", "SUMMARY", content.summary);

  for (const section of content.sections || []) {
    out.push("", section.title.toUpperCase());
    if (section.chips?.length) out.push(section.chips.join(", "));
    for (const item of section.items || []) {
      const head = [item.title, item.subtitle].filter(Boolean).join(" — ");
      out.push(item.meta ? `${head}  (${item.meta})` : head);
      for (const bullet of item.bullets || []) out.push(`• ${bullet}`);
    }
  }
  return out.join("\n");
}
