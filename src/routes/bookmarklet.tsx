import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bookmark, Copy } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/bookmarklet")({
  head: () => ({
    meta: [
      { title: "Bookmarklet — Scan with PhishGuard" },
      { name: "description", content: "Drag the PhishGuard bookmarklet to your bookmarks bar to scan any page with one click." },
      { property: "og:title", content: "Bookmarklet — Scan with PhishGuard" },
      { property: "og:description", content: "Scan any page with one click." },
    ],
  }),
  component: BookmarkletPage,
});

function BookmarkletPage() {
  const [origin, setOrigin] = useState("https://phishguard.lovable.app");
  useEffect(() => { if (typeof window !== "undefined") setOrigin(window.location.origin); }, []);

  const code = `javascript:(function(){var u=encodeURIComponent(window.location.href);window.open('${origin}/?u='+u,'_blank');})();`;

  const copy = async () => {
    try { await navigator.clipboard.writeText(code); toast.success("Copied bookmarklet code"); }
    catch { toast.error("Copy failed"); }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-6 flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/15 text-primary">
          <Bookmark className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">PhishGuard Bookmarklet</h1>
          <p className="text-sm text-muted-foreground">One-click scanning from any page.</p>
        </div>
      </header>

      <section className="glass rounded-2xl p-6">
        <ol className="space-y-3 text-sm">
          <li><strong>1.</strong> Show your bookmarks bar (<kbd className="mono rounded bg-secondary px-1.5">Ctrl/Cmd + Shift + B</kbd>).</li>
          <li>
            <strong>2.</strong> Drag this button to your bookmarks bar:
            <div className="mt-3">
              {/* eslint-disable-next-line react/jsx-no-target-blank */}
              <a
                href={code}
                onClick={(e) => e.preventDefault()}
                draggable
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground cyber-glow"
              >
                🛡 Scan with PhishGuard
              </a>
            </div>
          </li>
          <li><strong>3.</strong> Open any suspicious page, then click the bookmarklet — PhishGuard will scan it.</li>
        </ol>

        <div className="mt-6">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Or copy the code</label>
            <button onClick={copy} className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-secondary/60 px-2.5 py-1 text-xs hover:bg-secondary">
              <Copy className="h-3 w-3" /> Copy
            </button>
          </div>
          <pre className="mono mt-2 overflow-x-auto rounded-xl border border-border/60 bg-background/60 p-3 text-[11px]">{code}</pre>
        </div>
      </section>
    </div>
  );
}