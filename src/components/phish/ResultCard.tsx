import { useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle, CheckCircle2, ChevronDown, Download, FileJson,
  FileText, Flag, Globe, Link as LinkIcon, ShieldCheck, ShieldAlert,
} from "lucide-react";
import type { UrlScanResult } from "@/lib/phish/types";
import { RiskGauge } from "./RiskGauge";
import { downloadJson, downloadPdf } from "@/lib/phish/export";
import { reportUrl } from "@/lib/phish/client";

const TIER_BG: Record<UrlScanResult["tier"], string> = {
  safe: "bg-[color:var(--color-safe)]/15 text-[color:var(--color-safe)] border-[color:var(--color-safe)]/30",
  low: "bg-[color:var(--color-low)]/15 text-[color:var(--color-low)] border-[color:var(--color-low)]/30",
  suspicious: "bg-[color:var(--color-suspicious)]/15 text-[color:var(--color-suspicious)] border-[color:var(--color-suspicious)]/30",
  high: "bg-[color:var(--color-high)]/15 text-[color:var(--color-high)] border-[color:var(--color-high)]/30",
  critical: "bg-[color:var(--color-critical)]/15 text-[color:var(--color-critical)] border-[color:var(--color-critical)]/30",
};

export function ResultCard({ result }: { result: UrlScanResult }) {
  const [expanded, setExpanded] = useState(true);
  const [reporting, setReporting] = useState(false);

  const onReport = async () => {
    setReporting(true);
    try {
      const r = await reportUrl(result.input);
      toast.success("Reported", { description: r.message });
    } catch (e) {
      toast.error("Report failed", { description: (e as Error).message });
    } finally {
      setReporting(false);
    }
  };

  const Icon = result.tier === "safe" ? ShieldCheck : result.tier === "low" ? CheckCircle2 : ShieldAlert;

  return (
    <article className="glass rounded-2xl p-5 sm:p-7">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl border ${TIER_BG[result.tier]}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`mono text-[10px] uppercase tracking-widest rounded-full border px-2 py-0.5 ${TIER_BG[result.tier]}`}>
                {result.verdict}
              </span>
              <span className="text-xs text-muted-foreground">
                {new Date(result.scannedAt).toLocaleString()}
              </span>
              <span className="text-xs text-muted-foreground">· {result.source}</span>
            </div>
            <div className="mt-1 truncate mono text-sm text-foreground" title={result.input}>{result.input}</div>
            {result.finalUrl !== result.input && (
              <div className="mt-0.5 truncate mono text-xs text-muted-foreground" title={result.finalUrl}>
                → {result.finalUrl}
              </div>
            )}
          </div>
        </div>
        <RiskGauge score={result.score} tier={result.tier} verdict={result.verdict} />
      </header>

      {/* Recommendations */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {result.recommendations.map((rec, i) => (
          <div key={i} className="rounded-xl border border-border/60 bg-secondary/40 p-3 text-sm">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-primary mt-0.5" />
              <span>{rec}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button onClick={() => downloadPdf(result)} className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-secondary/60 px-3 py-2 text-xs font-medium hover:bg-secondary">
          <FileText className="h-3.5 w-3.5" /> PDF
        </button>
        <button onClick={() => downloadJson(result)} className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-secondary/60 px-3 py-2 text-xs font-medium hover:bg-secondary">
          <FileJson className="h-3.5 w-3.5" /> JSON
        </button>
        <button onClick={onReport} disabled={reporting} className="inline-flex items-center gap-1.5 rounded-md border border-[color:var(--color-critical)]/40 bg-[color:var(--color-critical)]/10 px-3 py-2 text-xs font-medium text-[color:var(--color-critical)] hover:bg-[color:var(--color-critical)]/20 disabled:opacity-50">
          <Flag className="h-3.5 w-3.5" /> {reporting ? "Reporting..." : "Report to community"}
        </button>
        <button onClick={() => setExpanded((v) => !v)} className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-border/60 px-3 py-2 text-xs font-medium hover:bg-secondary">
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
          {expanded ? "Hide details" : "Show details"}
        </button>
      </div>

      {expanded && (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Domain */}
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Domain breakdown</h3>
            <dl className="mono space-y-1 rounded-xl border border-border/60 bg-secondary/30 p-3 text-xs">
              <Row k="Subdomain" v={result.domain.subdomain ?? "—"} />
              <Row k="Registrable" v={result.domain.registrable ?? "—"} />
              <Row k="Public suffix" v={result.domain.publicSuffix ?? "—"} />
              <Row k="IP host" v={result.domain.isIp ? "yes" : "no"} />
              <Row k="Punycode" v={result.domain.isPunycode ? "yes" : "no"} />
            </dl>
          </section>

          {/* Providers */}
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Threat-intel providers</h3>
            <ul className="space-y-1.5">
              {result.providers.map((p) => (
                <li key={p.name} className="flex items-start justify-between gap-3 rounded-xl border border-border/60 bg-secondary/30 px-3 py-2 text-xs">
                  <span className="font-medium">{p.name}</span>
                  <span className="text-right">
                    <StatusPill status={p.status} />
                    {p.detail && <div className="mt-0.5 text-muted-foreground">{p.detail}</div>}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* Signals */}
          <section className="lg:col-span-2">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Weighted signals ({result.signals.length})
            </h3>
            <ul className="divide-y divide-border/40 rounded-xl border border-border/60 bg-secondary/30">
              {result.signals.map((s) => (
                <li key={s.id} className="flex items-center gap-3 px-3 py-2 text-xs">
                  <span className={`mono w-12 shrink-0 text-right font-semibold ${s.weight >= 0 ? "text-[color:var(--color-high)]" : "text-[color:var(--color-safe)]"}`}>
                    {s.weight >= 0 ? "+" : ""}{s.weight}
                  </span>
                  <span className="min-w-0 flex-1">
                    <div className="truncate">{s.label}</div>
                    {s.detail && <div className="mono truncate text-[10px] text-muted-foreground">{s.detail}</div>}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* Redirects */}
          {result.redirects.length > 0 && (
            <section className="lg:col-span-2">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Redirect chain ({result.redirects.length})
              </h3>
              <ol className="space-y-1.5">
                {result.redirects.map((h, i) => (
                  <li key={i} className="flex items-start gap-3 rounded-xl border border-border/60 bg-secondary/30 px-3 py-2 text-xs">
                    <span className="mono w-7 shrink-0 rounded bg-secondary px-1 text-center">{h.status || "✕"}</span>
                    <LinkIcon className="h-3.5 w-3.5 shrink-0 mt-0.5 text-muted-foreground" />
                    <span className="mono min-w-0 flex-1 truncate" title={h.url}>{h.url}</span>
                    <span className="mono shrink-0 text-muted-foreground">{h.ms}ms</span>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>
      )}
    </article>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="truncate text-right">{v}</dd>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    malicious: "bg-[color:var(--color-critical)]/20 text-[color:var(--color-critical)]",
    clean: "bg-[color:var(--color-safe)]/20 text-[color:var(--color-safe)]",
    unknown: "bg-secondary text-muted-foreground",
    error: "bg-[color:var(--color-suspicious)]/20 text-[color:var(--color-suspicious)]",
    skipped: "bg-secondary text-muted-foreground",
  };
  return <span className={`mono rounded px-1.5 py-0.5 text-[10px] uppercase ${map[status] ?? "bg-secondary"}`}>{status}</span>;
}

export function MiniResultRow({ r, onOpen }: { r: UrlScanResult; onOpen?: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border/60 bg-secondary/30 p-3 text-left transition-colors hover:bg-secondary/60"
    >
      <span className={`mono shrink-0 rounded px-2 py-1 text-[10px] uppercase ${TIER_BG[r.tier]}`}>{r.verdict}</span>
      <span className="min-w-0">
        <div className="mono truncate text-xs">{r.input}</div>
        <div className="truncate text-[10px] text-muted-foreground">{r.domain.registrable ?? "—"}</div>
      </span>
      <span className="mono shrink-0 text-sm font-bold">{r.score}</span>
    </button>
  );
}