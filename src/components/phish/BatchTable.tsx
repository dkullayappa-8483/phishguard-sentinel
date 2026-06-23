import { useMemo, useState } from "react";
import { ArrowUpDown, Download } from "lucide-react";
import type { UrlScanResult } from "@/lib/phish/types";
import { downloadJson } from "@/lib/phish/export";

type SortKey = "score" | "verdict" | "input";

const TIER_TEXT: Record<UrlScanResult["tier"], string> = {
  safe: "text-[color:var(--color-safe)]",
  low: "text-[color:var(--color-low)]",
  suspicious: "text-[color:var(--color-suspicious)]",
  high: "text-[color:var(--color-high)]",
  critical: "text-[color:var(--color-critical)]",
};

export function BatchTable({ results }: { results: UrlScanResult[] }) {
  const [sort, setSort] = useState<SortKey>("score");
  const [dir, setDir] = useState<"asc" | "desc">("desc");

  const sorted = useMemo(() => {
    const s = [...results];
    s.sort((a, b) => {
      const av = a[sort] as string | number;
      const bv = b[sort] as string | number;
      if (av < bv) return dir === "asc" ? -1 : 1;
      if (av > bv) return dir === "asc" ? 1 : -1;
      return 0;
    });
    return s;
  }, [results, sort, dir]);

  const toggle = (k: SortKey) => {
    if (sort === k) setDir(dir === "asc" ? "desc" : "asc");
    else { setSort(k); setDir(k === "score" ? "desc" : "asc"); }
  };

  return (
    <section className="glass overflow-hidden rounded-2xl">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 px-5 py-3">
        <h2 className="text-sm font-semibold">Batch results ({results.length})</h2>
        <button
          onClick={() => downloadJson(results, "phishguard-batch.json")}
          className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-secondary/60 px-3 py-1.5 text-xs hover:bg-secondary"
        >
          <Download className="h-3.5 w-3.5" /> Export JSON
        </button>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary/40 text-left text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <Th onClick={() => toggle("verdict")}>Verdict</Th>
              <Th onClick={() => toggle("score")} className="w-24">Score</Th>
              <Th onClick={() => toggle("input")}>URL</Th>
              <th className="px-4 py-2">Registrable</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, i) => (
              <tr key={i} className="border-t border-border/40 hover:bg-secondary/30">
                <td className={`px-4 py-2 font-semibold ${TIER_TEXT[r.tier]}`}>{r.verdict}</td>
                <td className={`px-4 py-2 mono font-bold ${TIER_TEXT[r.tier]}`}>{r.score}</td>
                <td className="px-4 py-2 mono max-w-[320px] truncate" title={r.input}>{r.input}</td>
                <td className="px-4 py-2 mono text-muted-foreground">{r.domain.registrable ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Th({ children, onClick, className }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
  return (
    <th className={`px-4 py-2 ${className ?? ""}`}>
      <button onClick={onClick} className="inline-flex items-center gap-1 hover:text-foreground">
        {children} <ArrowUpDown className="h-3 w-3" />
      </button>
    </th>
  );
}