import type { UrlScanResult, EmailScanResult } from "./types";

export async function scanUrls(urls: string[]): Promise<UrlScanResult[]> {
  const r = await fetch("/api/check-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(urls.length === 1 ? { url: urls[0] } : { urls }),
  });
  if (!r.ok) throw new Error(`Scan failed (${r.status})`);
  const j = (await r.json()) as { results: UrlScanResult[] };
  return j.results;
}

export async function scanEmailRaw(raw: string): Promise<EmailScanResult> {
  const r = await fetch("/api/check-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ raw }),
  });
  if (!r.ok) throw new Error(`Email scan failed (${r.status})`);
  const j = (await r.json()) as { result: EmailScanResult };
  return j.result;
}

export async function reportUrl(url: string, note?: string): Promise<{ ok: boolean; message: string }> {
  const r = await fetch("/api/public/report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, note }),
  });
  const j = (await r.json()) as { ok?: boolean; message?: string; error?: string };
  if (!r.ok || !j.ok) throw new Error(j.error ?? "Report failed");
  return { ok: true, message: j.message ?? "Reported" };
}

export interface ThreatIntel {
  providers: {
    googleSafeBrowsing: { configured: boolean; status: string };
    virusTotal: { configured: boolean; status: string };
    openPhish: { configured: boolean; status: string; activeUrls: number };
    phishTank: { configured: boolean; status: string };
  };
  apwg2024: {
    totalPhishingSitesQ4: number;
    mostTargetedSector: string;
    mostTargetedSectorShare: number;
    bec2024AvgWireLossUsd: number;
    sourceUrl: string;
    asOf: string;
  };
  updatedAt: string;
}

export async function fetchThreatIntel(): Promise<ThreatIntel> {
  const r = await fetch("/api/threat-intel");
  if (!r.ok) throw new Error(`Intel failed (${r.status})`);
  return (await r.json()) as ThreatIntel;
}