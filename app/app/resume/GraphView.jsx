"use client";
import { skillsForNode } from "../../../lib/resume/generate";

const COLUMNS = [
  { type: "experience", title: "Roles" },
  { type: "project", title: "Projects" },
  { type: "skill", title: "Skills" },
  { type: "education", title: "Education" },
];

export default function GraphView({ nodes = [], edges = [] }) {
  const usedSkillIds = new Set(edges.filter((e) => e.relation === "uses").map((e) => e.to_node));

  return (
    <div className="cc-card">
      <div className="cc-card-head">
        <h2>Your Knowledge Graph</h2>
        <span className="cc-badge cc-badge-muted">
          {nodes.filter((n) => n.type !== "basics").length} nodes · {edges.length} links
        </span>
      </div>
      <div className="cc-card-body">
        <p className="cc-muted" style={{ marginTop: 0, fontSize: 13 }}>
          Everything on your resume, stored as connected pieces — so adding one project updates
          every place it belongs.
        </p>

        <div className="cc-graph">
          {COLUMNS.map((col) => {
            const items = nodes.filter((n) => n.type === col.type);
            return (
              <div className="cc-graph-col" key={col.type}>
                <h3>{col.title} ({items.length})</h3>
                {items.length === 0 && <p className="cc-muted" style={{ fontSize: 12, margin: 0 }}>None yet</p>}
                {items.map((n) => {
                  const linked = col.type === "project" ? skillsForNode(n.id, nodes, edges) : [];
                  const meta =
                    col.type === "experience"
                      ? [n.data?.company, [n.data?.start, n.data?.end].filter(Boolean).join(" — ")]
                          .filter(Boolean).join(" · ")
                      : col.type === "education"
                      ? [n.data?.degree, n.data?.year].filter(Boolean).join(" · ")
                      : col.type === "skill"
                      ? usedSkillIds.has(n.id) ? "linked to a project" : "not linked yet"
                      : linked.length ? `uses ${linked.join(", ")}` : "no skills linked";
                  return (
                    <div className="cc-graph-node" key={n.id}>
                      <div className="cc-graph-node-label">{n.label}</div>
                      {meta && <div className="cc-graph-node-meta">{meta}</div>}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
