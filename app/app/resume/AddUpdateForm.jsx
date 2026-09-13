"use client";
import { useState } from "react";

// "I worked on something new" — the whole point of the living resume.
export default function AddUpdateForm({ knownSkills = [], onAdd, adding, error }) {
  const [name, setName] = useState("");
  const [bullets, setBullets] = useState("");
  const [skills, setSkills] = useState("");

  const canSubmit = name.trim() && !adding;

  function submit() {
    if (!canSubmit) return;
    onAdd({
      name: name.trim(),
      summary: "",
      bullets: bullets.split("\n").map((l) => l.trim()).filter(Boolean),
      skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
    });
    setName("");
    setBullets("");
    setSkills("");
  }

  return (
    <div className="cc-card">
      <div className="cc-card-head">
        <h2>Shipped something new?</h2>
        <span className="cc-badge cc-badge-pink">Updates your resume</span>
      </div>
      <div className="cc-card-body cc-grid" style={{ gap: 14 }}>
        <div>
          <label className="cc-label">What did you build?</label>
          <input
            className="cc-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Realtime pricing monitor"
          />
        </div>
        <div>
          <label className="cc-label">What did it do / what changed? (one per line)</label>
          <textarea
            className="cc-textarea"
            rows={3}
            value={bullets}
            onChange={(e) => setBullets(e.target.value)}
            placeholder={"Streamed competitor prices into BigQuery\nAlerted the pricing team on undercuts within 5 minutes"}
          />
        </div>
        <div>
          <label className="cc-label">Tech / skills used (comma separated)</label>
          <input
            className="cc-input"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            placeholder="Python, BigQuery, Airflow"
          />
          {knownSkills.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <span className="cc-muted" style={{ fontSize: 12, marginRight: 6 }}>Already in your graph:</span>
              {knownSkills.slice(0, 12).map((s) => (
                <button
                  key={s}
                  className="cc-chip"
                  style={{ border: "none", cursor: "pointer" }}
                  onClick={() => {
                    const list = skills.split(",").map((x) => x.trim()).filter(Boolean);
                    if (!list.some((x) => x.toLowerCase() === s.toLowerCase())) {
                      setSkills([...list, s].join(", "));
                    }
                  }}
                >
                  + {s}
                </button>
              ))}
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button className="cc-btn cc-btn-primary" onClick={submit} disabled={!canSubmit}>
            {adding ? "Updating your resume…" : "Add & update my resume"}
          </button>
          {error && <span style={{ color: "var(--v-magenta)", fontSize: 13 }}>{error}</span>}
        </div>
      </div>
    </div>
  );
}
