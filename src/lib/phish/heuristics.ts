import { parse as parseDomain } from "tldts";
import {
  TRUSTED_DOMAINS,
  BRAND_KEYWORDS,
  ABUSED_TLDS,
  SUSPICIOUS_KEYWORDS,
} from "./trusted";
import type { DomainBreakdown, RiskTier, Signal } from "./types";

export function normalizeUrl(input: string): string {
  const t = input.trim();
  if (!/^https?:\/\//i.test(t)) return `http://${t}`;
  return t;
}

export function safeParseUrl(input: string): URL | null {
  try {
    return new URL(normalizeUrl(input));
  } catch {
    return null;
  }
}

export function breakdownDomain(url: URL): DomainBreakdown {
  const host = url.hostname;
  const parsed = parseDomain(host, { allowPrivateDomains: true });
  const isIp = /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.includes(":") && /^[0-9a-f:]+$/i.test(host);
  const isPunycode = host.split(".").some((p) => p.startsWith("xn--"));
  return {
    subdomain: parsed?.subdomain || null,
    registrable: parsed?.domain || (isIp ? host : null),
    publicSuffix: parsed?.publicSuffix || null,
    isIp,
    isPunycode,
  };
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  const dp = new Array(n + 1);
  for (let j = 0; j <= n; j++) dp[j] = j;
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j];
      dp[j] = a[i - 1] === b[j - 1] ? prev : 1 + Math.min(prev, dp[j], dp[j - 1]);
      prev = tmp;
    }
  }
  return dp[n];
}

const HOMOGLYPH_MAP: Record<string, string> = {
  "0": "o", "1": "l", "3": "e", "4": "a", "5": "s", "7": "t",
  "$": "s", "@": "a",
};
function normalizeHomoglyphs(s: string): string {
  return s.split("").map((c) => HOMOGLYPH_MAP[c] ?? c).join("");
}

/** Split-label brand detection: ama.zon.com, pay.pa1.io, micro.soft.co. */
function detectSplitBrand(hostname: string): string | null {
  const labels = hostname.toLowerCase().split(".");
  const norm = labels.map(normalizeHomoglyphs);
  for (const brand of BRAND_KEYWORDS) {
    // sliding window across consecutive labels (2..4)
    for (let w = 2; w <= 4; w++) {
      for (let i = 0; i + w <= norm.length; i++) {
        const joined = norm.slice(i, i + w).join("");
        if (joined === brand) return brand;
      }
    }
  }
  return null;
}

export interface HeuristicAnalysis {
  url: URL;
  domain: DomainBreakdown;
  signals: Signal[];
  baseScore: number;
  trusted: boolean;
}

export function analyzeHeuristics(rawUrl: string): HeuristicAnalysis | null {
  const url = safeParseUrl(rawUrl);
  if (!url) return null;
  const domain = breakdownDomain(url);
  const signals: Signal[] = [];

  const host = url.hostname.toLowerCase();
  const reg = domain.registrable?.toLowerCase() ?? "";
  const trusted = !!reg && TRUSTED_DOMAINS.has(reg);

  // --- Trust signals (negative weight) ---
  if (trusted) {
    signals.push({ id: "trusted-domain", label: "Registrable domain on trusted list", weight: -60, detail: reg });
  }
  if (url.protocol === "https:") {
    signals.push({ id: "https", label: "Uses HTTPS", weight: -5 });
  } else {
    signals.push({ id: "no-https", label: "Insecure HTTP (no TLS)", weight: +18 });
  }

  // --- Risk signals ---
  if (domain.isIp) {
    signals.push({ id: "ip-url", label: "URL uses raw IP address", weight: +35 });
  }
  if (domain.isPunycode) {
    signals.push({ id: "punycode", label: "Punycode / IDN host (possible homograph)", weight: +25, detail: host });
  }
  if (host.length > 50) {
    signals.push({ id: "long-host", label: "Unusually long hostname", weight: +10 });
  }
  const labelCount = host.split(".").length;
  if (labelCount >= 5) {
    signals.push({ id: "many-subdomains", label: `${labelCount} subdomain labels`, weight: +12 });
  }
  if (host.includes("--") || /(-){2,}/.test(host)) {
    signals.push({ id: "double-hyphen", label: "Hostname contains '--' (often abused)", weight: +8 });
  }
  if (domain.publicSuffix && ABUSED_TLDS.has(domain.publicSuffix.split(".").pop() ?? "")) {
    signals.push({ id: "abused-tld", label: `Frequently abused TLD .${domain.publicSuffix}`, weight: +18 });
  }
  if (url.port && url.port !== "80" && url.port !== "443") {
    signals.push({ id: "uncommon-port", label: `Uncommon port :${url.port}`, weight: +10 });
  }
  if (/@/.test(url.href.replace(url.search, ""))) {
    signals.push({ id: "userinfo", label: "URL contains '@' userinfo (deceptive)", weight: +25 });
  }
  const path = (url.pathname + url.search).toLowerCase();
  const matchedKw = SUSPICIOUS_KEYWORDS.filter((k) => path.includes(k) || host.includes(k));
  if (matchedKw.length >= 2) {
    signals.push({ id: "phish-keywords", label: `Phishing keywords: ${matchedKw.slice(0, 4).join(", ")}`, weight: 6 + matchedKw.length * 3 });
  } else if (matchedKw.length === 1) {
    signals.push({ id: "phish-keyword", label: `Phishing keyword: ${matchedKw[0]}`, weight: 6 });
  }

  // --- Brand impersonation ---
  if (!trusted && reg) {
    const regCore = reg.split(".")[0];
    for (const brand of BRAND_KEYWORDS) {
      if (regCore === brand) continue; // unlikely (would be trusted), but skip
      // contains-brand
      if (regCore.includes(brand) && regCore !== brand) {
        signals.push({ id: `brand-contains-${brand}`, label: `Registrable domain contains brand "${brand}"`, weight: 28, detail: reg });
        break;
      }
      // typosquat
      const dist = levenshtein(normalizeHomoglyphs(regCore), brand);
      if (dist > 0 && dist <= 2 && Math.abs(regCore.length - brand.length) <= 2) {
        signals.push({ id: `typo-${brand}`, label: `Typosquat of "${brand}" (edit distance ${dist})`, weight: 35, detail: reg });
        break;
      }
    }
  }
  // Split-label brand across subdomains: ama.zon.com
  const split = detectSplitBrand(host);
  if (split && reg !== `${split}.com` && reg !== split) {
    signals.push({ id: "brand-split", label: `Brand "${split}" split across labels`, weight: 40, detail: host });
  }

  // Subdomain pretending to be a brand: paypal.account-update.tk
  if (domain.subdomain && !trusted) {
    const subLabels = domain.subdomain.toLowerCase().split(".");
    for (const lab of subLabels) {
      if (BRAND_KEYWORDS.includes(lab)) {
        signals.push({ id: `brand-in-sub-${lab}`, label: `Brand "${lab}" used as subdomain`, weight: 30, detail: host });
        break;
      }
    }
  }

  // Score sum, clamp 0..100. Trusted domains start at 0 and the trust weight keeps them low.
  const baseScore = clamp(signals.reduce((s, x) => s + x.weight, trusted ? 0 : 15), 0, 100);

  return { url, domain, signals, baseScore, trusted };
}

export function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

export function tierFor(score: number): { tier: RiskTier; verdict: string } {
  if (score <= 25) return { tier: "safe", verdict: "Safe" };
  if (score <= 50) return { tier: "low", verdict: "Low Risk" };
  if (score <= 75) return { tier: "suspicious", verdict: "Suspicious" };
  if (score <= 90) return { tier: "high", verdict: "High Risk" };
  return { tier: "critical", verdict: "Critical" };
}

export function buildRecommendations(tier: RiskTier, signals: Signal[]): string[] {
  const recs: string[] = [];
  if (tier === "safe") {
    recs.push("Still verify the URL in your address bar before entering credentials.");
    recs.push("Enable 2FA on the account for an extra layer of protection.");
  } else if (tier === "low") {
    recs.push("Prefer the HTTPS version and check the certificate.");
    recs.push("If unsure, navigate to the site by typing the official domain directly.");
    recs.push("Enable 2FA on any account this link is for.");
  } else if (tier === "suspicious") {
    recs.push("Do NOT enter credentials, OTPs, or payment info on this page.");
    recs.push("Contact the real company via their official website or app.");
    recs.push("Report this URL using the 'Report' button below.");
  } else {
    recs.push("Close the page immediately. Do not click further links or download files.");
    recs.push("If you submitted info, change passwords and revoke sessions from the real site now.");
    recs.push("Report this URL to your IT/security team and via the button below.");
  }
  if (signals.some((s) => s.id === "no-https")) {
    recs.push("Never submit personal data over an insecure HTTP connection.");
  }
  return recs.slice(0, 4);
}
