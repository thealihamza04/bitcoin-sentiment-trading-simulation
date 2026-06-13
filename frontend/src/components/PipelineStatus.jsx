// Pipeline status shown below the Strategy card. While a request is in flight it
// animates send → model predicting → build signals → backtest (active stage
// spins, completed stages get a check). When the request finishes it stays
// visible with every stage marked complete, and re-animates on the next run.
// Stages advance on a timer — the backend answers in one HTTP call — so this
// visualises the pipeline rather than streaming live per-stage telemetry.
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Send, BrainCircuit, Sigma, LineChart, Check, Loader2, CheckCircle2 } from "lucide-react";

const STAGES = [
  { key: "send", label: "Sending data", icon: Send },
  { key: "model", label: "Model predicting", icon: BrainCircuit },
  { key: "signal", label: "Building signals", icon: Sigma },
  { key: "backtest", label: "Backtesting", icon: LineChart },
];

export default function PipelineStatus({ active }) {
  const [stage, setStage] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (active) {
      setStarted(true);
      setStage(0);
      const id = setInterval(
        () => setStage((s) => Math.min(s + 1, STAGES.length - 1)),
        180
      );
      return () => clearInterval(id);
    }
    // Finished: mark every stage complete (and keep the card visible).
    setStage((s) => (started ? STAGES.length : s));
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!started) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden rounded-xl border border-border/60 bg-card"
    >
      <div className="space-y-3 p-4">
        <div className={`flex items-center gap-2 text-xs font-medium ${active ? "text-[#f7931a]" : "text-emerald-500"}`}>
          {active ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Running simulation…
            </>
          ) : (
            <>
              <CheckCircle2 className="h-3.5 w-3.5" />
              Simulation complete
            </>
          )}
        </div>

        <ol className="space-y-1">
          {STAGES.map((s, i) => {
            const done = i < stage;
            const current = active && i === stage;
            const Icon = done ? Check : s.icon;
            return (
              <li key={s.key} className="flex items-center gap-2.5">
                {/* status node + vertical connector */}
                <div className="flex flex-col items-center self-stretch">
                  <motion.div
                    animate={current ? { rotate: 360 } : { rotate: 0 }}
                    transition={
                      current
                        ? { repeat: Infinity, ease: "linear", duration: 0.9 }
                        : { duration: 0 }
                    }
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                      current
                        ? "border-[#f7931a] bg-[#f7931a]/15 text-[#f7931a]"
                        : done
                          ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-500"
                          : "border-border/60 text-muted-foreground/50"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </motion.div>
                  {i < STAGES.length - 1 && (
                    <div className={`my-0.5 w-px flex-1 ${done ? "bg-emerald-500/40" : "bg-border/60"}`} />
                  )}
                </div>

                <span
                  className={`py-0.5 text-xs ${
                    current
                      ? "font-medium text-foreground"
                      : done
                        ? "text-muted-foreground"
                        : "text-muted-foreground/50"
                  }`}
                >
                  {s.label}
                  {current && <span className="ml-0.5 tracking-widest">…</span>}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </motion.div>
  );
}
