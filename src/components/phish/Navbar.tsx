import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, Shield, X } from "lucide-react";

const NAV = [
  { to: "/", label: "Scanner" },
  { to: "/email", label: "Email" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/history", label: "History" },
  { to: "/learn", label: "Learn" },
  { to: "/bookmarklet", label: "Bookmarklet" },
] as const;

export function Navbar() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 backdrop-blur-md bg-background/70">
      <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 sm:px-6">
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent cyber-glow">
            <Shield className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <div className="truncate text-base font-bold leading-tight tracking-tight">
              Phish<span className="text-gradient-cyber">Guard</span>
            </div>
            <div className="truncate text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              SOC · v1.0
            </div>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "rounded-md px-3 py-2 text-sm font-medium text-foreground bg-secondary" }}
              activeOptions={{ exact: n.to === "/" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <button
          className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-md border border-border/60 text-foreground"
          aria-label="Open menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <>
          <div
            className="fixed inset-0 top-[60px] z-30 bg-black/60 lg:hidden animate-in fade-in"
            onClick={() => setOpen(false)}
          />
          <div className="lg:hidden absolute left-0 right-0 top-full z-40 border-b border-border/60 bg-background/95 backdrop-blur-md animate-in slide-in-from-top-2">
            <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4 sm:px-6">
              {NAV.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-3 text-base font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
                  activeProps={{ className: "rounded-md px-3 py-3 text-base font-medium bg-secondary text-foreground" }}
                  activeOptions={{ exact: n.to === "/" }}
                >
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
        </>
      )}
    </header>
  );
}