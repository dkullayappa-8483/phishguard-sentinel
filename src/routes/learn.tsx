import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, BookOpen, Mail, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/learn")({
  head: () => ({
    meta: [
      { title: "Learn — Phishing 101 — PhishGuard" },
      { name: "description", content: "Common phishing scams, red flags, and how to protect yourself." },
      { property: "og:title", content: "Learn — Phishing 101 — PhishGuard" },
      { property: "og:description", content: "Common phishing scams, red flags, and how to protect yourself." },
    ],
  }),
  component: Learn,
});

const SCAMS = [
  { title: "Brand impersonation", body: "Look-alike domains (paypa1.com), split-label tricks (ama.zon.com), homoglyph swaps (rnicrosoft.com). Always check the registrable domain, not the subdomain." },
  { title: "Urgency & fear", body: "“Your account will be suspended in 24h.” Real companies rarely use hard deadlines in unexpected emails. Pause, breathe, verify on the official site." },
  { title: "Fake invoices & receipts", body: "Attached PDF/HTML invoices for purchases you didn't make. Goal: scare you into clicking the embedded link or calling a fake support number." },
  { title: "Credential harvesting", body: "Fake Microsoft 365 / Google login pages that POST your credentials to attacker domains. Check the URL carefully before typing a password — ever." },
  { title: "OAuth consent attacks", body: "Real Microsoft/Google login screen, but the app requesting access is malicious. Review every consent prompt: name, publisher, permissions." },
  { title: "Smishing & vishing", body: "SMS or voice variants. Same playbook: impersonate a bank/courier, send a short link. Never act on a link in an unexpected SMS — go to the app directly." },
];

const FLAGS = [
  "URL doesn't match the brand's real domain (compare letter by letter).",
  "HTTPS is missing, or the certificate is for a different domain.",
  "Generic greeting (“Dear customer”) from a service that knows your name.",
  "Unexpected attachments, especially .zip, .htm, .iso, .lnk.",
  "Email tone mixes urgency, fear, and a single magic link to “fix it”.",
  "Reply-To address differs from the From address.",
];

function Learn() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-8 flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/15 text-primary">
          <BookOpen className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Phishing 101</h1>
          <p className="text-sm text-muted-foreground">How phishing works, the red flags, and what to do.</p>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        {SCAMS.map((s) => (
          <article key={s.title} className="glass rounded-2xl p-5">
            <div className="mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-[color:var(--color-suspicious)]" />
              <h2 className="text-base font-semibold">{s.title}</h2>
            </div>
            <p className="text-sm text-muted-foreground">{s.body}</p>
          </article>
        ))}
      </section>

      <section className="glass mt-8 rounded-2xl p-6">
        <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
          <ShieldCheck className="h-4 w-4 text-[color:var(--color-safe)]" /> Quick red-flag checklist
        </h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {FLAGS.map((f) => (
            <li key={f} className="rounded-xl border border-border/60 bg-secondary/40 p-3 text-sm">{f}</li>
          ))}
        </ul>
      </section>

      <section className="glass mt-8 rounded-2xl p-6">
        <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
          <Mail className="h-4 w-4 text-primary" /> If you clicked
        </h2>
        <ol className="space-y-2 text-sm text-muted-foreground list-decimal pl-5">
          <li>Disconnect from the network if a file was downloaded.</li>
          <li>Change the password on the real site, then revoke active sessions.</li>
          <li>Enable 2FA (preferably an authenticator app or hardware key).</li>
          <li>Notify your bank or IT team. Watch for follow-on social engineering.</li>
          <li>Report the URL via the Report button on a scan result, and to <a className="text-primary hover:underline" href="https://phishtank.org/" target="_blank" rel="noopener noreferrer">PhishTank</a>.</li>
        </ol>
      </section>
    </div>
  );
}