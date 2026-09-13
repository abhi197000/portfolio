"use client";
import { resumeToText } from "../../../lib/resume/generate";

export default function ResumePreview({ content }) {
  if (!content) return null;
  const b = content.basics || {};
  const contact = [b.email, b.phone, b.location, ...(b.links || [])].filter(Boolean);

  function download() {
    const blob = new Blob([resumeToText(content)], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(b.name || "resume").replace(/\s+/g, "-").toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="cc-card">
      <div className="cc-card-head">
        <h2>Current Resume</h2>
        <button className="cc-btn cc-btn-secondary" style={{ padding: "6px 12px" }} onClick={download}>
          Download .txt
        </button>
      </div>
      <div className="cc-card-body">
        <div className="cc-sheet">
          <h1 className="cc-sheet-name">{b.name || "Your Name"}</h1>
          {b.title && <div className="cc-sheet-title">{b.title}</div>}
          {contact.length > 0 && <div className="cc-sheet-contact">{contact.join("  ·  ")}</div>}

          {content.summary && (
            <>
              <div className="cc-sheet-h">Summary</div>
              <p style={{ fontSize: 13.5, lineHeight: 1.6, margin: 0 }}>{content.summary}</p>
            </>
          )}

          {(content.sections || []).map((section) => (
            <div key={section.id}>
              <div className="cc-sheet-h">{section.title}</div>

              {section.chips?.length > 0 && (
                <div>{section.chips.map((c) => <span className="cc-chip" key={c}>{c}</span>)}</div>
              )}

              {(section.items || []).map((item, i) => (
                <div className="cc-sheet-item" key={i}>
                  <div className="cc-sheet-item-head">
                    <div>
                      <span className="cc-sheet-item-title">{item.title}</span>
                      {item.subtitle && <span className="cc-sheet-item-sub"> — {item.subtitle}</span>}
                    </div>
                    {item.meta && <span className="cc-sheet-item-meta">{item.meta}</span>}
                  </div>
                  {item.bullets?.length > 0 && (
                    <ul>{item.bullets.map((bul, bi) => <li key={bi}>{bul}</li>)}</ul>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
