"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AgentOrb from "./AgentOrb";
import { MODULE_NAME } from "./brand";

const Icon = {
  command: <path d="M12 3a9 9 0 1 0 9 9M12 7a5 5 0 1 0 5 5M12 12l7-7" />,
  practice: <path d="M4 5h16v14H4zM8 10l3 2-3 2M13 15h3" />,
  cert: <path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6zM9 12l2 2 4-4" />,
  story: <path d="M4 19V5M4 19h16M8 15l3-4 3 2 5-6" />,
  resume: <path d="M6 3h9l4 4v14H6zM9 12h7M9 16h5M9 8h3" />,
  back: <path d="M15 5l-7 7 7 7" />,
};

const SECTIONS = [
  {
    label: "Operate",
    items: [{ href: "/app", label: "Command Center", icon: "command", match: (p) => p === "/app" }],
  },
  {
    label: "Train",
    items: [
      {
        href: "/app/practice",
        label: "Practice Sim",
        icon: "practice",
        match: (p) => p.startsWith("/app/practice") && !p.startsWith("/app/practice/test"),
      },
      { href: "/app/practice/test", label: "Certification", icon: "cert", match: (p) => p.startsWith("/app/practice/test") },
    ],
  },
  {
    label: "Profile",
    items: [
      { href: "/app/story", label: "My Story", icon: "story", match: (p) => p.startsWith("/app/story") },
      { href: "/app/resume", label: "Living Resume", icon: "resume", match: (p) => p.startsWith("/app/resume") },
    ],
  },
];

function Svg({ name }) {
  return (
    <svg className="cc-rail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {Icon[name]}
    </svg>
  );
}

export default function Shell({ email, children }) {
  const pathname = usePathname() || "";

  return (
    <div className="cc-shell">
      <aside className="cc-rail">
        <Link href="/app" className="cc-rail-brand">
          <AgentOrb size={34} />
          <span>
            <div className="cc-rail-brand-name">{MODULE_NAME.toUpperCase()}</div>
            <div className="cc-rail-brand-sub"><span className="cc-status-dot" />AGENT ONLINE</div>
          </span>
        </Link>

        <div className="cc-rail-nav">
          {SECTIONS.map((section) => (
            <div key={section.label} style={{ display: "contents" }}>
              <div className="cc-rail-section">{section.label}</div>
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`cc-rail-link ${item.match(pathname) ? "cc-rail-link-active" : ""}`}
                >
                  <Svg name={item.icon} />
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
        </div>

        <div className="cc-rail-foot">
          {email && <div className="cc-rail-user" title={email}>{email}</div>}
          <div style={{ display: "flex", gap: 8 }}>
            <Link href="/" className="cc-btn cc-btn-ghost" style={{ padding: "8px 10px", flex: 1 }}>
              Portfolio
            </Link>
            <form action="/auth/signout" method="post" style={{ flex: 1, display: "flex" }}>
              <button className="cc-btn cc-btn-secondary" style={{ padding: "8px 10px", flex: 1 }}>Sign out</button>
            </form>
          </div>
        </div>
      </aside>

      <div className="cc-content">{children}</div>
    </div>
  );
}
