// Headline metrics: strategy vs buy-and-hold, animated cards with icons.
import { motion } from "framer-motion";
import { TrendingUp, Activity, TrendingDown, Repeat } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const pct = (x) => `${(x * 100).toFixed(1)}%`;

export default function MetricsCards({ metrics }) {
  if (!metrics) return null;
  const s = metrics.strategy;
  const b = metrics.buy_hold;

  const cards = [
    { label: "Strategy return", value: pct(s.total_return), sub: `B&H ${pct(b.total_return)}`,
      icon: TrendingUp, good: s.total_return >= b.total_return },
    { label: "Sharpe ratio", value: s.sharpe.toFixed(2), sub: `B&H ${b.sharpe.toFixed(2)}`,
      icon: Activity, good: s.sharpe >= b.sharpe },
    { label: "Max drawdown", value: pct(s.max_drawdown), sub: `B&H ${pct(b.max_drawdown)}`,
      icon: TrendingDown, good: s.max_drawdown >= b.max_drawdown },
    { label: "Trades", value: s.n_trades ?? 0, sub: `Win rate ${pct(s.win_rate)}`,
      icon: Repeat, good: null },
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
                <span className="text-xs text-muted-foreground">{c.label}</span>
                <c.icon className={`h-4 w-4 ${
                  c.good === null ? "text-muted-foreground"
                  : c.good ? "text-emerald-500" : "text-rose-500"}`} />
              </div>
              <div className="mt-2 font-mono text-2xl font-semibold tabular-nums">{c.value}</div>
              <div className="mt-1 text-xs text-muted-foreground">{c.sub}</div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
