// "How it works" — an animated, kid-simple walkthrough that follows one
// headline through the whole pipeline, including what happens INSIDE the
// model: news → tokens → numbers (embeddings) → attention → 12 layers →
// summary ([CLS]) → 3-way score → mood → decision → pretend-money test →
// scoreboard. The scoring stages use the real /predict API. Auto-plays.
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Newspaper, Scissors, Binary, Eye, Layers, Focus, Scale, SmilePlus,
  TrafficCone, PiggyBank, Trophy, Play, RotateCcw, ArrowRight, Check,
  Loader2, FastForward,
} from "lucide-react";
import { toast } from "sonner";
import Navbar from "../components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { usePredict } from "../hooks";

const THRESHOLD = 0.1;

const EXAMPLES = [
  { emoji: "😊", tag: "Happy news", text: "Bitcoin surges to a new all-time high on heavy institutional buying." },
  { emoji: "😟", tag: "Sad news", text: "Bitcoin plunges as regulators crack down on crypto exchanges." },
  { emoji: "😐", tag: "Boring news", text: "Bitcoin trades sideways as traders await direction." },
];

// Real numbers from the default 2021–2023 backtest — kept honest.
const SCORE = { robot: 9601, hold: 14352 };

const STEPS = [
  { icon: Newspaper, title: "1 · A news headline arrives",
    caption: "Every day the computer reads crypto news — just like you read the morning headlines." },
  { icon: Scissors, title: "2 · The sentence is cut into word-pieces",
    caption: "Computers can't read whole sentences. They chop them into tiny pieces called tokens." },
  { icon: Binary, title: "3 · Each piece becomes numbers",
    caption: "Computers only understand numbers — so every word-piece turns into a long list of 768 numbers." },
  { icon: Eye, title: "4 · The words look at each other",
    caption: "Every word peeks at the other words to get the full story — “high” means a lot more when “all-time” is right next to it!" },
  { icon: Layers, title: "5 · Twelve thinking layers, one after another",
    caption: "The reading happens 12 times in a row. Each pass understands a little more: letters → words → phrases → meaning." },
  { icon: Focus, title: "6 · Everything squeezes into one summary",
    caption: "All that understanding is squeezed into a single summary thought — like a one-line book report." },
  { icon: Scale, title: "7 · The summary gets three scores",
    caption: "The robot scores the summary three ways: sad, boring, or happy. The biggest score wins!" },
  { icon: SmilePlus, title: "8 · One simple mood number",
    caption: "Happy minus sad gives one number from −1 (very sad) to +1 (very happy)." },
  { icon: TrafficCone, title: "9 · The mood decides: buy or wait",
    caption: "Happy day → keep Bitcoin. Sad day → step aside and keep the money safe. Boring day → same as yesterday." },
  { icon: PiggyBank, title: "10 · We test the idea with pretend money",
    caption: "We replay this rule on 3 years of real Bitcoin prices — with pretend money, so nothing real is ever at risk." },
  { icon: Trophy, title: "11 · The scoreboard",
    caption: "Finally we compare with a friend who just held Bitcoin the whole time. That tells us if the robot really helps." },
];

// per-step auto-play time (ms); index = current step while it plays
const DUR = [1800, 2400, 2800, 3000, 2800, 2400, 2800, 2600, 2400, 2600];

const tokenize = (h) => h.replace(/[.,!?""]/g, "").split(/\s+/).filter(Boolean);

export default function HowItWorks() {
  const [headline, setHeadline] = useState(EXAMPLES[0].text);
  const [phase, setPhase] = useState(-1); // -1 = not started
  const [result, setResult] = useState(null);
  const predict = usePredict();
  const playing = phase >= 0 && phase < STEPS.length - 1;
  const activeRef = useRef(null);

  const start = () => {
    setResult(null);
    setPhase(0);
    predict.mutate(headline, {
      onSuccess: setResult,
      onError: (e) => { toast.error(e.message); setPhase(-1); },
    });
  };

  const reset = () => { setPhase(-1); setResult(null); };
  const skip = () => setPhase(STEPS.length - 1);

  // advance one stage at a time; hold before the scoring stage until the model answered
  useEffect(() => {
    if (phase < 0 || phase >= STEPS.length - 1) return;
    if (phase >= 5 && !result) return; // wait for the real prediction
    const id = setTimeout(() => setPhase((p) => p + 1), DUR[phase] ?? 2400);
    return () => clearTimeout(id);
  }, [phase, result]);

  // keep the active step in view
  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [phase]);

  const score = result?.sentiment ?? 0;
  const decision = score > THRESHOLD ? "buy" : score < -THRESHOLD ? "wait" : "same";

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl space-y-8 px-4 py-10 sm:px-6">
        <header className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight">How it works</h1>
          <p className="mx-auto max-w-xl text-sm text-muted-foreground">
            Follow <span className="text-foreground">one headline</span> through the whole machine —
            even inside the AI's brain. Press play and watch each step light up.
          </p>
        </header>

        {/* pick a headline */}
        <Card>
          <CardContent className="space-y-3 p-5">
            <p className="text-sm font-medium">Step 0 · Pick a headline to send through the machine</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {EXAMPLES.map((ex) => (
                <button key={ex.tag} type="button"
                  onClick={() => { setHeadline(ex.text); reset(); }}
                  className={`rounded-xl border p-3 text-left transition ${
                    headline === ex.text
                      ? "border-[#f7931a]/50 bg-[#f7931a]/10"
                      : "border-border/60 bg-secondary/40 hover:border-border hover:bg-secondary"}`}>
                  <div className="text-2xl">{ex.emoji}</div>
                  <div className="mt-1 text-xs font-medium">{ex.tag}</div>
                  <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{ex.text}</div>
                </button>
              ))}
            </div>
            <Textarea rows={2} value={headline}
                      onChange={(e) => { setHeadline(e.target.value); reset(); }}
                      placeholder="…or write your own headline" className="text-sm" />
            <div className="flex gap-2">
              <Button className="flex-1" onClick={start} disabled={playing || !headline.trim()}>
                {playing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                {playing ? "Playing…" : phase === STEPS.length - 1 ? "Play again" : "Play the journey"}
              </Button>
              {playing && (
                <Button variant="outline" onClick={skip}>
                  <FastForward className="h-4 w-4" /> Skip
                </Button>
              )}
              {phase >= 0 && !playing && (
                <Button variant="outline" onClick={reset}><RotateCcw className="h-4 w-4" /></Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* the journey */}
        <ol className="relative space-y-4">
          <div aria-hidden className="absolute top-4 bottom-4 left-[21px] w-px bg-border/60" />
          {STEPS.map((s, i) => {
            const state = phase < 0 ? "idle" : i < phase ? "done" : i === phase ? "active" : "idle";
            const Icon = s.icon;
            return (
              <li key={s.title} ref={state === "active" ? activeRef : undefined} className="relative pl-12">
                <div className={`absolute top-4 left-0 grid h-11 w-11 place-items-center rounded-full border-2 transition ${
                  state === "active" ? "border-[#f7931a] bg-[#f7931a]/15 text-[#f7931a]"
                    : state === "done" ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-500"
                    : "border-border bg-card text-muted-foreground/50"}`}>
                  {state === "done" ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                </div>

                <motion.div
                  animate={{ opacity: state === "idle" ? 0.45 : 1, scale: state === "active" ? 1 : 0.995 }}
                  transition={{ duration: 0.3 }}>
                  <Card className={state === "active" ? "ring-1 ring-[#f7931a]/50" : ""}>
                    <CardContent className="space-y-3 p-4">
                      <div>
                        <p className="text-sm font-semibold">{s.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{s.caption}</p>
                      </div>
                      <StepVisual i={i} state={state} headline={headline} result={result}
                                  score={score} decision={decision} />
                    </CardContent>
                  </Card>
                </motion.div>
              </li>
            );
          })}
        </ol>

        {/* CTA after the journey */}
        <AnimatePresence>
          {phase === STEPS.length - 1 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="flex flex-wrap items-center gap-3 rounded-xl border border-border/60 bg-card p-5">
              <div className="flex-1">
                <p className="text-sm font-medium">Now you know the whole machine 🎉</p>
                <p className="text-xs text-muted-foreground">Try driving it yourself on the dashboard.</p>
              </div>
              <Button nativeButton={false} render={<Link to="/" />}>
                Open dashboard <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </>
  );
}

/* ---------- per-step visuals ---------- */

function StepVisual({ i, state, headline, result, score, decision }) {
  const show = state !== "idle"; // animate once reached, persist after
  switch (i) {
    case 0: return <NewsVisual show={show} headline={headline} />;
    case 1: return <TokenVisual show={show} headline={headline} />;
    case 2: return <EmbedVisual show={show} headline={headline} />;
    case 3: return <AttentionVisual show={show} headline={headline} />;
    case 4: return <LayersVisual show={show} active={state === "active"} />;
    case 5: return <ClsVisual show={show} headline={headline} />;
    case 6: return <ProbsVisual show={show} result={result} />;
    case 7: return <MoodVisual show={show} result={result} score={score} />;
    case 8: return <LightVisual show={show} decision={decision} />;
    case 9: return <PiggyVisual show={show} />;
    case 10: return <ScoreboardVisual show={show} />;
    default: return null;
  }
}

function NewsVisual({ show, headline }) {
  if (!show) return <Placeholder />;
  return (
    <motion.div initial={{ x: -24, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                className="rounded-lg border border-border/60 bg-secondary/40 p-3">
      <p className="text-[10px] tracking-widest text-muted-foreground uppercase">📰 Today's crypto news</p>
      <p className="mt-1 text-sm font-medium">“{headline}”</p>
    </motion.div>
  );
}

function TokenVisual({ show, headline }) {
  if (!show) return <Placeholder />;
  const tokens = tokenize(headline).slice(0, 14);
  return (
    <div className="flex flex-wrap gap-1.5">
      {tokens.map((t, i) => (
        <motion.span key={`${t}${i}`}
          initial={{ opacity: 0, y: 8, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: i * 0.12 }}
          className="rounded-md border border-[#f7931a]/30 bg-[#f7931a]/10 px-2 py-1 font-mono text-xs">
          {t.toLowerCase()}
        </motion.span>
      ))}
    </div>
  );
}

// token → a strip of colored "number" cells (a tiny embedding vector)
function EmbedVisual({ show, headline }) {
  if (!show) return <Placeholder />;
  const tokens = tokenize(headline).slice(0, 4);
  const hue = (t, j) => (t.charCodeAt(j % t.length) * 7 + j * 53) % 360;
  return (
    <div className="space-y-1.5">
      {tokens.map((t, i) => (
        <div key={`${t}${i}`} className="flex items-center gap-2">
          <span className="w-20 truncate rounded-md border border-[#f7931a]/30 bg-[#f7931a]/10 px-2 py-1 text-center font-mono text-xs">
            {t.toLowerCase()}
          </span>
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.25 }}
                       className="text-xs text-muted-foreground">→</motion.span>
          <div className="flex gap-0.5">
            {Array.from({ length: 12 }).map((_, j) => (
              <motion.span key={j}
                initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.25 + j * 0.04 }}
                className="h-4 w-2.5 rounded-[3px]"
                style={{ backgroundColor: `hsl(${hue(t, j)} 65% 55% / 0.85)` }} />
            ))}
          </div>
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.25 + 0.6 }}
                       className="text-[10px] text-muted-foreground">…768 numbers</motion.span>
        </div>
      ))}
    </div>
  );
}

// arcs between tokens = words paying attention to each other
function AttentionVisual({ show, headline }) {
  if (!show) return <Placeholder />;
  const tokens = tokenize(headline).slice(0, 6).map((t) => t.toLowerCase());
  const n = tokens.length;
  const W = 340, H = 86, yBase = 64;
  const x = (i) => 28 + (i * (W - 56)) / Math.max(1, n - 1);
  // deterministic pairs: neighbours + a couple of long-range "story" links
  const pairs = [];
  for (let i = 0; i + 1 < n; i++) pairs.push([i, i + 1, 0.25]);
  if (n > 2) pairs.push([0, n - 1, 0.9]);            // strongest: subject ↔ last word
  if (n > 3) pairs.push([1, n - 2, 0.55]);
  if (n > 4) pairs.push([0, 2, 0.4]);
  const strongest = Math.max(...pairs.map((p) => p[2]));
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {pairs.map(([a, b, w], k) => {
          const isMax = w === strongest;
          const lift = Math.min(46, (x(b) - x(a)) * 0.3 + 10);
          return (
            <motion.path key={k}
              d={`M ${x(a)} ${yBase - 10} Q ${(x(a) + x(b)) / 2} ${yBase - 10 - lift} ${x(b)} ${yBase - 10}`}
              fill="none"
              stroke={isMax ? "#f7931a" : "currentColor"}
              strokeOpacity={isMax ? 0.95 : 0.25}
              strokeWidth={isMax ? 2.2 : 1.2}
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
              transition={{ delay: 0.3 + k * 0.18, duration: 0.5 }} />
          );
        })}
        {tokens.map((t, i) => (
          <text key={i} x={x(i)} y={yBase + 6} textAnchor="middle"
                fontSize="9.5" fontFamily="ui-monospace, monospace"
                fill="currentColor" opacity="0.85">
            {t.length > 9 ? t.slice(0, 8) + "…" : t}
          </text>
        ))}
      </svg>
      <figcaption className="text-center text-[10px] text-muted-foreground">
        <span className="text-[#f7931a]">orange arc</span> = the strongest “look” between two words
      </figcaption>
    </figure>
  );
}

// 12 encoder layers filling up one by one
function LayersVisual({ show }) {
  if (!show) return <Placeholder />;
  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="relative h-9 flex-1 overflow-hidden rounded-md border border-border/60 bg-secondary/40">
            <motion.div className="absolute inset-0 bg-[#f7931a]/70"
              initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
              style={{ originY: 1 }}
              transition={{ delay: 0.2 + i * 0.16, duration: 0.3 }} />
            <span className="absolute inset-0 grid place-items-center text-[9px] font-semibold text-foreground">
              {i + 1}
            </span>
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>“sees letters”</span><span>understanding grows →</span><span>“gets the meaning”</span>
      </div>
    </div>
  );
}

// all token squares funnel into one glowing summary chip ([CLS])
function ClsVisual({ show, headline }) {
  if (!show) return <Placeholder />;
  const tokens = tokenize(headline).slice(0, 5);
  const n = tokens.length;
  const W = 340, H = 96;
  const ty = (i) => 14 + (i * (H - 28)) / Math.max(1, n - 1);
  const tx = 64, sx = 268, sy = H / 2;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      {tokens.map((t, i) => (
        <g key={i}>
          <motion.line x1={tx + 6} y1={ty(i)} x2={sx - 26} y2={sy}
            stroke="currentColor" strokeOpacity="0.3" strokeWidth="1.2"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
            transition={{ delay: 0.2 + i * 0.15, duration: 0.5 }} />
          <motion.text x={tx} y={ty(i) + 3} textAnchor="end" fontSize="9.5"
            fontFamily="ui-monospace, monospace" fill="currentColor" opacity="0.8"
            initial={{ opacity: 0 }} animate={{ opacity: 0.8 }} transition={{ delay: i * 0.1 }}>
            {t.toLowerCase().slice(0, 10)}
          </motion.text>
        </g>
      ))}
      <motion.circle cx={sx} cy={sy} r="20" fill="#f7931a" fillOpacity="0.18"
        stroke="#f7931a" strokeWidth="1.6"
        initial={{ scale: 0 }} animate={{ scale: [0, 1.15, 1] }}
        transition={{ delay: 0.2 + n * 0.15 + 0.3, duration: 0.5 }} />
      <motion.text x={sx} y={sy + 4} textAnchor="middle" fontSize="14"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ delay: 0.2 + n * 0.15 + 0.6 }}>
        ⭐
      </motion.text>
      <motion.text x={sx} y={sy + 34} textAnchor="middle" fontSize="9"
        fill="currentColor" opacity="0.7"
        initial={{ opacity: 0 }} animate={{ opacity: 0.7 }}
        transition={{ delay: 0.2 + n * 0.15 + 0.6 }}>
        the summary
      </motion.text>
    </svg>
  );
}

// classifier head: three real probabilities, biggest one wins
function ProbsVisual({ show, result }) {
  if (!show || !result) return <Placeholder text={show ? "waiting for the robot…" : undefined} />;
  const rows = [
    { key: "p_negative", face: "😟", label: "sad", color: "bg-rose-500" },
    { key: "p_neutral", face: "😐", label: "boring", color: "bg-zinc-500" },
    { key: "p_positive", face: "😊", label: "happy", color: "bg-emerald-500" },
  ];
  const winner = rows.reduce((a, b) => (result[a.key] >= result[b.key] ? a : b));
  return (
    <div className="space-y-1.5">
      {rows.map((r, i) => {
        const p = result[r.key];
        const isWin = r === winner;
        return (
          <div key={r.key}
               className={`grid grid-cols-[88px_1fr_70px] items-center gap-2 rounded-md px-1.5 py-1 text-xs ${
                 isWin ? "bg-secondary/60 ring-1 ring-[#f7931a]/40" : ""}`}>
            <span className={isWin ? "font-medium text-foreground" : "text-muted-foreground"}>
              {r.face} {r.label}
            </span>
            <div className="h-2.5 overflow-hidden rounded bg-secondary">
              <motion.div className={`h-full ${r.color}`}
                initial={{ width: 0 }} animate={{ width: `${p * 100}%` }}
                transition={{ delay: 0.3 + i * 0.2, duration: 0.6 }} />
            </div>
            <span className="text-right font-mono tabular-nums text-muted-foreground">
              {(p * 100).toFixed(0)}%{isWin && " 🏅"}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function MoodVisual({ show, result, score }) {
  if (!show || !result) return <Placeholder text={show ? "waiting for the robot…" : undefined} />;
  const face = result.label === "positive" ? "😊" : result.label === "negative" ? "😟" : "😐";
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-center gap-5 text-3xl">
        {["😟", "😐", "😊"].map((f) => (
          <motion.span key={f} animate={{ scale: f === face ? 1.5 : 0.9, opacity: f === face ? 1 : 0.35 }}
                       transition={{ type: "spring", stiffness: 260, damping: 16 }}>
            {f}
          </motion.span>
        ))}
      </div>
      <div className="space-y-1">
        <div className="relative h-2.5 rounded-full bg-gradient-to-r from-rose-500 via-zinc-500 to-emerald-500 opacity-90">
          <motion.div className="absolute -top-1 w-1.5 -translate-x-1/2 rounded-full bg-foreground shadow"
                      style={{ height: 18 }}
                      initial={{ left: "50%" }} animate={{ left: `${((score + 1) / 2) * 100}%` }}
                      transition={{ type: "spring", stiffness: 180, damping: 20 }} />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>−1 very sad</span>
          <span className="font-mono text-foreground">score {score >= 0 ? "+" : ""}{score.toFixed(2)}</span>
          <span>+1 very happy</span>
        </div>
      </div>
    </div>
  );
}

function LightVisual({ show, decision }) {
  if (!show) return <Placeholder />;
  const lights = [
    { key: "wait", color: "bg-rose-500", label: "Sad news → step aside (keep money safe)" },
    { key: "same", color: "bg-amber-400", label: "Boring news → same as yesterday" },
    { key: "buy", color: "bg-emerald-500", label: "Happy news → keep holding Bitcoin" },
  ];
  return (
    <div className="flex items-center gap-4">
      <div className="flex flex-col gap-1.5 rounded-xl border border-border/60 bg-secondary/40 p-2">
        {lights.map((l) => (
          <motion.span key={l.key}
            animate={{ opacity: decision === l.key ? 1 : 0.18, scale: decision === l.key ? 1.15 : 1 }}
            transition={{ type: "spring", stiffness: 240, damping: 18 }}
            className={`h-5 w-5 rounded-full ${l.color} ${decision === l.key ? "shadow-[0_0_12px_2px_rgba(255,255,255,0.15)]" : ""}`} />
        ))}
      </div>
      <div className="space-y-1 text-xs">
        {lights.map((l) => (
          <p key={l.key} className={decision === l.key ? "font-medium text-foreground" : "text-muted-foreground/50"}>
            {l.label}
          </p>
        ))}
      </div>
    </div>
  );
}

function PiggyVisual({ show }) {
  if (!show) return <Placeholder />;
  return (
    <div className="space-y-2">
      <svg viewBox="0 0 300 70" className="h-20 w-full">
        <motion.polyline
          points="0,40 30,30 60,45 90,25 120,35 150,52 180,48 210,42 240,38 270,30 300,26"
          fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.8 }} />
        <motion.text x="6" y="14" fontSize="11" fill="currentColor" opacity="0.6"
                     initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} transition={{ delay: 0.4 }}>
          🐷 pretend money over 3 years of real prices
        </motion.text>
      </svg>
      <p className="text-center text-xs text-muted-foreground">
        Buy on green days, sit out on red days — day after day, for 2021–2023. No real money, ever.
      </p>
    </div>
  );
}

function ScoreboardVisual({ show }) {
  if (!show) return <Placeholder />;
  const max = Math.max(SCORE.robot, SCORE.hold);
  const rows = [
    { label: "🤖 Robot strategy", value: SCORE.robot, color: "bg-emerald-500" },
    { label: "🪨 Friend who just held", value: SCORE.hold, color: "bg-zinc-500" },
  ];
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {rows.map((r, i) => (
          <div key={r.label} className="space-y-0.5">
            <div className="flex justify-between text-xs">
              <span>{r.label}</span>
              <span className="font-mono tabular-nums">${r.value.toLocaleString()}</span>
            </div>
            <div className="h-3 overflow-hidden rounded bg-secondary">
              <motion.div className={`h-full rounded ${r.color}`}
                initial={{ width: 0 }} animate={{ width: `${(r.value / max) * 100}%` }}
                transition={{ duration: 1, delay: 0.3 + i * 0.3 }} />
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Both started with <span className="font-mono">$10,000</span>. This time the friend who just
        held won — and that's an <span className="text-foreground">honest answer</span>: the robot
        avoided some scary drops, but missed some happy jumps. Science means reporting what really
        happened, not what we hoped!
      </p>
    </div>
  );
}

function Placeholder({ text }) {
  return (
    <div className="grid h-12 place-items-center rounded-lg border border-dashed border-border/60 text-xs text-muted-foreground/50">
      {text ?? "…"}
    </div>
  );
}
