// Top navigation shared across pages. `children` renders on the right (e.g. the
// dashboard's sentiment tester + model badge).
import { NavLink } from "react-router-dom";
import { Bitcoin } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/docs", label: "Docs" },
  { to: "/case-study", label: "Case study" },
];

export default function Navbar({ children }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2 sm:gap-6">
          <NavLink to="/" className="flex shrink-0 items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10">
              <Bitcoin className="h-5 w-5 text-[#f7931a]" />
            </div>
            <span className="hidden text-sm font-semibold tracking-tight sm:block">
              BTC Sentiment Sim
            </span>
          </NavLink>

          <nav className="flex items-center gap-0.5 sm:gap-1">
            {LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end}
                className={({ isActive }) =>
                  cn(
                    "rounded-md px-2 py-1.5 text-sm whitespace-nowrap transition sm:px-3",
                    isActive
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )
                }>
                {l.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">{children}</div>
      </div>
    </header>
  );
}
