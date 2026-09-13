"use client";
import { useEffect, useMemo, useState } from "react";
import { emptyDraft, extractFromText } from "../../../lib/resume/extract";
import { parseResumeFile } from "../../../lib/resume/parseFile";
import { buildResumeContent } from "../../../lib/resume/generate";
import { addProject, listVersions, loadGraph, resetGraph, saveDraftAsGraph, saveVersion } from "../../../lib/resume/store";
import ResumeOnboarding from "./ResumeOnboarding";
import ResumePreview from "./ResumePreview";
import GraphView from "./GraphView";
import AddUpdateForm from "./AddUpdateForm";

export default function ResumeWorkspace() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [graph, setGraph] = useState({ nodes: [], edges: [] });
  const [versions, setVersions] = useState([]);

  const [draft, setDraft] = useState(emptyDraft());
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [tab, setTab] = useState("resume");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");
  const [flash, setFlash] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const g = await loadGraph();
        setGraph(g);
        if (g.nodes.length) setVersions(await listVersions());
      } catch (err) {
        setLoadError(err.message || String(err));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const hasGraph = graph.nodes.length > 0;
  const content = useMemo(() => (hasGraph ? buildResumeContent(graph) : null), [graph, hasGraph]);
  const knownSkills = graph.nodes.filter((n) => n.type === "skill").map((n) => n.label);

  async function handleFile(file) {
    setParsing(true);
    setParseError("");
    try {
      const text = await parseResumeFile(file);
      const extracted = extractFromText(text);
      setDraft(extracted);
    } catch (err) {
      setParseError(err.message || "Couldn't read that file — you can still fill the form by hand.");
    } finally {
      setParsing(false);
    }
  }

  async function handleSaveDraft() {
    setSaving(true);
    setSaveError("");
    try {
      const g = await saveDraftAsGraph(draft);
      await saveVersion(g, "Initial resume from setup");
      setGraph(g);
      setVersions(await listVersions());
      setFlash("Knowledge graph built — here's your resume.");
    } catch (err) {
      setSaveError(err.message || String(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleAdd(input) {
    setAdding(true);
    setAddError("");
    try {
      const g = await addProject(input);
      await saveVersion(g, `Added project: ${input.name}`);
      setGraph(g);
      setVersions(await listVersions());
      setTab("resume");
      setFlash(`Added "${input.name}" — your resume has been updated.`);
    } catch (err) {
      setAddError(err.message || String(err));
    } finally {
      setAdding(false);
    }
  }

  async function handleReset() {
    if (!window.confirm("This deletes your knowledge graph and starts over. Saved resume versions are kept. Continue?")) return;
    await resetGraph();
    setGraph({ nodes: [], edges: [] });
    setDraft(emptyDraft());
    setFlash("");
  }

  if (loading) {
    return <main className="cc-main"><p className="cc-muted">Loading your resume…</p></main>;
  }

  if (loadError) {
    return (
      <main className="cc-main">
        <div className="cc-card"><div className="cc-card-body">
          <p style={{ marginTop: 0 }}>Couldn&apos;t load your resume data.</p>
          <p className="cc-muted" style={{ fontSize: 13 }}>{loadError}</p>
          <p className="cc-muted" style={{ fontSize: 13, marginBottom: 0 }}>
            If this is the first run, make sure <code>db/app-schema.sql</code> has been applied in Supabase.
          </p>
        </div></div>
      </main>
    );
  }

  if (!hasGraph) {
    return (
      <main className="cc-main">
        <h1 className="cc-hero-greeting">Set up your living resume</h1>
        <p className="cc-hero-sub">Do this once. After that, updating it takes a sentence.</p>
        <ResumeOnboarding
          draft={draft}
          setDraft={setDraft}
          onFile={handleFile}
          parsing={parsing}
          parseError={parseError}
          onSave={handleSaveDraft}
          saving={saving}
          saveError={saveError}
        />
      </main>
    );
  }

  return (
    <main className="cc-main">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
        <div>
          <h1 className="cc-hero-greeting" style={{ marginBottom: 2 }}>Your Living Resume</h1>
          <p className="cc-hero-sub" style={{ marginBottom: 0 }}>
            {versions.length} version{versions.length === 1 ? "" : "s"} saved · always built from your graph
          </p>
        </div>
        <div className="cc-tabs">
          {[["resume", "Resume"], ["graph", "Knowledge Graph"], ["history", "History"]].map(([id, label]) => (
            <button key={id} className={`cc-tab ${tab === id ? "cc-tab-active" : ""}`} onClick={() => setTab(id)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {flash && (
        <div className="cc-card" style={{ marginBottom: 20, borderColor: "var(--v-green)" }}>
          <div className="cc-card-body" style={{ padding: "14px 20px", display: "flex", justifyContent: "space-between", gap: 12 }}>
            <span style={{ fontSize: 14 }}>✅ {flash}</span>
            <button className="cc-link-btn" onClick={() => setFlash("")}>Dismiss</button>
          </div>
        </div>
      )}

      <div className="cc-grid" style={{ gap: 20 }}>
        {tab === "resume" && (
          <>
            <AddUpdateForm knownSkills={knownSkills} onAdd={handleAdd} adding={adding} error={addError} />
            <ResumePreview content={content} />
          </>
        )}

        {tab === "graph" && <GraphView nodes={graph.nodes} edges={graph.edges} />}

        {tab === "history" && (
          <div className="cc-card">
            <div className="cc-card-head"><h2>Version History</h2></div>
            <div className="cc-card-body">
              {versions.length === 0 && <p className="cc-muted" style={{ margin: 0 }}>No versions saved yet.</p>}
              <div className="cc-grid" style={{ gap: 10 }}>
                {versions.map((v) => (
                  <div className="cc-entry" key={v.id} style={{ marginBottom: 0 }}>
                    <div className="cc-entry-head" style={{ marginBottom: 0 }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>
                          v{v.version_number} · {v.change_note || "Updated"}
                        </div>
                        <div className="cc-graph-node-meta">
                          {new Date(v.created_at).toLocaleString()}
                        </div>
                      </div>
                      <span className="cc-badge cc-badge-muted">
                        {(v.content?.sections || []).reduce((n, s) => n + (s.items?.length || 0), 0)} entries
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="cc-card">
          <div className="cc-card-body" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <span className="cc-muted" style={{ fontSize: 13 }}>
              Parsed something wrong? Rebuild the graph from scratch.
            </span>
            <button className="cc-btn cc-btn-secondary" onClick={handleReset}>Start over</button>
          </div>
        </div>
      </div>
    </main>
  );
}
