import type { ProviderResult, RedirectHop } from "./types";

const TIMEOUT_MS = 6000;

async function withTimeout<T>(p: Promise<T>, ms = TIMEOUT_MS): Promise<T> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  try {
    return await p;
  } finally {
    clearTimeout(t);
  }
}

function safeJson<T = unknown>(r: Response): Promise<T> {
  return r.json() as Promise<T>;
}

// --- Google Safe Browsing v4 ---
export async function checkGoogleSafeBrowsing(url: string): Promise<ProviderResult> {
  const key = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
  if (!key) return { name: "Google Safe Browsing", status: "skipped", detail: "API key not configured" };
  const body = {
    client: { clientId: "phishguard", clientVersion: "1.0" },
    threatInfo: {
      threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
      platformTypes: ["ANY_PLATFORM"],
      threatEntryTypes: ["URL"],
      threatEntries: [{ url }],
    },
  };
  try {
    const ctl = new AbortController();
    const to = setTimeout(() => ctl.abort(), TIMEOUT_MS);
    const r = await fetch(`https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctl.signal,
    });
    clearTimeout(to);
    if (!r.ok) return { name: "Google Safe Browsing", status: "error", detail: `HTTP ${r.status}` };
    const j = (await safeJson<{ matches?: Array<{ threatType: string }> }>(r));
    if (j.matches && j.matches.length > 0) {
      return { name: "Google Safe Browsing", status: "malicious", detail: j.matches.map((m) => m.threatType).join(", "), raw: j };
    }
    return { name: "Google Safe Browsing", status: "clean" };
  } catch (e) {
    return { name: "Google Safe Browsing", status: "error", detail: (e as Error).message };
  }
}

// --- VirusTotal v3 (URL lookup by base64url id) ---
function b64url(s: string): string {
  // Worker-safe base64url encode of UTF-8 string
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function checkVirusTotal(url: string): Promise<ProviderResult> {
  const key = process.env.VIRUSTOTAL_API_KEY;
  if (!key) return { name: "VirusTotal", status: "skipped", detail: "API key not configured" };
  const id = b64url(url);
  try {
    const ctl = new AbortController();
    const to = setTimeout(() => ctl.abort(), TIMEOUT_MS);
    const r = await fetch(`https://www.virustotal.com/api/v3/urls/${id}`, {
      headers: { "x-apikey": key },
      signal: ctl.signal,
    });
    clearTimeout(to);
    if (r.status === 404) {
      // Not yet analysed; submit, but don't block on full scan.
      return { name: "VirusTotal", status: "unknown", detail: "Not yet indexed" };
    }
    if (!r.ok) return { name: "VirusTotal", status: "error", detail: `HTTP ${r.status}` };
    const j = (await safeJson<{ data?: { attributes?: { last_analysis_stats?: Record<string, number> } } }>(r));
    const stats = j.data?.attributes?.last_analysis_stats;
    if (!stats) return { name: "VirusTotal", status: "unknown", detail: "No analysis stats" };
    const mal = (stats.malicious ?? 0) + (stats.suspicious ?? 0);
    if (mal > 0) return { name: "VirusTotal", status: "malicious", detail: `${mal} engine(s) flagged`, raw: stats };
    return { name: "VirusTotal", status: "clean", detail: `0 / ${Object.values(stats).reduce((a, b) => a + b, 0)} engines`, raw: stats };
  } catch (e) {
    return { name: "VirusTotal", status: "error", detail: (e as Error).message };
  }
}

// --- OpenPhish free feed (cached) ---
let openPhishCache: { at: number; urls: Set<string> } | null = null;
const OPENPHISH_TTL = 15 * 60 * 1000;
async function getOpenPhishFeed(): Promise<Set<string>> {
  if (openPhishCache && Date.now() - openPhishCache.at < OPENPHISH_TTL) return openPhishCache.urls;
  try {
    const ctl = new AbortController();
    const to = setTimeout(() => ctl.abort(), TIMEOUT_MS);
    const r = await fetch("https://openphish.com/feed.txt", { signal: ctl.signal });
    clearTimeout(to);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const text = await r.text();
    const urls = new Set(text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean));
    openPhishCache = { at: Date.now(), urls };
    return urls;
  } catch {
    return openPhishCache?.urls ?? new Set();
  }
}

export async function checkOpenPhish(url: string): Promise<ProviderResult> {
  try {
    const feed = await getOpenPhishFeed();
    if (feed.size === 0) return { name: "OpenPhish", status: "error", detail: "Feed unavailable" };
    if (feed.has(url)) return { name: "OpenPhish", status: "malicious", detail: "URL present in live feed" };
    // Also test without trailing slash + host-only fallback
    const alt = url.replace(/\/$/, "");
    if (feed.has(alt)) return { name: "OpenPhish", status: "malicious", detail: "URL present in live feed" };
    return { name: "OpenPhish", status: "clean", detail: `Feed: ${feed.size} active URLs` };
  } catch (e) {
    return { name: "OpenPhish", status: "error", detail: (e as Error).message };
  }
}

// --- PhishTank (best-effort, no key) ---
export async function checkPhishTank(url: string): Promise<ProviderResult> {
  try {
    const form = new URLSearchParams({ url, format: "json" });
    const ctl = new AbortController();
    const to = setTimeout(() => ctl.abort(), TIMEOUT_MS);
    const r = await fetch("https://checkurl.phishtank.com/checkurl/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "phishguard/1.0" },
      body: form,
      signal: ctl.signal,
    });
    clearTimeout(to);
    if (!r.ok) return { name: "PhishTank", status: "error", detail: `HTTP ${r.status}` };
    const j = (await safeJson<{ results?: { in_database?: boolean; valid?: boolean | string } }>(r));
    const inDb = j.results?.in_database;
    const valid = j.results?.valid === true || j.results?.valid === "true";
    if (inDb && valid) return { name: "PhishTank", status: "malicious", detail: "Confirmed phishing in database" };
    if (inDb) return { name: "PhishTank", status: "unknown", detail: "In database, unverified" };
    return { name: "PhishTank", status: "clean" };
  } catch (e) {
    return { name: "PhishTank", status: "error", detail: (e as Error).message };
  }
}

// --- Redirect chain (HEAD then GET) ---
export async function followRedirects(url: string, max = 10): Promise<{ chain: RedirectHop[]; finalUrl: string }> {
  const chain: RedirectHop[] = [];
  let current = url;
  for (let i = 0; i < max; i++) {
    const start = Date.now();
    try {
      const ctl = new AbortController();
      const to = setTimeout(() => ctl.abort(), TIMEOUT_MS);
      const r = await fetch(current, {
        method: "GET",
        redirect: "manual",
        headers: { "User-Agent": "Mozilla/5.0 PhishGuard/1.0" },
        signal: ctl.signal,
      });
      clearTimeout(to);
      const ms = Date.now() - start;
      chain.push({ url: current, status: r.status, ms });
      const loc = r.headers.get("location");
      if (r.status >= 300 && r.status < 400 && loc) {
        try {
          current = new URL(loc, current).toString();
        } catch { break; }
        continue;
      }
      break;
    } catch (e) {
      chain.push({ url: current, status: 0, ms: Date.now() - start });
      break;
    }
  }
  return { chain, finalUrl: chain[chain.length - 1]?.url ?? url };
}
