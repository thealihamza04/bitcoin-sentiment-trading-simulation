// A *simulated* model-training run — no real training happens. It animates a
// realistic FinBERT fine-tuning loop (load → tokenize → train → eval → save)
// with a live loss/accuracy chart and a streaming log. Hyperparameters shape
// the simulated curves (e.g. a hot learning rate trains noisier and lands on
// worse metrics), and the optimal config ends on the same held-out numbers
// reported in the case study. Purely a visualisation.
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend,
} from "recharts";
import {
  Brain, Play, Pause, RotateCcw, CheckCircle2, Cpu, Database, Settings2, Terminal,
  Loader2, Timer, AlertTriangle, Check,
} from "lucide-react";
import Navbar from "../components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { RowSlider } from "@/components/ui/row-slider";

// ---- fixed facts (mirrors the case study) --------------------------------- //
const TICK_MS = 120;
const TRAIN_SAMPLES = 2170;
const REAL = { accuracy: 0.875, macro_f1: 0.84, weighted_f1: 0.87, test_loss: 0.36 };
const REAL_CM = [[47, 7, 3], [7, 259, 13], [8, 20, 101]]; // rows = true neg/neu/pos
const CLASSES = ["neg", "neu", "pos"];
const STAGES = ["Load data", "Tokenize", "Train", "Evaluate", "Save model"];

// Learning-rate presets: each shapes convergence speed, noise, and final quality.
const LRS = [
  { label: "5e-6", q: 0.94, decay: 1.4, noise: 0.03, floor: 0.55, hint: "too low — slow convergence" },
  { label: "2e-5", q: 1.0,  decay: 3.0, noise: 0.05, floor: 0.30, hint: "sweet spot (case-study setup)" },
  { label: "5e-5", q: 0.97, decay: 2.6, noise: 0.10, floor: 0.36, hint: "a bit hot — noisy steps" },
  { label: "1e-4", q: 0.88, decay: 2.0, noise: 0.20, floor: 0.48, hint: "too high — unstable loss" },
];
const BATCHES = [8, 16, 32];
const SPEEDS = [1, 2, 4];

const epochFactor = (e) => [0, 0.95, 0.985, 1, 1, 0.995][e];
const bsFactor = (b) => ({ 8: 1, 16: 0.995, 32: 0.99 })[b];
const noise = (a) => (Math.random() - 0.5) * a;
const fmtTime = (ms) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

// Overall config quality in (0, 1] — 1.0 reproduces the real reported numbers.
function quality(lrIdx, epochs, bs) {
  return LRS[lrIdx].q * epochFactor(epochs) * bsFactor(bs);
}
function finalMetrics(q) {
  return {
    accuracy: REAL.accuracy * q,
    macro_f1: REAL.macro_f1 * q,
    weighted_f1: REAL.weighted_f1 * q,
    test_loss: REAL.test_loss + (1 - q) * 1.6,
  };
}
// Degrade the real confusion matrix for sub-optimal configs: move diagonal
// mass onto the existing error cells proportionally.
function confusionFor(q) {
  if (q >= 0.999) return REAL_CM;
  return REAL_CM.map((row, i) => {
    const out = [...row];
    const newDiag = Math.max(0, Math.round(row[i] * q));
    let removed = row[i] - newDiag;
    out[i] = newDiag;
    const others = [0, 1, 2].filter((j) => j !== i);
    const totalOff = others.reduce((s, j) => s + row[j], 0) || 1;
    const add0 = Math.round((removed * row[others[0]]) / totalOff);
    out[others[0]] += add0;
    out[others[1]] += removed - add0;
    return out;
  });
}

export default function TrainingSim() {
  // config
  const [epochs, setEpochs] = useState(3);
  const [lrIdx, setLrIdx] = useState(1);
  const [bsIdx, setBsIdx] = useState(0);
  const [speedIdx, setSpeedIdx] = useState(0);

  // run state
  const [status, setStatus] = useState("idle"); // idle | prep | running | paused | done
  const [stageIdx, setStageIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [live, setLive] = useState({ epoch: 0, step: 0, trainLoss: null, valLoss: null, acc: null, f1: null });
  const [history, setHistory] = useState([]);
  const [logs, setLogs] = useState([]);

  const timer = useRef(null);
  const timeouts = useRef([]);
  const cfgRef = useRef(null);
  const gstep = useRef(0);
  const lastEpoch = useRef(0);
  const speedRef = useRef(SPEEDS[0]);
  const logBox = useRef(null);

  speedRef.current = SPEEDS[speedIdx];

  const bs = BATCHES[bsIdx];
  const stepsPerEpoch = Math.ceil(TRAIN_SAMPLES / bs);
  const totalSteps = epochs * stepsPerEpoch;
  const q = quality(lrIdx, epochs, bs);
  const finals = finalMetrics(q);
  const optimal = q >= 0.995;

  useEffect(() => {
    if (logBox.current) logBox.current.scrollTop = logBox.current.scrollHeight;
  }, [logs]);

  useEffect(() => () => {
    clearInterval(timer.current);
    timeouts.current.forEach(clearTimeout);
  }, []);

  const later = (fn, ms) => timeouts.current.push(setTimeout(fn, ms));
  const pushLog = (...lines) => setLogs((L) => [...L, ...lines]);

  const reset = () => {
    clearInterval(timer.current);
    timeouts.current.forEach(clearTimeout);
    timeouts.current = [];
    gstep.current = 0;
    lastEpoch.current = 0;
    setStatus("idle");
    setStageIdx(0);
    setProgress(0);
    setElapsed(0);
    setHistory([]);
    setLogs([]);
    setLive({ epoch: 0, step: 0, trainLoss: null, valLoss: null, acc: null, f1: null });
  };

  // One simulated logging step: advance the counter, derive metrics from the
  // config's curves, log it, and run "evaluation" at epoch boundaries.
  const tick = () => {
    const cfg = cfgRef.current;
    const adv = cfg.logEvery * speedRef.current;
    gstep.current = Math.min(gstep.current + adv, cfg.totalSteps);
    const g = gstep.current;
    const p = g / cfg.totalSteps;
    const epoch = Math.min(cfg.epochs, Math.floor((g - 1) / cfg.stepsPerEpoch) + 1);
    const stepInEpoch = Math.min(cfg.stepsPerEpoch, g - (epoch - 1) * cfg.stepsPerEpoch);

    const lr = cfg.lr;
    const tLoss = +(lr.floor + 0.85 * Math.exp(-lr.decay * p) + noise(lr.noise)).toFixed(3);
    const tAccTarget = Math.min(0.97, cfg.finals.accuracy + 0.06);
    const tAcc = +(tAccTarget - (tAccTarget - 0.5) * Math.exp(-lr.decay * p) + noise(0.012)).toFixed(3);

    pushLog(`Epoch ${epoch}/${cfg.epochs} | step ${stepInEpoch}/${cfg.stepsPerEpoch} | loss ${tLoss.toFixed(3)} | lr ${cfg.lrLabel}`);

    const crossed = epoch !== lastEpoch.current;
    const finished = g >= cfg.totalSteps;
    const point = { step: g, trainLoss: tLoss, trainAcc: tAcc, valLoss: null, valAcc: null };
    let liveExtra = {};

    if (crossed || finished) {
      lastEpoch.current = epoch;
      // mild late overfitting when over-training (val loss curls back up)
      const over = cfg.epochs > 3 ? (cfg.epochs - 3) * 0.18 * Math.max(0, p - 0.55) ** 2 : 0;
      const vLoss = +(lr.floor + 0.04 + 0.62 * Math.exp(-lr.decay * 0.9 * p) + over + noise(lr.noise * 0.3)).toFixed(3);
      const A = cfg.finals.accuracy;
      const vAcc = +(A - (A - 0.55) * Math.exp(-lr.decay * p) + noise(0.006)).toFixed(3);
      const F = cfg.finals.macro_f1;
      const vF1 = +(F - (F - 0.45) * Math.exp(-lr.decay * p) + noise(0.006)).toFixed(3);
      point.valLoss = vLoss;
      point.valAcc = vAcc;
      liveExtra = { valLoss: vLoss, acc: vAcc, f1: vF1 };
      pushLog(`  ↳ eval epoch ${epoch}: val_loss ${vLoss.toFixed(3)} · acc ${(vAcc * 100).toFixed(1)}% · macroF1 ${vF1.toFixed(2)}`);
    }

    setHistory((H) => [...H, point]);
    setProgress(p);
    setElapsed((e) => e + TICK_MS);
    setLive((prev) => ({ ...prev, epoch, step: stepInEpoch, trainLoss: tLoss, ...liveExtra }));

    if (finished) {
      clearInterval(timer.current);
      setStageIdx(3);
      pushLog("Training complete.", "Evaluating on held-out test set (465 sentences)…");
      later(() => {
        const f = cfg.finals;
        pushLog(`Test: accuracy ${(f.accuracy * 100).toFixed(1)}% · macroF1 ${f.macro_f1.toFixed(2)} · weightedF1 ${f.weighted_f1.toFixed(2)} · loss ${f.test_loss.toFixed(2)}`);
        setStageIdx(4);
        pushLog("Saving best checkpoint → backend/model/ …");
        later(() => {
          pushLog("Done. Model ready for inference.");
          setStatus("done");
        }, 900);
      }, 800);
    }
  };

  const startLoop = () => {
    clearInterval(timer.current);
    timer.current = setInterval(tick, TICK_MS);
  };

  const start = () => {
    reset();
    // ~16 chart points per epoch regardless of batch size
    const logEvery = Math.max(4, Math.round(stepsPerEpoch / 17));
    cfgRef.current = {
      epochs, stepsPerEpoch, totalSteps, logEvery,
      lr: LRS[lrIdx], lrLabel: LRS[lrIdx].label,
      finals: finalMetrics(q),
    };
    setStatus("prep");
    setStageIdx(0);
    pushLog(
      `$ python train.py --model ProsusAI/finbert --epochs ${epochs} --bs ${bs} --lr ${LRS[lrIdx].label}`,
      `Loading Financial PhraseBank — ${TRAIN_SAMPLES} train / 465 val / 465 test`,
    );
    later(() => {
      setStageIdx(1);
      pushLog("Tokenizing with WordPiece (max_len 128)…");
    }, 550);
    later(() => {
      setStageIdx(2);
      pushLog(`Fine-tuning on CPU — ${totalSteps} optimisation steps (AdamW, wd 0.01, seed 42)`);
      setStatus("running");
      startLoop();
    }, 1200);
  };

  const pause = () => { clearInterval(timer.current); setStatus("paused"); };
  const resume = () => { setStatus("running"); startLoop(); };

  const running = status === "running";
  const paused = status === "paused";
  const prep = status === "prep";
  const done = status === "done";
  const busy = running || paused || prep;
  const pctText = `${Math.round(progress * 100)}%`;
  const etaMs = busy && progress > 0
    ? ((1 - progress) * totalSteps / (Math.max(4, Math.round(stepsPerEpoch / 17)) * SPEEDS[speedIdx])) * TICK_MS
    : null;

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-5">
          <h1 className="text-xl font-semibold tracking-tight">Model training simulation</h1>
          <p className="text-sm text-muted-foreground">
            A visualised FinBERT fine-tuning run — tune the hyperparameters and watch how the
            training behaves.{" "}
            <span className="text-foreground/70">(Simulated — no real training is performed.)</span>
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          {/* ---- left: config + run status ---- */}
          <aside className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Settings2 className="h-4 w-4 text-[#f7931a]" /> Training config
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className={`space-y-3 ${busy ? "pointer-events-none opacity-50" : ""}`}>
                  <RowSlider label="Epochs" value={epochs} min={1} max={5} step={1}
                             display={`${epochs}`} onValueChange={setEpochs} />

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Learning rate</span>
                      <span className={`${lrIdx === 1 ? "text-emerald-500" : "text-amber-500"}`}>{LRS[lrIdx].hint}</span>
                    </div>
                    <Segmented options={LRS.map((l) => l.label)} value={lrIdx} onChange={setLrIdx} />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Batch size</span>
                      <span className="font-mono text-muted-foreground">{stepsPerEpoch} steps/epoch</span>
                    </div>
                    <Segmented options={BATCHES.map(String)} value={bsIdx} onChange={setBsIdx} />
                  </div>
                </div>

                <dl className="space-y-1.5 border-t border-border/60 pt-3 text-xs">
                  {[
                    ["Base model", "ProsusAI/finbert"],
                    ["Dataset", "Financial PhraseBank"],
                    ["Split", "2,170 / 465 / 465"],
                    ["Optimizer", "AdamW · wd 0.01 · seed 42"],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">{k}</dt>
                      <dd className="text-right font-mono text-foreground">{v}</dd>
                    </div>
                  ))}
                </dl>

                {!busy ? (
                  <Button className="w-full" onClick={start}>
                    <Play className="h-4 w-4" /> {done ? "Re-run training" : "Start training"}
                  </Button>
                ) : paused ? (
                  <Button className="w-full" onClick={resume}>
                    <Play className="h-4 w-4" /> Resume
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full" onClick={pause} disabled={prep}>
                    <Pause className="h-4 w-4" /> Pause
                  </Button>
                )}
                {(busy || done) && (
                  <Button variant="ghost" className="w-full" onClick={reset}>
                    <RotateCcw className="h-4 w-4" /> Reset
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* run status: stages, progress, timing, speed */}
            {(busy || done) && (
              <Card>
                <CardContent className="space-y-3 p-4">
                  <div className={`flex items-center gap-2 text-xs font-medium ${
                    done ? "text-emerald-500" : paused ? "text-amber-500" : "text-[#f7931a]"}`}>
                    {done ? <CheckCircle2 className="h-3.5 w-3.5" />
                      : paused ? <Pause className="h-3.5 w-3.5" />
                      : <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    {done ? "Training complete"
                      : paused ? "Paused"
                      : prep ? STAGES[stageIdx] + "…"
                      : `Epoch ${live.epoch}/${epochs} · step ${live.step}/${stepsPerEpoch}`}
                  </div>

                  {/* stage stepper */}
                  <ol className="space-y-1">
                    {STAGES.map((s, i) => {
                      const isDone = done || i < stageIdx;
                      const cur = !done && i === stageIdx;
                      return (
                        <li key={s} className="flex items-center gap-2 text-xs">
                          <span className={`grid h-4.5 w-4.5 shrink-0 place-items-center rounded-full border ${
                            cur ? "border-[#f7931a] text-[#f7931a]"
                              : isDone ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-500"
                              : "border-border/60 text-muted-foreground/50"}`}
                                style={{ height: 18, width: 18 }}>
                            {isDone ? <Check className="h-3 w-3" />
                              : cur && !paused ? <Loader2 className="h-3 w-3 animate-spin" />
                              : <span className="text-[9px]">{i + 1}</span>}
                          </span>
                          <span className={cur ? "font-medium text-foreground"
                            : isDone ? "text-muted-foreground" : "text-muted-foreground/50"}>
                            {s}
                          </span>
                        </li>
                      );
                    })}
                  </ol>

                  {/* progress bar */}
                  <div className="h-2 overflow-hidden rounded-full bg-secondary">
                    <motion.div className="h-full rounded-full bg-[#f7931a]"
                      animate={{ width: pctText }}
                      transition={{ ease: "linear", duration: TICK_MS / 1000 }} />
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Timer className="h-3 w-3" /> {fmtTime(elapsed)}
                      {etaMs != null && !done && <span>· ETA {fmtTime(etaMs)}</span>}
                    </span>
                    <span>{pctText}</span>
                  </div>

                  {/* speed control */}
                  {!done && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Speed</span>
                      <Segmented options={SPEEDS.map((s) => `${s}×`)} value={speedIdx} onChange={setSpeedIdx} className="flex-1" />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </aside>

          {/* ---- right: live metrics + charts + results + log ---- */}
          <section className="space-y-4">
            {status === "idle" ? (
              <Card>
                <CardContent className="grid place-items-center gap-3 py-24 text-center text-muted-foreground">
                  <Brain className="h-9 w-9 text-[#f7931a]" />
                  <p>Tune the config and hit <b className="text-foreground">Start training</b>.</p>
                  <p className="max-w-md text-xs">
                    This replays a realistic fine-tuning curve for FinBERT on the Financial PhraseBank
                    dataset — try a hot learning rate or extra epochs and watch the loss get noisy or
                    overfit. The actual model was trained once in Colab.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <Metric icon={Cpu} label="Train loss" value={live.trainLoss != null ? live.trainLoss.toFixed(3) : "—"} />
                  <Metric icon={Database} label="Val loss" value={live.valLoss != null ? live.valLoss.toFixed(3) : "—"} />
                  <Metric icon={Brain} label="Val accuracy" value={live.acc != null ? `${(live.acc * 100).toFixed(1)}%` : "—"} good />
                  <Metric icon={Brain} label="Val macro-F1" value={live.f1 != null ? live.f1.toFixed(2) : "—"} good />
                </div>

                {/* charts */}
                <Card>
                  <CardHeader className="pb-0">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Cpu className="h-4 w-4 text-[#f7931a]" /> Training curves
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-3">
                    <Tabs defaultValue="loss">
                      <TabsList>
                        <TabsTrigger value="loss">Loss</TabsTrigger>
                        <TabsTrigger value="acc">Accuracy</TabsTrigger>
                      </TabsList>
                      <TabsContent value="loss" className="mt-3">
                        <Chart data={history} yDomain={[0.2, 1.3]}
                          lines={[
                            { key: "trainLoss", name: "Train loss", color: "#f7931a", dots: false },
                            { key: "valLoss", name: "Val loss", color: "#10b981", dots: true },
                          ]} />
                      </TabsContent>
                      <TabsContent value="acc" className="mt-3">
                        <Chart data={history} yDomain={[0.45, 1]} percent
                          lines={[
                            { key: "trainAcc", name: "Train accuracy", color: "#f7931a", dots: false },
                            { key: "valAcc", name: "Val accuracy", color: "#10b981", dots: true },
                          ]} />
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>

                {/* final held-out results */}
                {done && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                    <Card className="border-emerald-500/30 bg-emerald-500/5">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base text-emerald-500">
                          <CheckCircle2 className="h-4 w-4" /> Held-out test results
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                          {[
                            ["Accuracy", `${(finals.accuracy * 100).toFixed(1)}%`],
                            ["Macro-F1", finals.macro_f1.toFixed(2)],
                            ["Weighted-F1", finals.weighted_f1.toFixed(2)],
                            ["Test loss", finals.test_loss.toFixed(2)],
                          ].map(([l, v]) => (
                            <div key={l} className="rounded-lg border border-border/60 bg-card p-3 text-center">
                              <div className="text-xs text-muted-foreground">{l}</div>
                              <div className="mt-1 font-mono text-lg font-semibold">{v}</div>
                            </div>
                          ))}
                        </div>

                        <div className="flex flex-wrap items-start gap-6">
                          {/* confusion matrix */}
                          <div>
                            <p className="mb-2 text-xs text-muted-foreground">
                              Confusion matrix (rows = true, cols = predicted)
                            </p>
                            <table className="border-collapse text-center font-mono text-xs">
                              <thead>
                                <tr className="text-muted-foreground">
                                  <th className="p-1.5"></th>
                                  {CLASSES.map((c) => <th key={c} className="p-1.5 font-normal">{c}</th>)}
                                </tr>
                              </thead>
                              <tbody>
                                {confusionFor(q).map((row, ri) => (
                                  <tr key={ri}>
                                    <th className="p-1.5 text-right font-normal text-muted-foreground">{CLASSES[ri]}</th>
                                    {row.map((n, ci) => (
                                      <td key={ci} className={`min-w-[2.6rem] border border-border/40 p-2 ${
                                        ri === ci ? "bg-emerald-500/20 font-semibold text-foreground"
                                          : n > 0 ? "bg-red-500/10 text-muted-foreground" : "text-muted-foreground"}`}>
                                        {n}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {!optimal && (
                            <div className="flex max-w-xs items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-muted-foreground">
                              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                              <span>
                                This config lands below the best run. The case-study setup —{" "}
                                <span className="font-mono text-foreground">lr 2e-5 · 3 epochs · batch 8</span> —
                                reaches <span className="text-foreground">87.5% accuracy / 0.84 macro-F1</span>.
                              </span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* training log */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Terminal className="h-4 w-4 text-[#f7931a]" /> Training log
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre ref={logBox}
                         className="h-56 overflow-y-auto rounded-lg border border-border/60 bg-secondary/40 p-3 text-[11px] leading-relaxed text-foreground">
                      {logs.map((line, i) => (
                        <div key={i} className={
                          line.startsWith("  ↳") ? "text-emerald-500"
                            : line.startsWith("$") ? "text-[#f7931a]"
                            : line.startsWith("Test:") ? "font-semibold text-emerald-500" : ""}>
                          {line}
                        </div>
                      ))}
                    </pre>
                  </CardContent>
                </Card>
              </>
            )}
          </section>
        </div>
      </main>
    </>
  );
}

function Segmented({ options, value, onChange, className = "" }) {
  return (
    <div className={`flex rounded-lg bg-secondary/70 p-0.5 ring-1 ring-border/60 ${className}`}>
      {options.map((label, i) => (
        <button key={label} type="button" onClick={() => onChange(i)}
          className={`flex-1 rounded-md px-2 py-1 font-mono text-xs transition ${
            i === value ? "bg-background font-semibold text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"}`}>
          {label}
        </button>
      ))}
    </div>
  );
}

function Chart({ data, lines, yDomain, percent }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="step" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
        <YAxis domain={yDomain} width={44}
               tickFormatter={percent ? (v) => `${Math.round(v * 100)}%` : undefined}
               tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
        <Tooltip
          contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
          labelFormatter={(s) => `step ${s}`}
          formatter={(v) => (percent ? `${(v * 100).toFixed(1)}%` : v)} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {lines.map((l) => (
          <Line key={l.key} type="monotone" dataKey={l.key} name={l.name} stroke={l.color}
                strokeWidth={2} dot={l.dots ? { r: 3 } : false} connectNulls isAnimationActive={false} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

function Metric({ icon: Icon, label, value, good }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{label}</span>
          <Icon className={`h-4 w-4 ${good ? "text-emerald-500" : "text-muted-foreground"}`} />
        </div>
        <div className="mt-2 font-mono text-2xl font-semibold tabular-nums">{value}</div>
      </CardContent>
    </Card>
  );
}
