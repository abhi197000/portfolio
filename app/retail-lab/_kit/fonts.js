import { Inter, Instrument_Serif, Barlow_Condensed } from "next/font/google";

// sans for reading, an italic serif for the accent phrases the videos use, and a
// condensed DIN-like face for the airport boards
const sans = Inter({ subsets: ["latin"], variable: "--lab-sans", display: "swap" });
const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--lab-serif", display: "swap" });
const condensed = Barlow_Condensed({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--lab-cond", display: "swap" });

export const labFonts = `${sans.variable} ${serif.variable} ${condensed.variable}`;
