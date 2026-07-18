# Abhi's Portfolio — Setup & Deployment Guide

A personal portfolio built with **Next.js** — dark theme, fully responsive, with sections for About, Achievements, Milestones (timeline), Projects, and Contact.

---

## 1. Edit your content (no coding needed)

All website text lives in **one file**: `data/profile.js`

Open it in any text editor and replace the placeholder text — your name, role, about paragraphs, skills, achievements, milestones, projects, and social links. Save the file and the site updates automatically.

---

## 2. Run it on your computer

**Prerequisite:** Install Node.js (v18 or newer) from https://nodejs.org — download the LTS version and run the installer.

Then open a terminal (PowerShell) in this folder and run:

```bash
npm install    # one-time: downloads dependencies (~1 min)
npm run dev    # starts the site
```

Open http://localhost:3000 in your browser. Edits to `data/profile.js` refresh live.

---

## 3. Put it online (free hosting on Vercel)

Vercel is made by the creators of Next.js — the free tier is more than enough.

**Step 1 — Push code to GitHub**
1. Create a free account at https://github.com if you don't have one.
2. Create a new repository (e.g. `portfolio`), keep it public or private.
3. In this folder, run:
   ```bash
   git init
   git add .
   git commit -m "My portfolio"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/portfolio.git
   git push -u origin main
   ```
   (Install Git from https://git-scm.com if needed.)

**Step 2 — Deploy on Vercel**
1. Go to https://vercel.com and sign up with your GitHub account.
2. Click **Add New → Project**, import your `portfolio` repository.
3. Vercel auto-detects Next.js — just click **Deploy**.
4. In ~1 minute your site is live at `portfolio-yourname.vercel.app`.

From now on, every `git push` automatically redeploys the site.

---

## 4. Connect your own domain

**Step 1 — Buy a domain** (₹700–1,500/year typically)
Good registrars: Namecheap, Cloudflare Registrar (cheapest, at-cost pricing), GoDaddy, Porkbun. Search for something like `abhisheoran.com` or `abhi.dev`.

**Step 2 — Connect it to Vercel**
1. In your Vercel project → **Settings → Domains** → enter your domain → **Add**.
2. Vercel shows you DNS records to set. In your registrar's DNS settings, add:
   - An **A record**: `@` → `76.76.21.21`
   - A **CNAME record**: `www` → `cname.vercel-dns.com`
   (Vercel displays the exact current values — use those.)
3. Wait a few minutes to a few hours for DNS to propagate. Vercel issues a free HTTPS certificate automatically.

Done — your site is live at your own domain with HTTPS.

---

## Project structure

```
portfolio/
├── data/profile.js      ← ALL your content (edit this)
├── app/
│   ├── page.jsx         ← page sections (Hero, About, Timeline...)
│   ├── layout.jsx       ← page metadata (browser tab title)
│   └── globals.css      ← colors & styling (dark theme)
├── package.json         ← dependencies
└── next.config.mjs      ← Next.js config
```

**Change colors:** edit the `:root` variables at the top of `app/globals.css` (e.g. `--accent` for the highlight color).

---

## Troubleshooting

- **`npm` not recognized** → Node.js isn't installed or terminal needs restarting after install.
- **Port 3000 in use** → run `npm run dev -- -p 3001`.
- **Build fails on Vercel** → check the build log; usually a typo in `data/profile.js` (missing comma or quote).
