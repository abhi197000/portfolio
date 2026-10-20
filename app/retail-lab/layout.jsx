import "./lab.css";
import { labFonts } from "./_kit/fonts";

export const metadata = {
  title: "Agentic Retail Lab · Abhimanyu Sheoran",
  description: "Nine allocation and replenishment decisions from the LinkedIn series, running live on a fictional US retailer's data.",
};

export default function RetailLabLayout({ children }) {
  return <div className={labFonts}>{children}</div>;
}
