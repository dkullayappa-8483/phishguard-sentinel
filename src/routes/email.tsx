import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Mail, Zap } from "lucide-react";
import { toast } from "sonner";
import { scanEmailRaw } from "@/lib/phish/client";
import type { EmailScanResult } from "@/lib/phish/types";
import { ResultCard } from "@/components/phish/ResultCard";

export const Route = createFileRoute("/email")({
  head: () => ({
    meta: [
      { title: "Email Analyzer — PhishGuard" },
      { name: "description", content: "Paste a full email (headers + body) — PhishGuard checks SPF/DKIM/DMARC and scans every link inside." },
      { property: "og:title", content: "Email Analyzer — PhishGuard" },
      { property: "og:description", content: "Paste a full email — PhishGuard checks SPF/DKIM/DMARC and scans every link inside." },
    ],
  }),
  component: EmailPage,
});

const SAMPLE = `From: PayPal Security <security@paypa1-verify.com>
Reply-To: noreply@account-help.support
Return-Path: <bounce@mailer-93.click>
Subject: URGENT: Your account has been limited
Authentication-Results: mx.google.com; spf=fail (sender IP) smtp.mailfrom=mailer-93.click; dkim=fail; dmarc=fail
Date: Tue, 23 Jun 2026 09:00:00 +0000

Dear customer,

We detected unusual activity. Please verify your account within 24 hours
to avoid suspension: http://paypa1.com/secure/account/login

Or visit https://www.ama.zon.com/account/update to confirm.

Thank you,
PayPal Security`;

function EmailPage() {
  const [raw, setRaw] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EmailScanResult | null>(null);

  const onScan = async () => {
    if (!raw.trim()) { toast.error("Paste an email first"); return; }
    setLoading(true); setResult(null);
    try {
      const r = await scanEmailRaw(raw);
      setResult(r);
    } catch (e) {
      toast.error("Scan failed", { description: (e as Error).message });
    } finally { setLoading(false); }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-6 flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/15 text-primary">
          <Mail className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Email Analyzer</h1>
          <p className="text-sm text-muted-foreground">Paste full headers + body. Every URL is scanned automatically.</p>
        </div>
      </header>

      <section className="glass rounded-2xl p-5 sm:p-7">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold">Raw email</label>
          <button onClick={() => setRaw(SAMPLE)} className="text-xs text-primary hover:underline">Load sample</button>
        </div>
        <textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          rows={12}
          placeholder="Paste raw email source here (with headers)…"
          spellCheck={false}
          className="mono mt-2 w-full resize-y rounded-xl border border-border/60 bg-background/60 p-3 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
        <div className="mt-3 flex justify-end">
          <button
            onClick={onScan} disabled={loading}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground cyber-glow hover:brightness-110 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            {loading ? "Analyzing…" : "Analyze email"}
          </button>
        </div>
      </section>

      {result && (
        <div className="mt-8 space-y-6">
          <section className="glass rounded-2xl p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">Header analysis</h2>
            <dl className="grid gap-3 sm:grid-cols-2 mono text-xs">
              <Row k="From domain" v={result.headers.fromDomain ?? "—"} />
              <Row k="Reply-To" v={result.headers.replyTo ?? "—"} />
              <Row k="Return-Path" v={result.headers.returnPath ?? "—"} />
              <Row k="Subject" v={result.headers.subject ?? "—"} />
              <Row k="SPF" v={result.headers.spf} tone={result.headers.spf} />
              <Row k="DKIM" v={result.headers.dkim} tone={result.headers.dkim} />
              <Row k="DMARC" v={result.headers.dmarc} tone={result.headers.dmarc} />
              <Row k="Reply-To mismatch" v={result.headers.replyToMismatch ? "YES" : "no"} tone={result.headers.replyToMismatch ? "fail" : "pass"} />
            </dl>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {result.recommendations.map((r, i) => (
                <div key={i} className="rounded-xl border border-border/60 bg-secondary/40 p-3 text-sm">{r}</div>
              ))}
            </div>
          </section>

          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Links in email ({result.urls.length})
          </h2>
          {result.urls.length === 0 && (
            <div className="rounded-xl border border-border/60 bg-secondary/30 p-6 text-sm text-muted-foreground">No URLs found.</div>
          )}
          {result.urls.map((u, i) => <ResultCard key={i} result={u} />)}
        </div>
      )}
    </div>
  );
}

function Row({ k, v, tone }: { k: string; v: string; tone?: string }) {
  const color =
    tone === "pass" ? "text-[color:var(--color-safe)]" :
    tone === "fail" ? "text-[color:var(--color-critical)]" :
    tone === "neutral" ? "text-[color:var(--color-suspicious)]" :
    "text-foreground";
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-secondary/30 px-3 py-2">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className={`truncate text-right uppercase ${color}`}>{v}</dd>
    </div>
  );
}