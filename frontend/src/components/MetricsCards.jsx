// Headline metrics: strategy vs buy-and-hold, with numbers that tween on change.
import { useEffect } from "react";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { TrendingUp, Activity, TrendingDown, Repeat, HelpCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const pct = (x) => `${(x * 100).toFixed(1)}%`;
const num2 = (x) => x.toFixed(2);
const int = (x) => `${Math.round(x)}`;

// A single number that smoothly animates from its previous value to the next.
function AnimatedValue({ value, format }) {
  const mv = useMotionValue(value);
  const text = useTransform(mv, (v) => format(v));
  useEffect(() => {
    const controls = animate(mv, value, { duration: 0.4, ease: "easeOut" });
    return controls.stop;
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps
  return <motion.span>{text}</motion.span>;
}

export default function MetricsCards({ metrics }) {
  if (!metrics) return null;
  const s = metrics.strategy;
  const b = metrics.buy_hold;

  // delta vs buy-and-hold, shown as a small colored chip
  const ppDelta = (sv, bv) => `${sv >= bv ? "+" : ""}${((sv - bv) * 100).toFixed(1)}pp`;
  const numDelta = (sv, bv) => `${sv >= bv ? "+" : ""}${(sv - bv).toFixed(2)}`;

  const cards = [
    { label: "Strategy return", value: s.total_return, fmt: pct, sub: `B&H ${pct(b.total_return)}`,
      icon: TrendingUp, good: s.total_return >= b.total_return, delta: ppDelta(s.total_return, b.total_return),
      tip: "How much money you made or lost by following the model's calls — the final score." },
    { label: "Sharpe ratio", value: s.sharpe, fmt: num2, sub: `B&H ${num2(b.sharpe)}`,
      icon: Activity, good: s.sharpe >= b.sharpe, delta: numDelta(s.sharpe, b.sharpe),
      tip: "How smooth or scary the ride was to get there — the quality of the ride. Higher is better." },
    { label: "Max drawdown", value: s.max_drawdown, fmt: pct, sub: `B&H ${pct(b.max_drawdown)}`,
      icon: TrendingDown, good: s.max_drawdown >= b.max_drawdown, delta: ppDelta(s.max_drawdown, b.max_drawdown),
      tip: "The worst peak-to-trough drop along the way — how much you'd have lost at the lowest point." },
    { label: "Trades", value: s.n_trades ?? 0, fmt: int, sub: `Win rate ${pct(s.win_rate)}`,
      icon: Repeat, good: null, delta: null,
      tip: "How many buy/sell trades the model made, and the share of them that were profitable." },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((c, i) => (
        <motion.div key={c.label}
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05, duration: 0.3 }}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  {c.label}
                  <span title={c.tip} className="inline-flex cursor-help">
                    <HelpCircle className="h-3 w-3 opacity-50 hover:opacity-100" />
                  </span>
                </span>
                <c.icon className={`h-4 w-4 ${
                  c.good === null ? "text-muted-foreground"
                  : c.good ? "text-emerald-500" : "text-rose-500"}`} />
              </div>
              <div className="mt-2 font-mono text-2xl font-semibold tabular-nums">
                <AnimatedValue value={c.value} format={c.fmt} />
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                {c.sub}
                {c.delta != null && (
                  <span className={`rounded px-1 py-px font-mono text-[10px] tabular-nums ${
                    c.good ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"}`}>
                    {c.delta}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
