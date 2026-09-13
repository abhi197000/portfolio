import "../_module/theme.css";
import "../_module/theme-content.css";
import { fontVars } from "../_module/fonts";
import { MODULE_NAME } from "../_module/brand";
import Scene from "../_module/Scene";
import Shell from "../_module/Shell";
import { createClient } from "../../lib/supabase/server";

export const metadata = { title: `${MODULE_NAME} — Command Center` };

export default async function ModuleLayout({ children }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className={`cc-page ${fontVars}`}>
      <Scene />
      <Shell email={user?.email}>{children}</Shell>
    </div>
  );
}
