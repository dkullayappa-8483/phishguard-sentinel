import { useEffect, useState } from "react";
import type { RiskTier } from "@/lib/phish/types";

const TIER_COLOR: Record<RiskTier, string> = {
  safe: "var(--color-safe)",
  low: "var(--color-low)",
  suspicious: "var(--color-suspicious)",
  high: "var(--color-high)",
  critical: "var(--color-critical)",
};

export function RiskGauge({ score, tier, verdict }: { score: number; tier: RiskTier; verdict: string }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const from = 0;
    const to = score;
    const dur = 900;
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(Math.round(from + (to - from) * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [score]);

  const size = 180;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (shown / 100) * c;
  const color = TIER_COLOR[tier];

  return (
    <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[135deg]">
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="var(--color-secondary)" strokeWidth={stroke}
          strokeDasharray={`${c * 0.75} ${c}`} strokeLinecap="round"
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${c * 0.75} ${c}`}
          strokeDashoffset={off * 0.75 + c * 0.25}
          strokeLinecap="round"
          style={{ transition: "stroke 0.4s" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-mono text-4xl font-bold" style={{ color }}>{shown}</div>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">risk score</div>
        <div className="mt-1 text-sm font-semibold" style={{ color }}>{verdict}</div>
      </div>
    </div>
  );
}