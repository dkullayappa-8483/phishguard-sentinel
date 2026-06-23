# 🛡 PhishGuard

**Production-grade phishing detection** — URL & email scanner combining live threat-intelligence feeds with a precision heuristics engine. Built on TanStack Start (React 19 + Vite) for Cloudflare Workers via Lovable Cloud.

## Features

- **URL Scanner** — single or batch (up to 25), follows redirects (max 10 hops), full chain shown.
- **Email Analyzer** — paste raw email; parses headers (SPF/DKIM/DMARC, Reply-To mismatch) and scans every URL.
- **Multi-layer detection** — Google Safe Browsing v4, VirusTotal v3, OpenPhish live feed (15-min cache), PhishTank, plus local heuristics: PSL-aware parsing (`tldts`), 200+ trusted-domain allowlist, brand impersonation with split-label detection (`ama.zon.com`), homoglyph-normalised typosquats (Levenshtein), punycode/IDN, IP-URL, abused TLDs, suspicious keywords.
- **0–100 weighted score** → tiers Safe / Low / Suspicious / High / Critical with +/- signal breakdown.
- **Threat-intel Dashboard** — live provider status + APWG 2024 stats.
- **Scan History** — last 20 in `localStorage`, searchable, exportable.
- **Export** — PDF or JSON per scan (`jspdf`).
- **Report Suspicious Site** — POSTs to `/api/public/report`.
- **Action Cards** — 2–4 tier-aware recommendations per scan.
- **Bookmarklet** — drag-to-bookmarks "Scan with PhishGuard".
- **Responsive SOC UI** — glassmorphism, animated risk gauge, mobile hamburger nav.

## Architecture

```
Browser ──▶ TanStack Start (Vite/React)
              │
              ▼
        Server routes (Worker SSR)
        /api/check-url, /check-email,
        /threat-intel, /public/report
              │ Promise.all
   ┌──────────┼──────────┬──────────┐
   ▼          ▼          ▼          ▼
 GSB     VirusTotal  OpenPhish  PhishTank
              │
              ▼
   Heuristics engine (tldts + rules)
              │
              ▼
     score → tier → recommendations
```

### Scoring rules
- **Safe (≤25)** requires exact registrable-domain match in trusted list AND HTTPS AND zero positive-weight signals AND no provider hit.
- Unknown `.com` floors at **Low Risk (≥26)** — never auto-marked Safe.
- Any provider returning `malicious` → score floored at **92** (Critical).

### Test cases
| Input | Expected |
|---|---|
| `https://google.com` | Safe |
| `http://google.com` | Low Risk (no HTTPS) |
| `https://www.ama.zon.com` | Critical (split-label brand) |
| `http://paypa1.com` | Critical (typosquat + no HTTPS) |
| random `.com` | Low Risk |

## Local dev

```bash
bun install
bun run dev   # http://localhost:8080
```

### Env vars

| Name | Required | Scope |
|---|---|---|
| `GOOGLE_SAFE_BROWSING_API_KEY` | optional (skipped if missing) | server only |
| `VIRUSTOTAL_API_KEY` | optional | server only |

In Lovable Cloud projects, add via the secrets UI.

## Deployment

Press **Publish** in the Lovable editor — deploys to Cloudflare Workers.

To self-host on Vercel/Render/your own Worker, keep `src/routes/api/*` server routes and provide the two env vars. CORS is enabled on every API handler.

## Disclaimer

PhishGuard is an educational and defensive tool, not a substitute for professional threat-intel. Always verify by typing the official URL directly into your browser.

## Showcase

> PhishGuard — phishing scanner combining four live threat-intel feeds (Google Safe Browsing, VirusTotal, OpenPhish, PhishTank) with a precision heuristics engine: PSL-aware parsing, split-label brand detection, homoglyph typosquats, redirect-chain analysis, and a SOC-style dashboard. End-to-end on TanStack Start + Cloudflare Workers.
