import { scanUrl } from "./scan.server";
import { clamp, tierFor, buildRecommendations } from "./heuristics";
import type { EmailHeaderCheck, EmailScanResult, Signal } from "./types";

function parseHeaders(raw: string): { headers: Record<string, string[]>; body: string } {
  const headers: Record<string, string[]> = {};
  const blankIdx = raw.search(/\r?\n\r?\n/);
  const head = blankIdx === -1 ? raw : raw.slice(0, blankIdx);
  const body = blankIdx === -1 ? "" : raw.slice(blankIdx).trimStart();
  // unfold continuation lines (leading whitespace)
  const unfolded = head.replace(/\r?\n[ \t]+/g, " ");
  for (const line of unfolded.split(/\r?\n/)) {
    const i = line.indexOf(":");
    if (i === -1) continue;
    const k = line.slice(0, i).trim().toLowerCase();
    const v = line.slice(i + 1).trim();
    (headers[k] ||= []).push(v);
  }
  return { headers, body };
}

function extractAddress(v: string | undefined): string | null {
  if (!v) return null;
  const m = v.match(/<([^>]+)>/);
  return (m ? m[1] : v).trim().toLowerCase();
}
function domainOf(addr: string | null): string | null {
  if (!addr) return null;
  const i = addr.lastIndexOf("@");
  return i === -1 ? null : addr.slice(i + 1).toLowerCase();
}

function authResult(headerVals: string[] | undefined, key: string): EmailHeaderCheck["spf"] {
  if (!headerVals?.length) return "unknown";
  const joined = headerVals.join(" ").toLowerCase();
  const m = new RegExp(`${key}=(pass|fail|neutral|softfail|none|temperror|permerror)`).exec(joined);
  if (!m) return "unknown";
  const v = m[1];
  if (v === "pass") return "pass";
  if (v === "fail" || v === "softfail" || v === "permerror") return "fail";
  return "neutral";
}

function extractUrls(text: string): string[] {
  const re = /\bhttps?:\/\/[^\s<>"')]+/gi;
  const out = new Set<string>();
  for (const m of text.matchAll(re)) out.add(m[0].replace(/[).,]+$/, ""));
  return Array.from(out).slice(0, 20);
}

export async function scanEmail(raw: string): Promise<EmailScanResult> {
  const scannedAt = new Date().toISOString();
  const { headers, body } = parseHeaders(raw);
  const fromAddr = extractAddress(headers["from"]?.[0]);
  const replyToAddr = extractAddress(headers["reply-to"]?.[0]);
  const returnPath = extractAddress(headers["return-path"]?.[0]);
  const subject = headers["subject"]?.[0] ?? null;
  const fromDomain = domainOf(fromAddr);
  const replyDomain = domainOf(replyToAddr);
  const authRes = headers["authentication-results"];

  const headerCheck: EmailHeaderCheck = {
    spf: authResult(authRes, "spf"),
    dkim: authResult(authRes, "dkim"),
    dmarc: authResult(authRes, "dmarc"),
    fromDomain,
    replyTo: replyToAddr,
    returnPath,
    subject,
    replyToMismatch: !!fromDomain && !!replyDomain && fromDomain !== replyDomain,
  };

  const signals: Signal[] = [];
  if (headerCheck.spf === "fail") signals.push({ id: "spf-fail", label: "SPF failed", weight: 25 });
  else if (headerCheck.spf === "pass") signals.push({ id: "spf-pass", label: "SPF passed", weight: -6 });
  if (headerCheck.dkim === "fail") signals.push({ id: "dkim-fail", label: "DKIM failed", weight: 25 });
  else if (headerCheck.dkim === "pass") signals.push({ id: "dkim-pass", label: "DKIM passed", weight: -6 });
  if (headerCheck.dmarc === "fail") signals.push({ id: "dmarc-fail", label: "DMARC failed", weight: 25 });
  else if (headerCheck.dmarc === "pass") signals.push({ id: "dmarc-pass", label: "DMARC passed", weight: -6 });
  if (headerCheck.replyToMismatch) signals.push({ id: "reply-mismatch", label: `Reply-To domain (${replyDomain}) differs from From (${fromDomain})`, weight: 22 });
  if (returnPath && fromDomain && domainOf(returnPath) !== fromDomain) {
    signals.push({ id: "return-mismatch", label: "Return-Path domain differs from From", weight: 12 });
  }
  if (/urgent|verify|suspended|account.{0,15}lock|password|invoice|payment/i.test(subject ?? "")) {
    signals.push({ id: "urgency", label: "Subject uses urgency / financial pressure", weight: 8 });
  }

  const urls = extractUrls(body + "\n" + (subject ?? ""));
  const urlResults = await Promise.all(urls.map((u) => scanUrl(u).catch((e) => ({
    input: u, finalUrl: u, score: 0, tier: "low" as const, verdict: "Error",
    signals: [], providers: [], domain: { subdomain: null, registrable: null, publicSuffix: null, isIp: false, isPunycode: false },
    redirects: [], recommendations: [], scannedAt: new Date().toISOString(), source: "local-fallback" as const, error: (e as Error).message,
  }))));

  const worstUrlScore = urlResults.reduce((m, r) => Math.max(m, r.score), 0);
  const sigScore = signals.reduce((s, x) => s + x.weight, 0);
  const score = clamp(Math.max(worstUrlScore, sigScore + 20), 0, 100);
  const { tier } = tierFor(score);
  return {
    headers: headerCheck,
    urls: urlResults,
    score,
    tier,
    signals,
    recommendations: buildRecommendations(tier, signals),
    scannedAt,
  };
}
