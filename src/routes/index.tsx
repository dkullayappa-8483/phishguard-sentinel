import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Loader2, Search, Shield, Sparkles, Zap } from "lucide-react";
import { toast } from "sonner";
import { scanUrls } from "@/lib/phish/client";
import { saveScans } from "@/lib/phish/history";
import type { UrlScanResult } from "@/lib/phish/types";
import { ResultCard } from "@/components/phish/ResultCard";
import { BatchTable } from "@/components/phish/BatchTable";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PhishGuard — URL Phishing Scanner" },
      { name: "description", content: "Scan one or many URLs for phishing using live threat-intel feeds and advanced heuristics." },
      { property: "og:title", content: "PhishGuard — URL Phishing Scanner" },
      { property: "og:description", content: "Scan one or many URLs for phishing using live threat-intel feeds and advanced heuristics." },
    ],
  }),
  component: Index,
});

const SAMPLE = `https://google.com
http://google.com
https://www.ama.zon.com/account/verify
http://paypa1.com/login
https://github.com`;

function Index() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<UrlScanResult[]>([]);

  const onScan = async () => {
    const urls = input.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    if (!urls.length) {
      toast.error("Enter at least one URL");
      return;
    }
    if (urls.length > 25) {
      toast.error("Max 25 URLs per scan");
      return;
    }
    setLoading(true);
    setResults([]);
    try {
      const r = await scanUrls(urls);
      setResults(r);
      saveScans(r);
    } catch (e) {
      toast.error("Scan failed", { description: (e as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const multiple = results.length > 1;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Hero */}
      <section className="mb-8 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/60 bg-secondary/50 px-3 py-1 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Multi-layer detection · Live threat intel
        </div>
        <h1 className="text-balance text-3xl font-extrabold tracking-tight sm:text-5xl">
          Catch phishing before <span className="text-gradient-cyber">you click</span>.
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-balance text-sm text-muted-foreground sm:text-base">
          PhishGuard combines Google Safe Browsing, VirusTotal, OpenPhish, PhishTank, and a precision heuristics
          engine (PSL parsing, typosquats, split-label brands, homoglyphs) for SOC-grade accuracy.
        </p>
      </section>

      {/* Scanner */}
      <section className="glass rounded-2xl p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Search className="h-4 w-4 text-primary" /> URL Scanner
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              batch ready
            </span>
          </div>
          <button
            type="button"
            onClick={() => setInput(SAMPLE)}
            className="text-xs text-primary hover:underline"
          >
            Load sample URLs
          </button>
        </div>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste one URL per line (max 25)…&#10;https://example.com"
          rows={5}
          className="mono mt-3 w-full resize-y rounded-xl border border-border/60 bg-background/60 p-3 text-sm outline-none placeholder:text-muted-foreground/60 focus:border-primary focus:ring-1 focus:ring-primary"
          spellCheck={false}
        />

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[11px] text-muted-foreground">
            Disclaimer: PhishGuard fetches URLs server-side to follow redirects. Do not scan internal/private addresses.
          </p>
          <button
            onClick={onScan}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all cyber-glow hover:brightness-110 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            {loading ? "Scanning…" : "Scan now"}
            {!loading && <ArrowRight className="h-4 w-4" />}
          </button>
        </div>
      </section>

      {/* Results */}
      {loading && (
        <div className="mt-8 grid place-items-center rounded-2xl border border-border/60 bg-secondary/30 p-12 text-sm text-muted-foreground">
          <Loader2 className="mb-3 h-8 w-8 animate-spin text-primary" />
          Running providers, following redirects, scoring signals…
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="mt-8 space-y-6">
          {multiple && <BatchTable results={results} />}
          {results.map((r, i) => (
            <ResultCard key={i} result={r} />
          ))}
        </div>
      )}

      {!loading && results.length === 0 && (
        <section className="mt-10 grid gap-4 sm:grid-cols-3">
          <Feature icon={<Shield className="h-5 w-5" />} title="Accurate by design" body="Trusted-domain list, PSL-aware parsing, typosquat & split-label detection — minimises false positives." />
          <Feature icon={<Zap className="h-5 w-5" />} title="Live intel" body="Google Safe Browsing, VirusTotal, OpenPhish, PhishTank — checked in parallel for sub-second verdicts." />
          <Feature icon={<Sparkles className="h-5 w-5" />} title="Actionable" body="Every scan ships with recommendations, PDF/JSON export, and a one-click report button." />
        </section>
      )}
    </div>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="mb-2 inline-grid h-9 w-9 place-items-center rounded-lg bg-primary/15 text-primary">{icon}</div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{body}</p>
    </div>
  );
}
