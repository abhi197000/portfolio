"use client";
import { useRef } from "react";

function Field({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div>
      <label className="cc-label">{label}</label>
      <input
        className="cc-input"
        type={type}
        value={value || ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function Bullets({ value, onChange }) {
  return (
    <div>
      <label className="cc-label">Bullet points (one per line)</label>
      <textarea
        className="cc-textarea"
        rows={4}
        value={(value || []).join("\n")}
        onChange={(e) => onChange(e.target.value.split("\n").filter((l) => l.trim()))}
      />
    </div>
  );
}

export default function ResumeOnboarding({
  draft,
  setDraft,
  onFile,
  parsing,
  parseError,
  onSave,
  saving,
  saveError,
}) {
  const fileRef = useRef(null);

  const update = (patch) => setDraft({ ...draft, ...patch });
  const updateBasics = (patch) => update({ basics: { ...draft.basics, ...patch } });

  const updateList = (key, index, patch) => {
    const next = [...draft[key]];
    next[index] = { ...next[index], ...patch };
    update({ [key]: next });
  };
  const removeFrom = (key, index) => update({ [key]: draft[key].filter((_, i) => i !== index) });
  const addTo = (key, blank) => update({ [key]: [...draft[key], blank] });

  return (
    <div className="cc-grid" style={{ gap: 20 }}>
      <div className="cc-card">
        <div className="cc-card-head"><h2>Start from your existing resume</h2></div>
        <div className="cc-card-body">
          <div className="cc-dropzone">
            <strong>Upload a PDF, DOCX, or TXT</strong>
            <p className="cc-muted" style={{ fontSize: 13, margin: "0 0 14px" }}>
              We read it in your browser — the file is never uploaded anywhere. We&apos;ll pre-fill
              the form below so you only have to correct it.
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.docx,.txt,.md"
              style={{ display: "none" }}
              onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
            />
            <button
              className="cc-btn cc-btn-primary"
              onClick={() => fileRef.current?.click()}
              disabled={parsing}
            >
              {parsing ? "Reading your resume…" : "Choose a file"}
            </button>
            {parseError && (
              <p style={{ color: "var(--cc-accent-ink)", fontSize: 13, marginBottom: 0 }}>{parseError}</p>
            )}
          </div>
        </div>
      </div>

      <div className="cc-card">
        <div className="cc-card-head">
          <h2>Your details</h2>
          <span className="cc-badge cc-badge-muted">Edit anything that looks off</span>
        </div>
        <div className="cc-card-body cc-grid" style={{ gap: 18 }}>
          <div className="cc-form-row cc-form-row-2">
            <Field label="Full name" value={draft.basics.name} onChange={(v) => updateBasics({ name: v })} placeholder="Abhimanyu Sheoran" />
            <Field label="Headline / title" value={draft.basics.title} onChange={(v) => updateBasics({ title: v })} placeholder="Senior Data Analyst" />
            <Field label="Email" value={draft.basics.email} onChange={(v) => updateBasics({ email: v })} type="email" />
            <Field label="Phone" value={draft.basics.phone} onChange={(v) => updateBasics({ phone: v })} />
            <Field label="Location" value={draft.basics.location} onChange={(v) => updateBasics({ location: v })} placeholder="Bengaluru, India" />
            <Field
              label="Links (comma separated)"
              value={(draft.basics.links || []).join(", ")}
              onChange={(v) => updateBasics({ links: v.split(",").map((s) => s.trim()).filter(Boolean) })}
            />
          </div>

          <div>
            <label className="cc-label">Summary</label>
            <textarea
              className="cc-textarea"
              rows={3}
              value={draft.summary}
              onChange={(e) => update({ summary: e.target.value })}
              placeholder="Two lines on what you do and the value you bring."
            />
          </div>
        </div>
      </div>

      <div className="cc-card">
        <div className="cc-card-head">
          <h2>Experience</h2>
          <button className="cc-btn cc-btn-secondary" style={{ padding: "6px 12px" }}
            onClick={() => addTo("experience", { role: "", company: "", start: "", end: "", bullets: [] })}>
            + Add role
          </button>
        </div>
        <div className="cc-card-body">
          {draft.experience.length === 0 && <p className="cc-muted" style={{ margin: 0 }}>No roles yet.</p>}
          {draft.experience.map((e, i) => (
            <div className="cc-entry" key={i}>
              <div className="cc-entry-head">
                <strong style={{ fontSize: 13 }}>Role {i + 1}</strong>
                <button className="cc-link-btn" onClick={() => removeFrom("experience", i)}>Remove</button>
              </div>
              <div className="cc-form-row cc-form-row-2" style={{ marginBottom: 12 }}>
                <Field label="Job title" value={e.role} onChange={(v) => updateList("experience", i, { role: v })} />
                <Field label="Company" value={e.company} onChange={(v) => updateList("experience", i, { company: v })} />
                <Field label="Start" value={e.start} onChange={(v) => updateList("experience", i, { start: v })} placeholder="Jan 2023" />
                <Field label="End" value={e.end} onChange={(v) => updateList("experience", i, { end: v })} placeholder="Present" />
              </div>
              <Bullets value={e.bullets} onChange={(v) => updateList("experience", i, { bullets: v })} />
            </div>
          ))}
        </div>
      </div>

      <div className="cc-card">
        <div className="cc-card-head">
          <h2>Projects</h2>
          <button className="cc-btn cc-btn-secondary" style={{ padding: "6px 12px" }}
            onClick={() => addTo("projects", { name: "", summary: "", bullets: [] })}>
            + Add project
          </button>
        </div>
        <div className="cc-card-body">
          {draft.projects.length === 0 && <p className="cc-muted" style={{ margin: 0 }}>No projects yet.</p>}
          {draft.projects.map((p, i) => (
            <div className="cc-entry" key={i}>
              <div className="cc-entry-head">
                <strong style={{ fontSize: 13 }}>Project {i + 1}</strong>
                <button className="cc-link-btn" onClick={() => removeFrom("projects", i)}>Remove</button>
              </div>
              <div style={{ marginBottom: 12 }}>
                <Field label="Project name" value={p.name} onChange={(v) => updateList("projects", i, { name: v })} />
              </div>
              <Bullets value={p.bullets} onChange={(v) => updateList("projects", i, { bullets: v })} />
            </div>
          ))}
        </div>
      </div>

      <div className="cc-card">
        <div className="cc-card-head"><h2>Skills &amp; Education</h2></div>
        <div className="cc-card-body cc-grid" style={{ gap: 18 }}>
          <div>
            <label className="cc-label">Skills (comma separated)</label>
            <textarea
              className="cc-textarea"
              rows={2}
              value={(draft.skills || []).join(", ")}
              onChange={(e) => update({ skills: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
              placeholder="SQL, Python, pandas, Airflow"
            />
            <div style={{ marginTop: 10 }}>
              {(draft.skills || []).map((s) => <span className="cc-chip" key={s}>{s}</span>)}
            </div>
          </div>

          <div>
            <div className="cc-entry-head">
              <label className="cc-label" style={{ marginBottom: 0 }}>Education</label>
              <button className="cc-link-btn" onClick={() => addTo("education", { school: "", degree: "", year: "" })}>
                + Add
              </button>
            </div>
            {draft.education.map((ed, i) => (
              <div className="cc-entry" key={i}>
                <div className="cc-entry-head">
                  <strong style={{ fontSize: 13 }}>Education {i + 1}</strong>
                  <button className="cc-link-btn" onClick={() => removeFrom("education", i)}>Remove</button>
                </div>
                <div className="cc-form-row cc-form-row-2">
                  <Field label="School" value={ed.school} onChange={(v) => updateList("education", i, { school: v })} />
                  <Field label="Degree" value={ed.degree} onChange={(v) => updateList("education", i, { degree: v })} />
                  <Field label="Year" value={ed.year} onChange={(v) => updateList("education", i, { year: v })} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="cc-card">
        <div className="cc-card-body" style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <button className="cc-btn cc-btn-primary" onClick={onSave} disabled={saving}>
            {saving ? "Building your graph…" : "Build my knowledge graph →"}
          </button>
          <span className="cc-muted" style={{ fontSize: 13 }}>
            We&apos;ll turn this into a graph of your skills, projects and roles — then keep it updated.
          </span>
          {saveError && <p style={{ color: "var(--cc-accent-ink)", fontSize: 13, margin: 0 }}>{saveError}</p>}
        </div>
      </div>
    </div>
  );
}
