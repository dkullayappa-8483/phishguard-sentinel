import { createFileRoute } from "@tanstack/react-router";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const Route = createFileRoute("/api/threat-intel")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      GET: async () => {
        const hasGsb = !!process.env.GOOGLE_SAFE_BROWSING_API_KEY;
        const hasVt = !!process.env.VIRUSTOTAL_API_KEY;
        let openPhishCount = 0;
        let openPhishStatus: "online" | "offline" = "offline";
        try {
          const ctl = new AbortController();
          const to = setTimeout(() => ctl.abort(), 6000);
          const r = await fetch("https://openphish.com/feed.txt", { signal: ctl.signal });
          clearTimeout(to);
          if (r.ok) {
            const t = await r.text();
            openPhishCount = t.split(/\r?\n/).filter(Boolean).length;
            openPhishStatus = "online";
          }
        } catch {
          /* ignore */
        }
        return new Response(
          JSON.stringify({
            providers: {
              googleSafeBrowsing: { configured: hasGsb, status: hasGsb ? "ready" : "no-key" },
              virusTotal: { configured: hasVt, status: hasVt ? "ready" : "no-key" },
              openPhish: { configured: true, status: openPhishStatus, activeUrls: openPhishCount },
              phishTank: { configured: true, status: "ready" },
            },
            apwg2024: {
              totalPhishingSitesQ4: 989123,
              mostTargetedSector: "Social Media",
              mostTargetedSectorShare: 0.226,
              bec2024AvgWireLossUsd: 128980,
              sourceUrl: "https://apwg.org/trendsreports/",
              asOf: "2024-Q4",
            },
            updatedAt: new Date().toISOString(),
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=300", ...CORS },
          },
        );
      },
    },
  },
});