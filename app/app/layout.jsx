import "../career-theme.css";
import Link from "next/link";
import { createClient } from "../../lib/supabase/server";

export const metadata = { title: "Career Comfort — Dashboard" };

export default async function AppLayout({ children }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="cc-page">
      <nav className="cc-nav">
        <div className="cc-nav-inner">
          <Link href="/app" className="cc-brand" style={{ textDecoration: "none", color: "inherit" }}>
            Career<span>Comfort</span>
          </Link>
          <div className="cc-nav-links">
            <Link href="/app" className="cc-nav-link">Dashboard</Link>
            <a href="/app#resume" className="cc-nav-link">Resume</a>
            <Link href="/practice" className="cc-nav-link">Practice</Link>
            {user && <span className="cc-nav-link" style={{ color: "var(--cc-muted)" }}>{user.email}</span>}
            <form action="/auth/signout" method="post">
              <button className="cc-btn cc-btn-secondary" style={{ padding: "6px 12px" }}>Sign out</button>
            </form>
          </div>
        </div>
      </nav>
      {children}
    </div>
  );
}
