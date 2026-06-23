import { analyzeHeuristics, buildRecommendations, clamp, normalizeUrl, tierFor } from "./heuristics";
import {
  checkGoogleSafeBrowsing,
  checkOpenPhish,
  checkPhishTank,
  checkVirusTotal,
  followRedirects,
} from "./providers.server";
import type { ProviderResult, Signal, UrlScanResult } from "./types";

function providerSignal(p: ProviderResult): Signal | null {
  if (p.status === "malicious") {
    return { id: `provider-${p.name}`, label: `${p.name}: malicious`, weight: 55, detail: p.detail };
  }
  if (p.status === "clean") {
    return { id: `provider-${p.name}`, label: `${p.name}: clean`, weight: -6, detail: p.detail };
  }
  return null;
}

export async function scanUrl(input: string): Promise<UrlScanResult> {
  const scannedAt = new Date().toISOString();
  const normalized = normalizeUrl(input);
  const heur = analyzeHeuristics(normalized);
  if (!heur) {
    return {
      input, finalUrl: input, score: 100, tier: "critical", verdict: "Invalid URL",
      signals: [{ id: "invalid", label: "URL could not be parsed", weight: 100 }],
      providers: [], domain: { subdomain: null, registrable: null, publicSuffix: null, isIp: false, isPunycode: false },
      redirects: [], recommendations: ["Do not click this link."], scannedAt, source: "local-fallback",
    };
  }

  // Redirects + provider checks in parallel against the original URL.
  const [redirectInfo, gsb, vt, op, pt] = await Promise.all([
    followRedirects(heur.url.toString()).catch(() => ({ chain: [], finalUrl: heur.url.toString() })),
    checkGoogleSafeBrowsing(heur.url.toString()),
    checkVirusTotal(heur.url.toString()),
    checkOpenPhish(heur.url.toString()),
    checkPhishTank(heur.url.toString()),
  ]);

  const providers: ProviderResult[] = [gsb, vt, op, pt];
  const allSignals: Signal[] = [...heur.signals];
  for (const p of providers) {
    const s = providerSignal(p);
    if (s) allSignals.push(s);
  }

  // Recompute score from full signal list. Trusted domains still need to clear a clean bar.
  let score = clamp(allSignals.reduce((s, x) => s + x.weight, heur.trusted ? 0 : 15), 0, 100);

  // Hard rules
  const anyMalicious = providers.some((p) => p.status === "malicious");
  if (anyMalicious) score = Math.max(score, 92);

  // Safe requires: trusted reg domain + HTTPS + no positive-weight signals
  const hasRiskSignal = allSignals.some((s) => s.weight > 0);
  if (heur.trusted && heur.url.protocol === "https:" && !hasRiskSignal && !anyMalicious) {
    score = Math.min(score, 10);
  } else if (!heur.trusted) {
    // Never auto-mark an unknown .com as Safe — floor at "Low Risk".
    score = Math.max(score, 26);
  }

  const { tier, verdict } = tierFor(score);
  return {
    input,
    finalUrl: redirectInfo.finalUrl,
    score,
    tier,
    verdict,
    signals: allSignals,
    providers,
    domain: heur.domain,
    redirects: redirectInfo.chain,
    recommendations: buildRecommendations(tier, allSignals),
    scannedAt,
    source: providers.some((p) => p.status !== "skipped" && p.status !== "error") ? "live" : "local-fallback",
  };
}
