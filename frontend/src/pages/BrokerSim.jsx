import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Users, Play, Trash2, Trophy, ArrowUpDown, Cpu, CircleDot, Shuffle, Plus,
} from "lucide-react";
import { toast } from "sonner";
import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Navbar from "../components/Navbar";
import { useBrokerSim, useHealth } from "../hooks";

// ── Colors ────────────────────────────────────────────────────────────────────
const BROKER_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4"];

// ── Random broker generator ───────────────────────────────────────────────────
const rnd  = (min, max, dec = 2) => parseFloat((Math.random() * (max - min) + min).toFixed(dec));
const pick = (...arr) => arr[Math.floor(Math.random() * arr.length)];
const NAMES = ["Alpha", "Beta", "Gamma", "Delta", "Epsilon", "Zeta", "Eta", "Theta"];

function randomBrokers() {
  // Truly random count: 2–6
  const count = Math.floor(Math.random() * 5) + 2;
  const shuffledNames = [...NAMES].sort(() => Math.random() - 0.5).slice(0, count);
  return shuffledNames.map((name) => ({
    name:                 `Broker ${name}`,
    weight:               rnd(0.1, 1.0, 1),
    initial_capital:      pick(5000, 8000, 10000, 15000, 20000, 25000),
    threshold:            rnd(0.05, 0.25, 2),
    smoothing_window:     pick(2, 3, 5, 7, 10, 14),
    allow_short:          Math.random() < 0.3,
    transaction_cost_bps: pick(5, 8, 10, 12, 15, 20),
  }));
}

// ── Formatters ────────────────────────────────────────────────────────────────
const money     = (x) => `$${Math.round(x).toLocaleString()}`;
const pct       = (x) => `${(x * 100).toFixed(1)}%`;
const monthYear = (d) => new Date(d).toLocaleDateString("en-US", { month: "short", year: "numeric" });
const fullDate  = (d) => new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });

// ── Day-by-day animation hook ─────────────────────────────────────────────────
// One tick = one trading day. On each day we cycle through the queue order
// highlighting each broker in turn, then advance all curves by one point.
//
// visibleUpTo: { brokerName: N } — show first N+1 points of that broker's curve.
// activeServing: which broker the model is "on" right now (for queue highlight).
// done: true once all days are replayed.

const DAY_TICK_MS   = 18;   // ms between days  (~1000 days × 18ms = ~18s total)
const BROKER_HOLD_MS = 80;  // ms to highlight each broker within a day before next

function useQueueAnimation(result, isRunning) {
  const [activeServing, setActiveServing] = useState(null);
  const [visibleUpTo,   setVisibleUpTo]   = useState({});
  const [done,          setDone]          = useState(false);
  const timerRef = useRef(null);
  const stateRef = useRef({ dayIdx: 0, slotIdx: 0 });

  useEffect(() => {
    clearTimeout(timerRef.current);
    if (!result || isRunning) {
      setActiveServing(null); setVisibleUpTo({}); setDone(false);
      return;
    }

    const queueOrder = result.queue_order;              // ["Broker A", "Broker B", ...]
    const nBrokers   = queueOrder.length;

    // Build per-broker curve date list (ordered, same as backend)
    const brokerDates = {};
    result.brokers.forEach((b) => {
      brokerDates[b.name] = b.curve.map((pt) => pt.date);
    });

    // Total days = length of the first broker's curve
    const totalDays = result.brokers[0]?.curve.length ?? 0;
    if (totalDays === 0) return;

    // Init: nothing visible yet
    const initVisible = {};
    result.brokers.forEach((b) => { initVisible[b.name] = -1; });
    setVisibleUpTo(initVisible);
    setDone(false);

    stateRef.current = { dayIdx: 0, slotIdx: 0 };

    function tick() {
      const s = stateRef.current;
      if (s.dayIdx >= totalDays) {
        setActiveServing(null);
        setDone(true);
        return;
      }

      const brokerName = queueOrder[s.slotIdx];
      setActiveServing(brokerName);

      // After cycling through all brokers on this day, advance all curves by 1
      const isLastSlot = s.slotIdx === nBrokers - 1;
      if (isLastSlot) {
        const dayIdx = s.dayIdx;
        setVisibleUpTo((prev) => {
          const next = { ...prev };
          result.brokers.forEach((b) => { next[b.name] = dayIdx; });
          return next;
        });
      }

      // Advance slot / day
      if (isLastSlot) {
        s.dayIdx  += 1;
        s.slotIdx  = 0;
      } else {
        s.slotIdx += 1;
      }

      timerRef.current = setTimeout(tick, isLastSlot ? DAY_TICK_MS : BROKER_HOLD_MS);
    }

    timerRef.current = setTimeout(tick, DAY_TICK_MS);
    return () => clearTimeout(timerRef.current);
  }, [result, isRunning]);

  return { activeServing, visibleUpTo, done };
}

// ── Compact broker stat card (read-only) ─────────────────────────────────────
function BrokerCard({ broker, color, queuePos, onRemove, canRemove }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
      {/* Color dot + queue position */}
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
        style={{ background: color }}
      >
        {queuePos}
      </span>

      {/* Name + stats row */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold truncate">{broker.name}</span>
          {broker.allow_short && (
            <Badge variant="outline" className="h-4 px-1 text-[9px]">short</Badge>
          )}
        </div>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground font-mono">
          <span>w <b className="text-foreground">{broker.weight.toFixed(1)}</b></span>
          <span>{money(broker.initial_capital)}</span>
          <span>thr <b className="text-foreground">{broker.threshold}</b></span>
          <span>sm <b className="text-foreground">{broker.smoothing_window}d</b></span>
          <span>tx <b className="text-foreground">{broker.transaction_cost_bps}bps</b></span>
        </div>
      </div>

      {canRemove && (
        <button
          onClick={onRemove}
          className="shrink-0 text-muted-foreground hover:text-rose-500 transition"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

// ── Queue visualizer ──────────────────────────────────────────────────────────
function QueueVisualizer({ queueOrder, brokers, isRunning, result, activeServing, visibleUpTo, done }) {
  const colorFor = (name) => {
    const idx = brokers.findIndex((b) => b.name === name);
    return BROKER_COLORS[idx % BROKER_COLORS.length];
  };

  // Build per-broker equity lookup once: name → curve array
  const brokerCurve = {};
  result?.brokers.forEach((b) => { brokerCurve[b.name] = b.curve; });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Cpu className="h-4 w-4 text-primary" />
          Daily serving queue
          <span className="ml-auto text-xs font-normal text-muted-foreground">
            weighted-random priority · every broker served each day
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          {queueOrder.map((name, i) => {
            const color     = colorFor(name);
            const isActive  = activeServing === name;
            const curve     = brokerCurve[name];
            const dayIdx    = visibleUpTo?.[name] ?? -1;
            const capital   = result?.brokers.find((b) => b.name === name)?.initial_capital;
            const equity    = dayIdx >= 0 ? curve?.[dayIdx]?.equity : null;
            const pnl       = equity != null && capital != null ? equity - capital : null;
            const pnlPct    = pnl != null && capital ? (pnl / capital) * 100 : null;

            return (
              <motion.div
                key={name}
                animate={isActive
                  ? { scale: 1.06, boxShadow: `0 0 0 2px ${color}` }
                  : { scale: 1,    boxShadow: "none" }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
                className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card px-4 py-3 text-center min-w-[120px]"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ background: color }}>{i + 1}</span>
                <span className="text-sm font-semibold">{name}</span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  w {brokers.find((b) => b.name === name)?.weight.toFixed(1) ?? "—"}
                </span>

                {/* Live P&L — updates every tick */}
                {pnl != null ? (
                  <div className="mt-0.5 text-center">
                    <span className={`text-[11px] font-semibold font-mono ${pnl >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                      {pnl >= 0 ? "+" : "−"}${Math.abs(Math.round(pnl)).toLocaleString()}
                    </span>
                    <span className={`ml-1 text-[10px] ${pnl >= 0 ? "text-emerald-500/70" : "text-rose-500/70"}`}>
                      ({pnl >= 0 ? "+" : ""}{pnlPct.toFixed(1)}%)
                    </span>
                  </div>
                ) : (
                  result && <span className="text-[10px] text-muted-foreground mt-0.5">—</span>
                )}

                {isActive && (
                  <motion.span key="s" initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }}
                    className="rounded-full px-2 py-0.5 text-[10px] font-medium text-white mt-0.5"
                    style={{ background: color }}>● serving</motion.span>
                )}
                {!isActive && result && !done && pnl == null && (
                  <span className="text-[10px] text-muted-foreground">waiting</span>
                )}
                {done && (
                  <span className="text-[10px] text-emerald-500 font-medium">✓ done</span>
                )}
                {!result && isRunning && (
                  <span className="text-[10px] text-muted-foreground animate-pulse">queued…</span>
                )}
              </motion.div>
            );
          })}
          {queueOrder.length === 0 && (
            <p className="text-sm text-muted-foreground">Generate brokers and run the simulation.</p>
          )}
        </div>
        {result && (
          <p className="mt-3 text-xs text-muted-foreground">
            Every trading day: model serves slot 1 → slot 2 → … → last slot, then advances to the next day.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ── Animated equity chart ─────────────────────────────────────────────────────
function BrokerEquityChart({ result, brokers, activeServing, visibleUpTo, done }) {
  if (!result) return null;

  const queueOrder = result.queue_order;
  const initCap    = result.buy_hold_curve[0]?.buy_hold_equity ?? 10000;

  // Pre-build per-broker equity arrays indexed by position (same order as buy_hold_curve)
  // Assumes all broker curves are aligned to the same trading days as buy_hold_curve
  const brokerEquity = {};
  result.brokers.forEach((b) => {
    brokerEquity[b.name] = b.curve.map((pt) => pt.equity);
  });

  const chartData = result.buy_hold_curve.map((bhPt, i) => {
    const row = { day: i + 1, date: bhPt.date, "Buy & Hold": bhPt.buy_hold_equity };
    queueOrder.forEach((name) => {
      const limit = visibleUpTo[name] ?? -1;
      if (i <= limit) row[name] = brokerEquity[name]?.[i];
    });
    return row;
  });

  const colorFor = (name) => {
    const idx = brokers.findIndex((b) => b.name === name);
    return BROKER_COLORS[idx % BROKER_COLORS.length];
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          Equity curves — all brokers vs Buy &amp; Hold
          {activeServing && !done && (
            <motion.span key={activeServing} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
              className="ml-auto rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
              style={{ background: colorFor(activeServing) }}>
              serving {activeServing}…
            </motion.span>
          )}
          {done && (
            <span className="ml-auto text-[10px] text-emerald-500 font-medium">all days complete ✓</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={chartData} margin={{ top: 8, right: 12, bottom: 0, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <ReferenceLine y={initCap} stroke="var(--muted-foreground)" strokeDasharray="4 4" strokeOpacity={0.4} />
            <XAxis
              dataKey="day"
              type="number"
              domain={[1, chartData.length]}
              minTickGap={60}
              tickFormatter={(d) => `Day ${d}`}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            />
            <YAxis tickFormatter={money} width={72}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
            <Tooltip
              contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
              labelFormatter={(d, payload) => {
                const date = payload?.[0]?.payload?.date;
                return `Day ${d}${date ? `  ·  ${fullDate(date)}` : ""}`;
              }}
              formatter={(v) => money(v)}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="Buy & Hold" stroke="#71717a" strokeWidth={1.5}
              dot={false} strokeDasharray="5 3" isAnimationActive={false} connectNulls={false} />
            {queueOrder.map((name) => (
              <Line key={name} type="monotone" dataKey={name}
                stroke={colorFor(name)} strokeWidth={2.5}
                dot={false} isAnimationActive={false} connectNulls={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ── Results table ─────────────────────────────────────────────────────────────
function ResultsTable({ result, brokers }) {
  if (!result) return null;
  const sorted = [...result.brokers].sort((a, b) => b.metrics.total_return - a.metrics.total_return);
  const best   = sorted[0];
  const bh     = result.buy_hold_curve;
  const bhRet  = bh.length ? bh[bh.length - 1].buy_hold_equity / bh[0].buy_hold_equity - 1 : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Trophy className="h-4 w-4 text-amber-400" /> Results — ranked by return
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto space-y-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              {["#", "Broker", "Weight", "Capital", "Final", "Return", "Sharpe", "Max DD", "Trades"].map((h) => (
                <th key={h} className="pb-2 pr-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((b, rank) => {
              const color   = BROKER_COLORS[brokers.findIndex((br) => br.name === b.name) % BROKER_COLORS.length];
              const lastEq  = b.curve[b.curve.length - 1]?.equity ?? b.initial_capital;
              const isBest  = b.name === best.name;
              return (
                <tr key={b.name} className={`border-b border-border/40 ${isBest ? "bg-emerald-500/5" : ""}`}>
                  <td className="py-2 pr-3 font-mono text-xs text-muted-foreground">#{rank + 1}</td>
                  <td className="py-2 pr-3 font-semibold text-sm" style={{ color }}>
                    {b.name}{isBest && <span className="ml-1 text-[10px] text-amber-400">★</span>}
                  </td>
                  <td className="py-2 pr-3 font-mono text-xs">{b.weight.toFixed(1)}</td>
                  <td className="py-2 pr-3 font-mono text-xs">{money(b.initial_capital)}</td>
                  <td className="py-2 pr-3 font-mono text-xs">{money(lastEq)}</td>
                  <td className={`py-2 pr-3 font-mono text-xs font-semibold ${b.metrics.total_return >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                    {pct(b.metrics.total_return)}
                  </td>
                  <td className="py-2 pr-3 font-mono text-xs">{b.metrics.sharpe.toFixed(2)}</td>
                  <td className="py-2 pr-3 font-mono text-xs text-rose-400">{pct(b.metrics.max_drawdown)}</td>
                  <td className="py-2 font-mono text-xs">{b.metrics.n_trades ?? "—"}</td>
                </tr>
              );
            })}
            {/* Buy & Hold row */}
            <tr className="border-t border-border/60 text-muted-foreground">
              <td className="pt-2 pr-3 font-mono text-xs">—</td>
              <td className="pt-2 pr-3 text-xs font-semibold" colSpan={3}>Buy &amp; Hold (baseline)</td>
              <td className="pt-2 pr-3 font-mono text-xs">{money(bh[bh.length - 1]?.buy_hold_equity ?? 0)}</td>
              <td className={`pt-2 pr-3 font-mono text-xs font-semibold ${bhRet >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                {pct(bhRet)}
              </td>
              <td colSpan={3} />
            </tr>
          </tbody>
        </table>

        {/* Winner blurb */}
        {best && (() => {
          const bb = brokers.find((b) => b.name === best.name);
          return (
            <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground leading-relaxed">
              <span className="font-semibold text-foreground">{best.name}</span> led with{" "}
              <span className="text-emerald-500 font-semibold">{pct(best.metrics.total_return)}</span> return
              (Sharpe {best.metrics.sharpe.toFixed(2)}).
              {bb && <> Threshold {bb.threshold}, {bb.smoothing_window}d smoothing, {bb.transaction_cost_bps}bps tx cost.</>}
              {" "}{best.metrics.total_return >= bhRet
                ? <><span className="text-emerald-500 font-semibold">Beat Buy &amp; Hold</span> by {pct(best.metrics.total_return - bhRet)}.</>
                : <>Buy &amp; Hold still won ({pct(bhRet)}).</>}
            </div>
          );
        })()}
      </CardContent>
    </Card>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function BrokerSim() {
  const [brokers, setBrokers] = useState(() => randomBrokers());
  const health      = useHealth();
  const modelLoaded = health.data?.model_loaded;
  const sim         = useBrokerSim();

  const queueOrder = sim.data?.queue_order
    ?? [...brokers].sort((a, b) => b.weight - a.weight).map((b) => b.name);

  const { activeServing, visibleUpTo, done } = useQueueAnimation(sim.data, sim.isPending);

  const addBroker = () => {
    if (brokers.length >= 6) { toast.error("Max 6 brokers"); return; }
    const usedNames = brokers.map((b) => b.name);
    const available = NAMES.map((n) => `Broker ${n}`).filter((n) => !usedNames.includes(n));
    const [nb] = randomBrokers();
    nb.name = available.length ? available[0] : `Broker ${brokers.length + 1}`;
    setBrokers((prev) => [...prev, nb]);
  };

  const removeBroker = (idx) => setBrokers((prev) => prev.filter((_, i) => i !== idx));

  const randomize = () => setBrokers(randomBrokers());

  const run = () => {
    if (!modelLoaded) { toast.error("Model not loaded"); return; }
    sim.mutate({ brokers }, { onError: (e) => toast.error(e.message) });
  };

  // Sort brokers by weight desc for display (queue order preview)
  const displayBrokers = [...brokers]
    .map((b, origIdx) => ({ b, origIdx }))
    .sort((a, z) => z.b.weight - a.b.weight);

  return (
    <>
      <Navbar>
        <Badge variant="outline" className="gap-1.5">
          <CircleDot className={`h-3 w-3 ${modelLoaded ? "text-emerald-500" : "text-amber-500"}`} />
          <span className="hidden sm:inline">
            {health.isLoading ? "connecting…" : modelLoaded ? "model loaded" : "model not loaded"}
          </span>
        </Badge>
      </Navbar>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight">Multi-Broker Simulation</h1>
            <Badge variant="outline" className="font-mono text-[10px]">BTC-USD · 2021–2023</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Brokers are randomly generated with different weights and strategy params. Each trading day the model
            serves every broker one at a time in weighted-random priority order. Watch the curves draw in live.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          {/* Left: broker list */}
          <aside className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-1.5 text-sm font-semibold">
                <Users className="h-4 w-4" /> Brokers
                <span className="text-xs font-normal text-muted-foreground">({brokers.length})</span>
              </h2>
              <div className="flex gap-1.5">
                <Button variant="outline" size="sm" onClick={randomize} className="h-7 gap-1 text-xs">
                  <Shuffle className="h-3 w-3" /> Randomize
                </Button>
                <Button variant="outline" size="sm" onClick={addBroker} disabled={brokers.length >= 6}
                  className="h-7 gap-1 text-xs">
                  <Plus className="h-3 w-3" /> Add
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              {displayBrokers.map(({ b, origIdx }, displayIdx) => (
                <BrokerCard
                  key={origIdx}
                  broker={b}
                  color={BROKER_COLORS[origIdx % BROKER_COLORS.length]}
                  queuePos={displayIdx + 1}
                  onRemove={() => removeBroker(origIdx)}
                  canRemove={brokers.length > 1}
                />
              ))}
            </div>

            <Button className="w-full gap-2" onClick={run} disabled={sim.isPending || !modelLoaded}>
              {sim.isPending ? (
                <><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" /> Simulating…</>
              ) : (
                <><Play className="h-3.5 w-3.5" /> Run simulation</>
              )}
            </Button>

            {!modelLoaded && !health.isLoading && (
              <p className="text-xs text-muted-foreground text-center">
                Drop the model into <code className="rounded bg-secondary px-1">backend/model/</code> to enable.
              </p>
            )}
          </aside>

          {/* Right: queue + chart + results */}
          <main className="space-y-4">
            <QueueVisualizer
              queueOrder={queueOrder}
              brokers={brokers}
              isRunning={sim.isPending}
              result={sim.data}
              activeServing={activeServing}
              visibleUpTo={visibleUpTo}
              done={done}
            />

            {sim.data ? (
              <motion.div key="results" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="space-y-4">
                <BrokerEquityChart
                  result={sim.data}
                  brokers={brokers}
                  activeServing={activeServing}
                  visibleUpTo={visibleUpTo}
                  done={done}
                />
                {done && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                    <ResultsTable result={sim.data} brokers={brokers} />
                  </motion.div>
                )}
              </motion.div>
            ) : (
              !sim.isPending && (
                <Card>
                  <CardContent className="grid place-items-center gap-3 py-20 text-center text-muted-foreground">
                    <ArrowUpDown className="h-8 w-8 text-primary" />
                    <p>Hit <b className="text-foreground">Run simulation</b> to start.</p>
                    <p className="text-xs">Each broker's equity curve draws in live as the model finishes serving it each day.</p>
                  </CardContent>
                </Card>
              )
            )}
          </main>
        </div>
      </div>
    </>
  );
}
