import { JetBrains_Mono, Orbitron, Space_Grotesk } from "next/font/google";

const display = Orbitron({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const body = Space_Grotesk({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const fontVars = `${display.variable} ${body.variable} ${mono.variable}`;
