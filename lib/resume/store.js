// Per-user resume graph persistence. All reads/writes go through the browser
// Supabase client carrying the user's session — RLS (db/app-schema.sql) is what
// scopes every row to auth.uid(), so there's no server route to forge.

import { createClient } from "../supabase/client";
import { inferSkills } from "./extract";
import { buildResumeContent } from "./generate";

async function ctx() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  return { supabase, userId: user.id };
}

export async function loadGraph() {
  const { supabase } = await ctx();
  const [nodesRes, edgesRes] = await Promise.all([
    supabase.from("resume_nodes").select("*"),
    supabase.from("resume_edges").select("*"),
  ]);
  if (nodesRes.error) throw nodesRes.error;
  if (edgesRes.error) throw edgesRes.error;
  return { nodes: nodesRes.data || [], edges: edgesRes.data || [] };
}

function draftToNodeRows(draft, userId) {
  const rows = [];
  const b = draft.basics || {};
  rows.push({
    user_id: userId,
    type: "basics",
    label: b.name || "Your Name",
    data: {
      title: b.title || "",
      email: b.email || "",
      phone: b.phone || "",
      location: b.location || "",
      links: b.links || [],
      summary: draft.summary || "",
    },
  });
  for (const e of draft.experience || []) {
    rows.push({
      user_id: userId,
      type: "experience",
      label: e.role || e.company || "Role",
      data: { company: e.company || "", start: e.start || "", end: e.end || "", bullets: e.bullets || [] },
    });
  }
  for (const p of draft.projects || []) {
    rows.push({
      user_id: userId,
      type: "project",
      label: p.name || "Project",
      data: { summary: p.summary || "", bullets: p.bullets || [], date: p.date || "" },
    });
  }
  for (const s of draft.skills || []) {
    rows.push({ user_id: userId, type: "skill", label: s, data: {} });
  }
  for (const ed of draft.education || []) {
    rows.push({
      user_id: userId,
      type: "education",
      label: ed.school || "School",
      data: { degree: ed.degree || "", year: ed.year || "" },
    });
  }
  return rows;
}

// First-time save: wipe any existing graph and rebuild it from the draft.
export async function saveDraftAsGraph(draft) {
  const { supabase, userId } = await ctx();

  const del = await supabase.from("resume_nodes").delete().eq("user_id", userId);
  if (del.error) throw del.error;

  const { data: nodes, error } = await supabase
    .from("resume_nodes")
    .insert(draftToNodeRows(draft, userId))
    .select();
  if (error) throw error;

  const skillNodes = nodes.filter((n) => n.type === "skill");
  const skillLabels = skillNodes.map((n) => n.label);
  const edgeRows = [];
  for (const project of nodes.filter((n) => n.type === "project")) {
    const text = [project.label, project.data?.summary, ...(project.data?.bullets || [])].join(" ");
    for (const label of inferSkills(text, skillLabels)) {
      const skill = skillNodes.find((s) => s.label === label);
      if (skill) {
        edgeRows.push({ user_id: userId, from_node: project.id, to_node: skill.id, relation: "uses" });
      }
    }
  }
  if (edgeRows.length) {
    const edgeRes = await supabase.from("resume_edges").insert(edgeRows);
    if (edgeRes.error) throw edgeRes.error;
  }

  return loadGraph();
}

// "I shipped something new" — add a project, attach skills (existing or new).
export async function addProject({ name, summary, bullets = [], skills = [] }) {
  const { supabase, userId } = await ctx();
  const graph = await loadGraph();

  const { data: inserted, error } = await supabase
    .from("resume_nodes")
    .insert({
      user_id: userId,
      type: "project",
      label: name,
      data: { summary, bullets, date: new Date().toISOString().slice(0, 7) },
    })
    .select()
    .single();
  if (error) throw error;

  // Reuse an existing skill node when the label already exists (case-insensitive).
  const existing = graph.nodes.filter((n) => n.type === "skill");
  const edgeRows = [];
  const toCreate = [];
  for (const raw of skills) {
    const label = String(raw).trim();
    if (!label) continue;
    const hit = existing.find((s) => s.label.toLowerCase() === label.toLowerCase());
    if (hit) edgeRows.push({ user_id: userId, from_node: inserted.id, to_node: hit.id, relation: "uses" });
    else toCreate.push({ user_id: userId, type: "skill", label, data: {} });
  }
  if (toCreate.length) {
    const { data: newSkills, error: sErr } = await supabase.from("resume_nodes").insert(toCreate).select();
    if (sErr) throw sErr;
    for (const s of newSkills) {
      edgeRows.push({ user_id: userId, from_node: inserted.id, to_node: s.id, relation: "uses" });
    }
  }
  if (edgeRows.length) {
    const eErr = (await supabase.from("resume_edges").insert(edgeRows)).error;
    if (eErr) throw eErr;
  }

  return loadGraph();
}

export async function listVersions() {
  const { supabase } = await ctx();
  const { data, error } = await supabase
    .from("resume_versions")
    .select("id, version_number, change_note, created_at, content")
    .order("version_number", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function countVersions() {
  const { supabase } = await ctx();
  const { count, error } = await supabase.from("resume_versions").select("id", { count: "exact", head: true });
  if (error) throw error;
  return count || 0;
}

export async function saveVersion(graph, changeNote) {
  const { supabase, userId } = await ctx();
  const { data: latest } = await supabase
    .from("resume_versions")
    .select("version_number")
    .order("version_number", { ascending: false })
    .limit(1);
  const nextNumber = (latest?.[0]?.version_number || 0) + 1;

  const content = buildResumeContent(graph);
  const { data, error } = await supabase
    .from("resume_versions")
    .insert({ user_id: userId, version_number: nextNumber, content, change_note: changeNote })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function resetGraph() {
  const { supabase, userId } = await ctx();
  const { error } = await supabase.from("resume_nodes").delete().eq("user_id", userId);
  if (error) throw error;
}
