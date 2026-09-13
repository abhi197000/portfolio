import "../_module/theme.css";
import "../_module/theme-content.css";
import { fontVars } from "../_module/fonts";
import { MODULE_NAME } from "../_module/brand";
import Scene from "../_module/Scene";

export const metadata = { title: `${MODULE_NAME} — Enter the module` };

export default function PortalLayout({ children }) {
  return (
    <div className={`cc-page ${fontVars}`}>
      <Scene />
      {children}
    </div>
  );
}
