import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Activity, AlertTriangle, BadgeCheck, BadgeX, ExternalLink, Globe, Loader2 } from "lucide-react";
import { fetchThreatIntel } from "@/lib/phish/client";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Threat Intel Dashboard — PhishGuard" },
      { name: "description", content: "Live status of phishing threat-intel providers and 2024 APWG industry stats." },
      { property: "og:title", content: "Threat Intel Dashboard — PhishGuard" },
      { property: "og:description", content: "Live provider status and 2024 phishing trends." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["threat-intel"],
    queryFn: fetchThreatIntel,
    refetchInterval: 60_000,
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">Threat Intelligence</h1>
          <p className="text-sm text-muted-foreground">Live provider health + 2024 APWG industry trends.</p>
        </div>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 rounded-md border border-border/60 bg-secondary/60 px-3 py-2 text-xs hover:bg-secondary"
        >
          {isFetching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Activity className="h-3.5 w-3.5" />}
          Refresh
        </button>
      </header>

      {isLoading && (
        <div className="glass grid place-items-center rounded-2xl p-12 text-sm text-muted-foreground">
          <Loader2 className="mb-3 h-7 w-7 animate-spin text-primary" /> Loading providers…
        </div>
      )}
      {isError && (
        <div className="glass rounded-2xl p-6 text-sm text-[color:var(--color-critical)]">Failed to load intel.</div>
      )}

      {data && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ProviderCard name="Google Safe Browsing" configured={data.providers.googleSafeBrowsing.configured} detail={data.providers.googleSafeBrowsing.status} />
            <ProviderCard name="VirusTotal" configured={data.providers.virusTotal.configured} detail={data.providers.virusTotal.status} />
            <ProviderCard
              name="OpenPhish"
              configured={data.providers.openPhish.configured}
              detail={`${data.providers.openPhish.activeUrls.toLocaleString()} URLs · ${data.providers.openPhish.status}`}
              live={data.providers.openPhish.status === "online"}
            />
            <ProviderCard name="PhishTank" configured={data.providers.phishTank.configured} detail={data.providers.phishTank.status} />
          </section>

          <section className="mt-8 grid gap-4 sm:grid-cols-3">
            <Stat label="Phishing sites observed (Q4 2024)" value={data.apwg2024.totalPhishingSitesQ4.toLocaleString()} />
            <Stat label="Most-targeted sector" value={`${data.apwg2024.mostTargetedSector} · ${(data.apwg2024.mostTargetedSectorShare * 100).toFixed(1)}%`} />
            <Stat label="Avg BEC wire-transfer loss" value={`$${data.apwg2024.bec2024AvgWireLossUsd.toLocaleString()}`} />
          </section>

          <p className="mt-4 text-xs text-muted-foreground">
            Stats from the APWG Phishing Activity Trends Report ({data.apwg2024.asOf}).{" "}
            <a className="text-primary hover:underline inline-flex items-center gap-1" href={data.apwg2024.sourceUrl} target="_blank" rel="noopener noreferrer">
              View report <ExternalLink className="h-3 w-3" />
            </a>{" "}
            · Updated {new Date(data.updatedAt).toLocaleTimeString()}
          </p>
        </>
      )}
    </div>
  );
}

function ProviderCard({ name, configured, detail, live }: { name: string; configured: boolean; detail: string; live?: boolean }) {
  const ok = configured && (live ?? true);
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">{name}</h3>
        </div>
        {ok ? (
          <BadgeCheck className="h-5 w-5 text-[color:var(--color-safe)]" />
        ) : (
          <BadgeX className="h-5 w-5 text-[color:var(--color-suspicious)]" />
        )}
      </div>
      <p className="mono mt-2 text-xs uppercase tracking-widest text-muted-foreground">{detail}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mono mt-2 text-2xl font-bold text-gradient-cyber">{value}</div>
    </div>
  );
}