import { jsPDF } from "jspdf";
import type { UrlScanResult } from "./types";

export function downloadJson(result: UrlScanResult | UrlScanResult[], filename = "phishguard-report.json") {
  const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
  triggerDownload(blob, filename);
}

export function downloadPdf(result: UrlScanResult, filename = "phishguard-report.pdf") {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 40;
  let y = margin;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("PhishGuard Scan Report", margin, y);
  y += 22;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Scanned: ${new Date(result.scannedAt).toLocaleString()}`, margin, y);
  y += 14;
  doc.text(`Source: ${result.source}`, margin, y);
  y += 22;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(`Verdict: ${result.verdict}  —  Score: ${result.score}/100`, margin, y);
  y += 20;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  y = writeWrapped(doc, `Input URL: ${result.input}`, margin, y, 515);
  y = writeWrapped(doc, `Final URL: ${result.finalUrl}`, margin, y, 515);
  y += 8;

  doc.setFont("helvetica", "bold");
  doc.text("Domain", margin, y); y += 14;
  doc.setFont("helvetica", "normal");
  doc.text(`Subdomain:     ${result.domain.subdomain ?? "—"}`, margin, y); y += 12;
  doc.text(`Registrable:   ${result.domain.registrable ?? "—"}`, margin, y); y += 12;
  doc.text(`Public suffix: ${result.domain.publicSuffix ?? "—"}`, margin, y); y += 18;

  doc.setFont("helvetica", "bold");
  doc.text("Providers", margin, y); y += 14;
  doc.setFont("helvetica", "normal");
  for (const p of result.providers) {
    y = writeWrapped(doc, `• ${p.name}: ${p.status}${p.detail ? ` — ${p.detail}` : ""}`, margin, y, 515);
  }
  y += 6;

  doc.setFont("helvetica", "bold");
  doc.text("Risk signals", margin, y); y += 14;
  doc.setFont("helvetica", "normal");
  for (const s of result.signals) {
    const sign = s.weight >= 0 ? "+" : "";
    y = writeWrapped(doc, `${sign}${s.weight}  ${s.label}${s.detail ? ` (${s.detail})` : ""}`, margin, y, 515);
    if (y > 780) { doc.addPage(); y = margin; }
  }
  y += 6;

  if (result.redirects.length) {
    doc.setFont("helvetica", "bold");
    doc.text("Redirect chain", margin, y); y += 14;
    doc.setFont("helvetica", "normal");
    for (const h of result.redirects) {
      y = writeWrapped(doc, `[${h.status}] ${h.url}  (${h.ms}ms)`, margin, y, 515);
      if (y > 780) { doc.addPage(); y = margin; }
    }
    y += 6;
  }

  doc.setFont("helvetica", "bold");
  doc.text("Recommendations", margin, y); y += 14;
  doc.setFont("helvetica", "normal");
  for (const r of result.recommendations) {
    y = writeWrapped(doc, `• ${r}`, margin, y, 515);
  }

  doc.save(filename);
}

function writeWrapped(doc: jsPDF, text: string, x: number, y: number, maxWidth: number): number {
  const lines = doc.splitTextToSize(text, maxWidth) as string[];
  for (const ln of lines) {
    if (y > 800) { doc.addPage(); y = 40; }
    doc.text(ln, x, y);
    y += 12;
  }
  return y;
}

function triggerDownload(blob: Blob, filename: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}