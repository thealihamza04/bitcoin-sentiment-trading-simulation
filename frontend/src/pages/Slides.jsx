import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, Bitcoin, Newspaper, Brain, BarChart2,
  TrendingUp, Trophy, Cpu, Plug, Monitor, Database, LineChart,
  ArrowRight, Server, Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "../components/Navbar";

const O = "#f7931a"; // brand orange

// ── inline SVG visuals ────────────────────────────────────────────────────────

function PipelineVisual() {
  const steps = [
    { label: "Headlines", Icon: Newspaper },
    { label: "FinBERT",   Icon: Brain },
    { label: "Signal",    Icon: BarChart2 },
    { label: "Backtest",  Icon: TrendingUp },
    { label: "Result",    Icon: Trophy },
  ];
  return (
    <div className="flex items-center justify-center gap-1 flex-wrap">
      {steps.map((s, i) => (
        <div key={i} className="flex items-center gap-1">
          <div className="flex flex-col items-center gap-2 rounded-xl border border-border/60 bg-secondary/40 px-4 py-3 text-center w-24">
            <s.Icon className="h-6 w-6 text-[#f7931a]" />
            <span className="text-xs font-semibold text-foreground leading-tight">{s.label}</span>
          </div>
          {i < steps.length - 1 && (
            <ArrowRight className="h-4 w-4 text-[#f7931a] shrink-0" />
          )}
        </div>
      ))}
    </div>
  );
}

function BertVisual() {
  return (
    <svg viewBox="0 0 500 90" className="w-full h-auto">
      {/* left-to-right arrow */}
      <rect x="10" y="30" width="220" height="36" rx="8" fill="#f7931a" fillOpacity="0.1" stroke="#f7931a" strokeOpacity="0.5" strokeWidth="1.2"/>
      <text x="120" y="44" textAnchor="middle" fontSize="11" fontWeight="600" fill="currentColor">Left-to-right model</text>
      <text x="120" y="58" textAnchor="middle" fontSize="9" fill="currentColor" opacity="0.5">reads one direction only</text>
      <line x1="230" y1="48" x2="260" y2="48" stroke="#f7931a" strokeWidth="1.5" markerEnd="url(#arr)"/>

      {/* BERT box */}
      <rect x="265" y="20" width="220" height="56" rx="8" fill="#f7931a" fillOpacity="0.15" stroke="#f7931a" strokeWidth="1.5"/>
      <text x="375" y="42" textAnchor="middle" fontSize="12" fontWeight="700" fill={O}>BERT — Bidirectional</text>
      <text x="375" y="57" textAnchor="middle" fontSize="9" fill="currentColor" opacity="0.6">reads entire sentence ← both directions →</text>
      <text x="375" y="70" textAnchor="middle" fontSize="9" fill="currentColor" opacity="0.6">context understood fully</text>

      <defs>
        <marker id="arr" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0,0 L5,3 L0,6" fill="none" stroke={O} strokeWidth="1.2"/>
        </marker>
      </defs>
    </svg>
  );
}

function FinBERTChainVisual() {
  const boxes = [
    { label: "BERT", sub: "Wikipedia + BooksCorpus\ngeneral English", color: false },
    { label: "FinBERT", sub: "Reuters · Earnings calls\nSEC filings (~4.9B tokens)", color: false },
    { label: "Our Model", sub: "Financial PhraseBank\nneg / neu / pos", color: true },
  ];
  return (
    <div className="flex items-center justify-center gap-2 flex-wrap">
      {boxes.map((b, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={`rounded-xl border px-4 py-3 text-center w-36 ${b.color ? "border-[#f7931a] bg-[#f7931a]/10" : "border-border/60 bg-secondary/40"}`}>
            <p className={`text-sm font-bold ${b.color ? "text-[#f7931a]" : "text-foreground"}`}>{b.label}</p>
            {b.sub.split("\n").map((line, j) => (
              <p key={j} className="text-[10px] text-muted-foreground leading-tight">{line}</p>
            ))}
          </div>
          {i < boxes.length - 1 && <span className="text-[#f7931a] font-bold text-lg">→</span>}
        </div>
      ))}
    </div>
  );
}

function InferenceVisual() {
  const steps = [
    { label: "Raw Text", val: '"Bitcoin crashes 20%"' },
    { label: "Tokens", val: "[CLS] bit ##coin crashes [SEP]" },
    { label: "Logits", val: "[-1.2,  0.3,  2.1]" },
    { label: "Softmax", val: "[0.04, 0.11, 0.85]" },
    { label: "Score", val: "0.85 − 0.04 = +0.81" },
  ];
  return (
    <div className="flex flex-col items-center gap-1">
      {steps.map((s, i) => (
        <div key={i} className="flex flex-col items-center gap-1 w-full max-w-sm">
          <div className="w-full rounded-lg border border-border/60 bg-secondary/40 px-4 py-2 flex justify-between items-center">
            <span className="text-xs text-muted-foreground w-20">{s.label}</span>
            <span className="text-xs font-mono text-foreground">{s.val}</span>
          </div>
          {i < steps.length - 1 && <span className="text-[#f7931a] text-sm">↓</span>}
        </div>
      ))}
    </div>
  );
}

function SignalVisual() {
  const days = [
    { day: "Mon", score: 0.6, pos: "BUY", color: "bg-green-500/20 border-green-500/40 text-green-400" },
    { day: "Tue", score: 0.05, pos: "HOLD", color: "bg-border/30 border-border/60 text-muted-foreground" },
    { day: "Wed", score: -0.4, pos: "SELL", color: "bg-red-500/20 border-red-500/40 text-red-400" },
    { day: "Thu", score: -0.08, pos: "HOLD", color: "bg-border/30 border-border/60 text-muted-foreground" },
    { day: "Fri", score: 0.5, pos: "BUY", color: "bg-green-500/20 border-green-500/40 text-green-400" },
  ];
  return (
    <div className="flex items-end justify-center gap-3">
      {days.map((d, i) => (
        <div key={i} className="flex flex-col items-center gap-1">
          <span className="text-[10px] font-mono text-muted-foreground">{d.score > 0 ? "+" : ""}{d.score}</span>
          <div
            className="w-10 rounded-t"
            style={{
              height: `${Math.abs(d.score) * 60 + 10}px`,
              background: d.score > 0.1 ? "#22c55e33" : d.score < -0.1 ? "#ef444433" : "#ffffff11",
              borderLeft: `2px solid ${d.score > 0.1 ? "#22c55e" : d.score < -0.1 ? "#ef4444" : "#ffffff33"}`,
            }}
          />
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${d.color}`}>{d.pos}</span>
          <span className="text-[10px] text-muted-foreground">{d.day}</span>
        </div>
      ))}
    </div>
  );
}

function ModelSizeVisual() {
  const files = [
    { name: "model.safetensors", size: "438 MB", pct: 98, main: true },
    { name: "tokenizer.json",    size: "700 KB", pct: 2,  main: false },
    { name: "config.json",       size: "~1 KB",  pct: 0.1,main: false },
  ];
  return (
    <div className="space-y-2 w-full max-w-sm mx-auto">
      {files.map((f, i) => (
        <div key={i} className="space-y-0.5">
          <div className="flex justify-between text-xs">
            <span className={f.main ? "text-[#f7931a] font-medium" : "text-muted-foreground"}>{f.name}</span>
            <span className="text-foreground font-mono">{f.size}</span>
          </div>
          <div className="h-2 w-full rounded-full bg-secondary/60">
            <div
              className="h-2 rounded-full"
              style={{ width: `${Math.max(f.pct, 1)}%`, background: f.main ? O : "#ffffff22" }}
            />
          </div>
        </div>
      ))}
      <p className="text-center text-xs text-muted-foreground pt-1">110M parameters × 4 bytes = ~440 MB</p>
    </div>
  );
}

function EquityVisual() {
  // simplified equity curve points
  const strategy = [100,118,142,95,72,68,90,115,130,154];
  const bnh      = [100,122,148,90,65,60,85,108,128,144];
  const W = 340, H = 100, pad = 10;
  const toX = (i) => pad + (i / (strategy.length - 1)) * (W - pad * 2);
  const toY = (v) => H - pad - ((v - 55) / (160 - 55)) * (H - pad * 2);
  const pathD = (arr) => arr.map((v, i) => `${i === 0 ? "M" : "L"}${toX(i)},${toY(v)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto rounded-lg border border-border/60 bg-secondary/20">
      <path d={pathD(bnh)} fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeDasharray="4 3"/>
      <path d={pathD(strategy)} fill="none" stroke={O} strokeWidth="2"/>
      <text x={W - 12} y={toY(strategy[strategy.length-1]) - 4} textAnchor="end" fontSize="8" fill={O} fontWeight="600">Strategy $154</text>
      <text x={W - 12} y={toY(bnh[bnh.length-1]) + 10} textAnchor="end" fontSize="8" fill="#9ca3af">B&H $144</text>
      <text x={pad} y={H - 2} fontSize="7" fill="currentColor" opacity="0.4">2021</text>
      <text x={W/2} y={H - 2} textAnchor="middle" fontSize="7" fill="currentColor" opacity="0.4">2022</text>
      <text x={W - pad} y={H - 2} textAnchor="end" fontSize="7" fill="currentColor" opacity="0.4">2023</text>
    </svg>
  );
}

function ArchVisual() {
  const boxes = [
    { label: "Google Colab", sub: "Train · Tesla T4 GPU", Icon: Cpu },
    { label: "FastAPI",       sub: "/predict · /simulate", Icon: Server },
    { label: "React Dashboard", sub: "Charts · Controls",  Icon: Monitor },
  ];
  const connectors = ["model files", "JSON / HTTP"];
  return (
    <div className="flex items-center justify-center gap-2 flex-wrap">
      {boxes.map((b, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="flex flex-col items-center gap-2 rounded-xl border border-[#f7931a]/40 bg-[#f7931a]/5 px-4 py-3 text-center w-32">
            <b.Icon className="h-7 w-7 text-[#f7931a]" />
            <p className="text-xs font-bold text-foreground">{b.label}</p>
            <p className="text-[10px] text-muted-foreground">{b.sub}</p>
          </div>
          {i < boxes.length - 1 && (
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[9px] text-muted-foreground">{connectors[i]}</span>
              <ArrowRight className="h-4 w-4 text-[#f7931a]" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function DataVisual() {
  const sources = [
    { Icon: Newspaper, label: "HuggingFace", sub: "~14,000 headlines · 2021–2023", arrow: "crypto_text.parquet" },
    { Icon: TrendingUp, label: "yfinance",   sub: "BTC-USD daily · ~1,095 rows",   arrow: "btc_prices.parquet" },
    { Icon: Brain,      label: "FinBERT",    sub: "scores each headline once",      arrow: "sentiment.parquet" },
  ];
  return (
    <div className="flex flex-col gap-2 w-full max-w-md mx-auto">
      {sources.map((s, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-secondary/40 px-3 py-2 w-48">
            <s.Icon className="h-5 w-5 text-[#f7931a] shrink-0" />
            <div>
              <p className="text-xs font-semibold text-foreground">{s.label}</p>
              <p className="text-[10px] text-muted-foreground">{s.sub}</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-[#f7931a] shrink-0" />
          <div className="rounded-lg border border-[#f7931a]/40 bg-[#f7931a]/5 px-3 py-1.5">
            <p className="text-[10px] font-mono text-[#f7931a]">{s.arrow}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── slide data ────────────────────────────────────────────────────────────────

const SLIDES = [
  {
    type: "hero",
    tag: "Term Project · Simulation & Modeling",
    title: "Bitcoin Sentiment Trading Simulation",
    subtitle: "Can reading the news beat just holding Bitcoin?",
    points: [],
  },
  {
    tag: "01 · Project Overview",
    title: "High-Level Overview",
    visual: "pipeline",
    points: [],
  },
  {
    tag: "02 · BERT",
    title: "What is BERT?",
    visual: "bert",
    points: [
      "Bidirectional Encoder Representations from Transformers — Google, 2018",
      "Reads entire sentence at once, both directions simultaneously",
      "Pre-trained on Wikipedia + BookCorpus (~3.3B words)",
      "Output: 768-dimensional vector representing sentence meaning",
    ],
  },
  {
    tag: "02 · BERT",
    title: "Problem with General BERT on Finance",
    table: {
      headers: ["Sentence", "General meaning", "Financial meaning"],
      rows: [
        ['"Earnings beat expectations"', "vague", "Positive — stock rises"],
        ['"Company is underwater"',      "literal water", "Negative — insolvent"],
        ['"Shares fell off a cliff"',    "geography", "Negative — price crash"],
        ['"Heavy selling"',              "neutral-ish", "Negative — bearish"],
      ],
    },
    points: ["BERT trained on Wikipedia never learned these financial patterns"],
  },
  {
    tag: "03 · FinBERT",
    title: "BERT → FinBERT → Our Model",
    visual: "finbert-chain",
    points: [],
  },
  {
    tag: "04 · Fine-Tuning",
    title: "Fine-Tuning Setup",
    points: [
      "Platform: Google Colab — Tesla T4 GPU enabled",
      "Dataset: Financial PhraseBank (~4,840 labeled sentences)",
      "3 classes: negative · neutral · positive",
      "Split: 70% train · 15% val · 15% test (stratified)",
      "Class-weighted loss — negative is only 12% of data",
      "3 epochs · batch 16 · lr 2e-5 · AdamW optimizer",
    ],
    code: `base model   ProsusAI/finbert   hardware  Google Colab · Tesla T4 GPU
epochs       3                  seed      42
batch size   16 (train)         lr        2e-5  ·  AdamW  ·  wd 0.01
max length   64 tokens          warmup    10% of steps`,
  },
  {
    tag: "05 · Metrics",
    title: "Model Evaluation (Test Set — 465 sentences)",
    visual: "none",
    points: [
      "Accuracy: 87.5% — overall correct predictions out of 465",
      "Precision (macro): 0.84 — how trustworthy the model's claims are",
      "Recall (macro): 0.85 — how many actual cases the model found",
      "F1 Score (macro): 0.84 — balance of precision and recall",
      "Test Loss: 0.36",
    ],
  },
  {
    tag: "06 · Inference",
    title: "How Inference Works",
    visual: "inference",
    points: [],
  },
  {
    tag: "07 · Signal",
    title: "Sentiment → Trading Signal",
    visual: "signal",
    points: [],
  },
  {
    tag: "08 · Data",
    title: "Datasets Used",
    visual: "data",
    points: [],
  },
  {
    tag: "09 · Model Export",
    title: "Model Size at Export",
    visual: "modelsize",
    points: [],
  },
  {
    tag: "10 · Tech Stack",
    title: "Technology Stack",
    table: {
      headers: ["Layer", "Technology"],
      rows: [
        ["Training",   "Google Colab · Tesla T4 GPU · PyTorch · HuggingFace Transformers"],
        ["Backend",    "FastAPI · Python 3.12 · pandas · yfinance · NumPy"],
        ["Frontend",   "React + Vite · Tailwind v4 · shadcn/ui · Framer Motion"],
        ["Charts",     "Recharts · TradingView lightweight-charts"],
        ["Data layer", "TanStack Query · parquet cache · HuggingFace Datasets"],
      ],
    },
    points: [],
  },
  {
    tag: "11 · Backend",
    title: "FastAPI Endpoints",
    table: {
      headers: ["Method", "Endpoint", "Description"],
      rows: [
        ["GET",  "/",         "Health check — model_loaded status"],
        ["POST", "/predict",  "Headline text → label + probabilities + score"],
        ["GET",  "/prices",   "BTC-USD daily price history"],
        ["GET",  "/simulate", "Full backtest → metrics + equity curve"],
      ],
    },
    points: [
      "Sentiment cached in memory + disk → /simulate returns in ~0.2s",
      "Interactive API docs at http://localhost:8000/docs",
    ],
  },
  {
    tag: "11 · Backend",
    title: "Simulate Parameters",
    table: {
      headers: ["Parameter", "Default", "Effect"],
      rows: [
        ["threshold",            "0.10",  "Min signal strength to trigger trade"],
        ["smoothing_window",     "5 days","Rolling average to reduce noise"],
        ["allow_short",          "false", "Enable shorting when sentiment negative"],
        ["initial_capital",      "$10k",  "Starting balance"],
        ["transaction_cost_bps", "10 bps","Fee charged on every position change"],
      ],
    },
    points: [],
  },
  {
    tag: "12 · Architecture",
    title: "3-Tier System Architecture",
    visual: "arch",
    points: [],
  },
  {
    tag: "13 · Results",
    title: "Backtest Results (2021–2023)",
    visual: "equity",
    table: {
      headers: ["Metric", "Strategy", "Buy & Hold"],
      rows: [
        ["Total Return", "+53.6%", "+43.5%"],
        ["Sharpe Ratio", "0.54",   "0.51"],
        ["Max Drawdown", "−71.4%", "−76.6%"],
      ],
    },
    points: ["Strategy beat buy & hold by 10.2 percentage points"],
  },
  {
    tag: "13 · Results",
    title: "Parameter Sensitivity",
    table: {
      headers: ["Threshold", "Trades", "Return", "Verdict"],
      rows: [
        ["0.05", "49", "−8.9%",  "Overtrading — costs kill it"],
        ["0.10", "19", "−3.1%",  "Too noisy"],
        ["0.15", "3",  "+35.2%", "Sweet spot"],
        ["0.30", "1",  "+23.0%", "Too conservative"],
      ],
    },
    points: [
      "Transaction costs are the most damaging factor",
      "Fewer high-confidence trades consistently outperform",
    ],
  },
  {
    type: "end",
    tag: "Thank You",
    title: "Questions?",
    subtitle: "Bitcoin Sentiment Trading Simulation · Simulation & Modeling",
    points: [],
  },
];

// ── visual map ────────────────────────────────────────────────────────────────

function SlideVisual({ name }) {
  if (name === "pipeline")     return <PipelineVisual />;
  if (name === "bert")         return <BertVisual />;
  if (name === "finbert-chain")return <FinBERTChainVisual />;
  if (name === "inference")    return <InferenceVisual />;
  if (name === "signal")       return <SignalVisual />;
  if (name === "data")         return <DataVisual />;
  if (name === "modelsize")    return <ModelSizeVisual />;
  if (name === "arch")         return <ArchVisual />;
  if (name === "equity")       return <EquityVisual />;
  return null;
}

// ── animation ─────────────────────────────────────────────────────────────────

const variants = {
  enter:  (dir) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:   (dir) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

// ── page ──────────────────────────────────────────────────────────────────────

export default function Slides() {
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState(1);

  const go = (next) => { setDir(next > idx ? 1 : -1); setIdx(next); };
  const prev = () => idx > 0 && go(idx - 1);
  const next = () => idx < SLIDES.length - 1 && go(idx + 1);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") next();
      if (e.key === "ArrowLeft"  || e.key === "ArrowUp")   prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [idx]);

  const slide = SLIDES[idx];

  return (
    <>
      <Navbar />
      <div className="flex h-[calc(100vh-57px)] flex-col">
        {/* slide */}
        <div className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-4">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={idx}
              custom={dir}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: "easeInOut" }}
              className="w-full max-w-3xl overflow-y-auto max-h-[calc(100vh-140px)]"
            >
              {slide.type === "hero" ? <HeroSlide slide={slide} />
               : slide.type === "end" ? <EndSlide slide={slide} />
               : <ContentSlide slide={slide} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* bottom bar */}
        <div className="flex items-center justify-between border-t border-border/60 bg-background/80 px-6 py-3 backdrop-blur shrink-0">
          <Button variant="outline" size="sm" onClick={prev} disabled={idx === 0}>
            <ChevronLeft className="h-4 w-4" /> Prev
          </Button>
          <div className="flex items-center gap-1">
            {SLIDES.map((_, i) => (
              <button key={i} onClick={() => go(i)}
                className={`h-1.5 rounded-full transition-all ${i === idx ? "w-5 bg-[#f7931a]" : "w-1.5 bg-border hover:bg-muted-foreground"}`}
              />
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={next} disabled={idx === SLIDES.length - 1}>
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );
}

// ── slide templates ───────────────────────────────────────────────────────────

function HeroSlide({ slide }) {
  return (
    <div className="space-y-6 text-center py-8">
      <div className="mx-auto grid h-20 w-20 place-items-center rounded-2xl bg-[#f7931a]/10 border border-[#f7931a]/30">
        <Bitcoin className="h-11 w-11 text-[#f7931a]" />
      </div>
      <div className="space-y-3">
        <p className="text-xs font-medium tracking-widest text-[#f7931a] uppercase">{slide.tag}</p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{slide.title}</h1>
        <p className="text-lg text-muted-foreground">{slide.subtitle}</p>
      </div>
      <p className="text-xs text-muted-foreground">← → arrow keys or buttons to navigate</p>
    </div>
  );
}

function EndSlide({ slide }) {
  return (
    <div className="space-y-6 text-center py-8">
      <div className="mx-auto grid h-20 w-20 place-items-center rounded-2xl bg-[#f7931a]/10 border border-[#f7931a]/30">
        <Bitcoin className="h-11 w-11 text-[#f7931a]" />
      </div>
      <div className="space-y-2">
        <p className="text-xs font-medium tracking-widest text-[#f7931a] uppercase">{slide.tag}</p>
        <h1 className="text-3xl font-bold tracking-tight">{slide.title}</h1>
        <p className="text-muted-foreground">{slide.subtitle}</p>
      </div>
    </div>
  );
}

function ContentSlide({ slide }) {
  return (
    <div className="space-y-4">
      {/* header */}
      <div className="space-y-0.5">
        <p className="text-xs font-medium tracking-widest text-[#f7931a] uppercase">{slide.tag}</p>
        <h2 className="text-2xl font-bold tracking-tight">{slide.title}</h2>
      </div>

      {/* visual */}
      {slide.visual && slide.visual !== "none" && (
        <div className="py-1">
          <SlideVisual name={slide.visual} />
        </div>
      )}

      {/* code block */}
      {slide.code && (
        <pre className="overflow-x-auto rounded-lg border border-border/60 bg-secondary/40 p-3 text-xs leading-relaxed text-foreground">
          <code>{slide.code}</code>
        </pre>
      )}

      {/* table */}
      {slide.table && (
        <div className="overflow-x-auto rounded-lg border border-border/60">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-border/60 bg-secondary/40">
                {slide.table.headers.map((h) => (
                  <th key={h} className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {slide.table.rows.map((row, i) => (
                <tr key={i} className={`border-b border-border/40 ${i === slide.table.rows.length - 1 ? "font-semibold text-foreground" : ""}`}>
                  {row.map((cell, j) => (
                    <td key={j} className="px-3 py-2 font-mono text-xs">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* bullet points */}
      {slide.points?.length > 0 && (
        <ul className="space-y-2">
          {slide.points.map((p, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#f7931a]" />
              <span className="text-sm leading-relaxed text-muted-foreground">{p}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
