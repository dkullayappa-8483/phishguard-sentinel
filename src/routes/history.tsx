import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Download, Search, Trash2 } from "lucide-react";
import { clearHistory, loadHistory } from "@/lib/phish/history";
import type { UrlScanResult } from "@/lib/phish/types";
import { downloadJson } from "@/lib/phish/export";
import { ResultCard } from "@/components/phish/ResultCard";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Scan History — PhishGuard" },
      { name: "description", content: "Your recent PhishGuard scans (last 20, stored locally in this browser)." },
      { property: "og:title", content: "Scan History — PhishGuard" },
      { property: "og:description", content: "Your recent PhishGuard scans, stored locally." },
    ],
  }),
  component: History,
});

function History() {
  const [items, setItems] = useState<UrlScanResult[]>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => { setItems(loadHistory()); }, []);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return items;
    return items.filter((r) =>
      r.input.toLowerCase().includes(t) ||
      (r.domain.registrable ?? "").toLowerCase().includes(t) ||
      r.verdict.toLowerCase().includes(t));
  }, [items, q]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Scan History</h1>
          <p className="text-sm text-muted-foreground">Last {items.length} scans · stored locally only.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => downloadJson(items, "phishguard-history.json")}
            disabled={!items.length}
            className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-secondary/60 px-3 py-2 text-xs hover:bg-secondary disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" /> Export
          </button>
          <button
            onClick={() => { clearHistory(); setItems([]); }}
            disabled={!items.length}
            className="inline-flex items-center gap-1.5 rounded-md border border-[color:var(--color-critical)]/40 bg-[color:var(--color-critical)]/10 px-3 py-2 text-xs text-[color:var(--color-critical)] hover:bg-[color:var(--color-critical)]/20 disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" /> Clear
          </button>
        </div>
      </header>

      <div className="glass rounded-2xl p-3">
        <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/60 px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by URL, domain, verdict…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
          />
        </div>
      </div>

      {!items.length && (
        <div className="mt-8 glass grid place-items-center rounded-2xl p-12 text-sm text-muted-foreground">
          No scans yet. Run a URL scan from the Scanner page.
        </div>
      )}

      {items.length > 0 && (
        <ul className="mt-6 space-y-2">
          {filtered.map((r, i) => (
            <li key={`${r.scannedAt}-${i}`}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border/60 bg-secondary/30 p-3 text-left transition-colors hover:bg-secondary/60"
              >
                <span className="mono shrink-0 text-xs text-muted-foreground">
                  {new Date(r.scannedAt).toLocaleString()}
                </span>
                <span className="mono min-w-0 truncate text-sm">{r.input}</span>
                <span className="mono shrink-0 text-sm font-bold">{r.verdict} · {r.score}</span>
              </button>
              {open === i && (
                <div className="mt-2"><ResultCard result={r} /></div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}