// A detailed case study: background → data → model → signal → backtest →
// results → architecture → challenges → limitations → future work.
// Long-read niceties: a reading-progress bar and a sticky "on this page" TOC
// with scroll-tracked highlighting (xl screens).
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll } from "framer-motion";
import {
  Target, Workflow, Database, Brain, Signal, LineChart, Layers, Wrench,
  AlertTriangle, Rocket, Lightbulb, ArrowRight, FlaskConical,
} from "lucide-react";
import Navbar from "../components/Navbar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const TAGS = ["NLP", "FinBERT", "Backtesting", "FastAPI", "React", "PyTorch"];

const FACTS = [
  ["Model", "FinBERT (fine-tuned)"],
  ["Headlines scored", "~14,000"],
  ["Test period", "2021 – 2023"],
  ["Asset", "BTC-USD (daily)"],
];

const TOC = [
  ["background", "Background"],
  ["approach", "Approach"],
  ["data", "The data"],
  ["model", "The model"],
  ["strategy", "The strategy"],
  ["methodology", "Methodology"],
  ["results", "Results"],
  ["architecture", "Architecture"],
  ["challenges", "Challenges"],
  ["limitations", "Limitations"],
  ["future", "Future work"],
  ["takeaways", "Takeaways"],
];

// Thin orange bar under the top edge showing how far through the article you are.
function ReadingProgress() {
  const { scrollYProgress } = useScroll();
  return (
    <motion.div
      style={{ scaleX: scrollYProgress }}
      className="fixed inset-x-0 top-0 z-50 h-0.5 origin-left bg-[#f7931a]"
    />
  );
}

// Sticky "on this page" nav (xl screens); the section in view is highlighted.
function Toc() {
  const [active, setActive] = useState(TOC[0][0]);
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting);
        if (vis.length) setActive(vis[0].target.id);
      },
      { rootMargin: "-15% 0px -70% 0px" }
    );
    TOC.forEach(([id]) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);
  return (
    <nav aria-label="On this page" className="sticky top-24 hidden h-fit w-44 shrink-0 self-start xl:block">
      <p className="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">On this page</p>
      <ul className="space-y-0.5 border-l border-border/60 text-sm">
        {TOC.map(([id, label]) => (
          <li key={id}>
            <a href={`#${id}`}
               onClick={(e) => {
                 e.preventDefault();
                 document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
               }}
               className={`-ml-px block border-l-2 py-1 pl-3 transition ${
                 active === id
                   ? "border-[#f7931a] font-medium text-foreground"
                   : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              {label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function Section({ id, icon: Icon, kicker, title, children }) {
  return (
    <section id={id} className="space-y-4 scroll-mt-20">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs font-medium tracking-wide text-[#f7931a] uppercase">
          <Icon className="h-4 w-4" /> {kicker}
        </div>
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      </div>
      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

function Code({ children }) {
  return (
    <pre className="overflow-x-auto rounded-lg border border-border/60 bg-secondary/40 p-4 text-xs leading-relaxed text-foreground">
      <code>{children}</code>
    </pre>
  );
}

function Def({ term, children }) {
  return (
    <div className="border-l-2 border-border/60 pl-3">
      <span className="font-medium text-foreground">{term}</span> — {children}
    </div>
  );
}

// Inline, theme-aware FinBERT architecture diagram (SVG scales crisply).
function ModelArchitecture() {
  const boxX = 24, boxW = 252, cx = boxX + boxW / 2; // left pipeline column
  const steps = [
    { y: 14, h: 44, title: "Input — BTC headline (raw text)", sub: "“Bitcoin soars to a new high”" },
    { y: 80, h: 52, title: "WordPiece tokenizer", sub: "[CLS] bit ##coin soars [SEP]  ·  max 128" },
    { y: 154, h: 52, title: "Embeddings (768-d)", sub: "token + position + segment" },
    { y: 228, h: 62, title: "12× Transformer encoder", sub: "BERT-base  ·  12 heads  ·  hidden 768", accent: true },
    { y: 312, h: 48, title: "[CLS] pooled output", sub: "768-d sentence vector" },
    { y: 382, h: 42, title: "Dropout (p = 0.1)", sub: "" },
    { y: 446, h: 48, title: "Linear classifier head", sub: "768 → 3 logits" },
    { y: 516, h: 52, title: "Softmax", sub: "P(neg)  ·  P(neu)  ·  P(pos)" },
    { y: 590, h: 50, title: "Sentiment score", sub: "P(pos) − P(neg)  ∈  [−1, +1]", accent: true },
  ];
  const ACCENT = "#f7931a";
  const dCx = 428, dBoxX = 332, dBoxW = 192; // right "inside a layer" inset
  const detail = [
    { y: 256, h: 34, label: "Multi-Head Self-Attention · 12 heads" },
    { y: 298, h: 24, label: "Add & Norm" },
    { y: 330, h: 34, label: "Feed-Forward · 768→3072→768" },
    { y: 372, h: 24, label: "Add & Norm" },
  ];
  return (
    <figure className="my-2 text-foreground">
      <svg viewBox="0 0 560 656" className="h-auto w-full" role="img"
           aria-label="FinBERT sequence-classification architecture">
        <defs>
          <marker id="ca-arrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
            <path d="M1,1 L6,4 L1,7" fill="none" stroke="currentColor" strokeOpacity="0.45" strokeWidth="1.2" />
          </marker>
        </defs>

        {/* left pipeline: connecting arrows */}
        {steps.slice(0, -1).map((s, i) => (
          <line key={`a${i}`} x1={cx} y1={s.y + s.h} x2={cx} y2={steps[i + 1].y}
                stroke="currentColor" strokeOpacity="0.45" strokeWidth="1.4" markerEnd="url(#ca-arrow)" />
        ))}

        {/* left pipeline: boxes */}
        {steps.map((s, i) => {
          const hasSub = s.sub !== "";
          return (
            <g key={`b${i}`}>
              <rect x={boxX} y={s.y} width={boxW} height={s.h} rx="8"
                    fill={s.accent ? ACCENT : "currentColor"} fillOpacity={s.accent ? 0.12 : 0.04}
                    stroke={s.accent ? ACCENT : "currentColor"} strokeOpacity={s.accent ? 0.9 : 0.3} strokeWidth="1.2" />
              <text x={cx} y={hasSub ? s.y + 20 : s.y + s.h / 2 + 4} textAnchor="middle"
                    fontSize="12.5" fontWeight="600" fill={s.accent ? ACCENT : "currentColor"}>
                {s.title}
              </text>
              {hasSub && (
                <text x={cx} y={s.y + 37} textAnchor="middle" fontSize="10.5"
                      fill="currentColor" fillOpacity="0.6" fontFamily="ui-monospace, monospace">
                  {s.sub}
                </text>
              )}
            </g>
          );
        })}

        {/* bracket from encoder box to the zoom-in inset */}
        <line x1={boxX + boxW} y1="259" x2={dBoxX} y2="259"
              stroke={ACCENT} strokeOpacity="0.7" strokeWidth="1.2" strokeDasharray="3 3" markerEnd="url(#ca-arrow)" />

        {/* right inset: inside one encoder layer */}
        <rect x={dBoxX - 8} y="228" width={dBoxW + 24} height="176" rx="10"
              fill="currentColor" fillOpacity="0.025" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1" strokeDasharray="4 3" />
        <text x={dCx} y="246" textAnchor="middle" fontSize="11" fontWeight="600" fill="currentColor" fillOpacity="0.75">
          Inside one encoder layer
        </text>
        {detail.slice(0, -1).map((d, i) => (
          <line key={`da${i}`} x1={dCx} y1={d.y + d.h} x2={dCx} y2={detail[i + 1].y}
                stroke="currentColor" strokeOpacity="0.4" strokeWidth="1.2" markerEnd="url(#ca-arrow)" />
        ))}
        {detail.map((d, i) => (
          <g key={`d${i}`}>
            <rect x={dBoxX} y={d.y} width={dBoxW} height={d.h} rx="6"
                  fill="currentColor" fillOpacity="0.05" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1" />
            <text x={dCx} y={d.y + d.h / 2 + 3.5} textAnchor="middle" fontSize="10" fill="currentColor" fillOpacity="0.85">
              {d.label}
            </text>
          </g>
        ))}
      </svg>
      <figcaption className="mt-2 text-center text-xs text-muted-foreground">
        FinBERT (BERT-base) fine-tuned with a 3-class sequence-classification head, reduced to a single sentiment score.
      </figcaption>
    </figure>
  );
}

export default function CaseStudy() {
  return (
    <>
      <Navbar />
      <ReadingProgress />
      <div className="mx-auto flex max-w-6xl justify-center gap-10 px-4 py-12 sm:px-6">
      <main className="min-w-0 max-w-3xl space-y-12">
        {/* Hero */}
        <header className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {TAGS.map((t) => <Badge key={t} variant="secondary">{t}</Badge>)}
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Can reading the news beat holding Bitcoin?
          </h1>
          <p className="text-base text-muted-foreground">
            An end-to-end NLP project that fine-tunes a financial language model to turn crypto
            headlines into trading decisions — then rigorously and honestly measures whether it works.
          </p>
          <img src="/dashboard.png" alt="Dashboard"
               className="rounded-xl border border-border/60 shadow-2xl" />
          {/* Quick facts */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {FACTS.map(([l, v]) => (
              <Card key={l}><CardContent className="p-4">
                <div className="text-xs text-muted-foreground">{l}</div>
                <div className="mt-1 text-sm font-semibold text-foreground">{v}</div>
              </CardContent></Card>
            ))}
          </div>
        </header>

        {/* TL;DR */}
        <Card className="border-[#f7931a]/30 bg-[#f7931a]/5">
          <CardContent className="space-y-2 p-5 text-sm">
            <p className="font-semibold text-foreground">TL;DR</p>
            <p className="text-muted-foreground">
              I fine-tuned FinBERT to score Bitcoin news sentiment, converted daily sentiment into a
              long/flat trading rule, and backtested it on three years of real BTC prices with no
              look-ahead. The result is an honest, interactive system: with default settings the
              strategy <span className="text-foreground">did not beat buy-and-hold</span> — which is a
              valid finding, and the dashboard lets you explore when sentiment helps and when it doesn't.
            </p>
          </CardContent>
        </Card>

        <Section id="background" icon={Target} kicker="Background" title="Why this question matters">
          <p>
            “The news moves the market” is repeated constantly in finance and crypto, but it's rarely
            tested with a reproducible, no-look-ahead methodology. Sentiment analysis is a classic NLP
            task; trading is a natural, measurable application. Combining them produces a project where
            the model's output has a concrete, quantifiable consequence: <span className="text-foreground">profit or loss</span>.
          </p>
          <p>
            The goal was not to build a money printer, but to build the <em>apparatus</em> to test the
            claim — and to be honest about what it finds.
          </p>
        </Section>

        <Section id="approach" icon={Workflow} kicker="Approach" title="A five-step pipeline">
          <ol className="space-y-2">
            {[
              ["Acquire data", "Real BTC prices + thousands of dated crypto headlines + a labelled sentiment dataset."],
              ["Fine-tune FinBERT", "Train a finance-domain BERT to classify text as negative / neutral / positive."],
              ["Score sentiment", "Apply the model to every headline → a continuous daily sentiment score."],
              ["Generate signals", "Turn smoothed daily sentiment into a long / flat (or short) position via a threshold."],
              ["Backtest", "Replay real prices day-by-day with transaction costs, comparing to buy-and-hold."],
            ].map(([t, d], i) => (
              <li key={t} className="flex gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#f7931a]/15 text-xs font-semibold text-[#f7931a]">{i + 1}</span>
                <span><span className="font-medium text-foreground">{t}.</span> {d}</span>
              </li>
            ))}
          </ol>
        </Section>

        <Section id="data" icon={Database} kicker="The data" title="Sources, scale & alignment">
          <p>Three datasets feed three different phases of the pipeline:</p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-border/60 text-muted-foreground">
                  <th className="py-2 pr-3 text-left font-medium">Dataset</th>
                  <th className="py-2 pr-3 text-left font-medium">Source &amp; scale</th>
                  <th className="py-2 pr-3 text-left font-medium">Purpose</th>
                  <th className="py-2 text-left font-medium">Phase</th>
                </tr>
              </thead>
              <tbody>
                {[
                  [
                    "Financial PhraseBank",
                    "ChanceFocus/flare-fpb (HF) · ~3,100 labelled sentences",
                    "Fine-tune & evaluate FinBERT on 3-class sentiment (neg / neu / pos).",
                    "Model training",
                  ],
                  [
                    "Bitcoin news headlines",
                    "FadedCalendula/cryptonews_srp_data (HF) · ~14,000 dated headlines, 2021–2023",
                    "Scored by the model into a daily sentiment signal — the text that drives the strategy.",
                    "Sentiment scoring",
                  ],
                  [
                    "BTC-USD OHLCV",
                    "yfinance · daily prices, 2021–2023",
                    "Provide the real returns the position earns, plus the buy-and-hold benchmark.",
                    "Backtesting",
                  ],
                ].map(([name, src, purpose, phase]) => (
                  <tr key={name} className="border-b border-border/40 align-top">
                    <td className="py-2 pr-3 font-medium text-foreground">{name}</td>
                    <td className="py-2 pr-3">{src}</td>
                    <td className="py-2 pr-3">{purpose}</td>
                    <td className="py-2">
                      <Badge variant="secondary" className="whitespace-nowrap">{phase}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            Headlines were normalised (one headline per line, whitespace cleaned), parsed to dates, and
            filtered to the 2021–2023 price window. Multiple headlines on the same day are aggregated
            into a single daily sentiment. The full text set is scored <span className="text-foreground">once</span> and
            cached to disk, so changing strategy parameters never re-runs the model — simulations
            return in ~0.2&nbsp;seconds.
          </p>
        </Section>

        <Section id="model" icon={Brain} kicker="The model" title="Fine-tuning FinBERT">
          <p>
            <span className="text-foreground">FinBERT</span> is BERT pre-trained on financial text. I
            fine-tuned it for 3-class sentiment using the HuggingFace <code className="rounded bg-secondary px-1 text-foreground">Trainer</code> on
            the <code className="rounded bg-secondary px-1 text-foreground">ChanceFocus/flare-fpb</code> Financial
            PhraseBank (3,100 sentences), with a stratified 70 / 15 / 15 split
            (<span className="text-foreground">2,170 train · 465 val · 465 test</span>):
          </p>

          <ModelArchitecture />

          <Code>{`base model      ProsusAI/finbert
task            sequence classification (3 labels)
max length      128 tokens
epochs          1                 (CPU-adjusted; best model by val macro-F1)
train batch     8        eval batch  16
learning rate   2e-5     optimizer   AdamW (weight decay 0.01)
seed            42`}</Code>

          <div className="flex items-center gap-2 rounded-lg border border-[#f7931a]/25 bg-[#f7931a]/5 p-3 text-xs">
            <FlaskConical className="h-4 w-4 shrink-0 text-[#f7931a]" />
            <span>
              Curious what this run looked like?{" "}
              <Link to="/training" className="font-medium text-[#f7931a] underline-offset-2 hover:underline">
                Watch the training simulation →
              </Link>
            </span>
          </div>

          <p>
            On the <span className="text-foreground">held-out test set</span> (465 sentences it never saw
            during training):
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Accuracy", "87.5%"],
              ["Macro-F1", "0.84"],
              ["Weighted-F1", "0.87"],
              ["Test loss", "0.36"],
            ].map(([l, v]) => (
              <Card key={l}><CardContent className="p-4 text-center">
                <div className="text-xs text-muted-foreground">{l}</div>
                <div className="mt-1 font-mono text-lg font-semibold">{v}</div>
              </CardContent></Card>
            ))}
          </div>

          <p>
            Because the labels are imbalanced (~60% neutral / 28% positive / 12% negative), I report
            <span className="text-foreground"> macro-F1</span> — which weights every class equally — not
            just raw accuracy. Per-class breakdown:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-border/60 text-muted-foreground">
                  <th className="py-2 text-left font-medium">Class</th>
                  <th className="py-2 text-right font-medium">Precision</th>
                  <th className="py-2 text-right font-medium">Recall</th>
                  <th className="py-2 text-right font-medium">F1</th>
                  <th className="py-2 text-right font-medium">Support</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {[
                  ["negative", "0.76", "0.82", "0.79", "57"],
                  ["neutral", "0.91", "0.93", "0.92", "279"],
                  ["positive", "0.86", "0.78", "0.82", "129"],
                  ["macro avg", "0.84", "0.85", "0.84", "465"],
                ].map(([c, p, r, f, s], i) => (
                  <tr key={c} className={`border-b border-border/40 ${i === 3 ? "font-semibold text-foreground" : ""}`}>
                    <td className="py-2 text-left">{c}</td>
                    <td className="py-2 text-right">{p}</td>
                    <td className="py-2 text-right">{r}</td>
                    <td className="py-2 text-right">{f}</td>
                    <td className="py-2 text-right">{s}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p>
            <span className="text-foreground">Confusion matrix</span> (rows = true label, columns =
            prediction; green diagonal = correct):
          </p>
          <div className="overflow-x-auto">
            <table className="border-collapse text-center text-xs">
              <thead>
                <tr className="text-muted-foreground">
                  <th className="p-2"></th>
                  <th className="p-2 font-medium" colSpan={3}>Predicted</th>
                </tr>
                <tr className="text-muted-foreground">
                  <th className="p-2"></th>
                  <th className="p-2 font-normal">neg</th>
                  <th className="p-2 font-normal">neu</th>
                  <th className="p-2 font-normal">pos</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {[
                  ["neg", [47, 7, 3]],
                  ["neu", [7, 259, 13]],
                  ["pos", [8, 20, 101]],
                ].map(([label, row], ri) => (
                  <tr key={label}>
                    <th className="p-2 text-right font-normal text-muted-foreground">{label}</th>
                    {row.map((n, ci) => (
                      <td key={ci}
                          className={`min-w-[3rem] border border-border/40 p-3 ${
                            ri === ci
                              ? "bg-[#16a34a]/20 font-semibold text-foreground"
                              : n > 0 ? "bg-[#dc2626]/10 text-muted-foreground" : "text-muted-foreground"
                          }`}>
                        {n}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs">
            The model is strongest on the majority <span className="text-foreground">neutral</span> class
            (259/279 correct) and weakest on the rarest <span className="text-foreground">negative</span> class
            — exactly what the imbalance predicts. Quick live sanity check: <em>“revenue exceeded
            expectations”</em> → positive (0.76), <em>“operating profit fell 20%”</em> → negative (0.93),
            <em>“CEO will speak at a conference”</em> → neutral (0.97).
          </p>

          <p>For each headline the model outputs class probabilities, reduced to a single score:</p>
          <Code>{`sentiment = P(positive) − P(negative)     # in [-1, +1]`}</Code>
        </Section>

        <Section id="strategy" icon={Signal} kicker="The strategy" title="From sentiment to a position">
          <p>Daily sentiment is smoothed with a rolling mean (to cut noise), then mapped to a position:</p>
          <Code>{`s = rolling_mean(daily_sentiment, window)

if   s >  threshold:  position = +1   # long  (hold BTC)
elif s < -threshold:  position = -1   # short (if enabled) else 0
else:                 position = hold previous`}</Code>
          <p>
            <span className="text-foreground">Threshold</span>, <span className="text-foreground">smoothing window</span>,
            and whether shorting is allowed are all tunable live in the dashboard.
          </p>
        </Section>

        <Section id="methodology" icon={LineChart} kicker="Methodology" title="An honest backtest">
          <p>The simulation is deliberately strict to avoid the classic ways backtests lie:</p>
          <div className="space-y-2">
            <Def term="No look-ahead">Today's sentiment decides today's position, which earns <em>tomorrow's</em> return. The model never sees information from the future.</Def>
            <Def term="Transaction costs">A configurable cost (basis points) is charged every time the position changes, penalising over-trading.</Def>
            <Def term="Benchmark">Performance is always shown against buy-and-hold — the honest bar any strategy must clear.</Def>
            <Def term="Metrics">Total return, CAGR, Sharpe ratio (risk-adjusted), max drawdown (worst peak-to-trough), win rate, and trade count.</Def>
          </div>
        </Section>

        <Section id="results" icon={LineChart} kicker="Results" title="What actually happened">
          <p>With default settings over 2021–2023, the strategy underperformed buy-and-hold:</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Strategy return", "≈ −4%"],
              ["Sharpe", "0.29"],
              ["Max drawdown", "−73%"],
              ["Trades", "19"],
            ].map(([l, v]) => (
              <Card key={l}><CardContent className="p-4 text-center">
                <div className="text-xs text-muted-foreground">{l}</div>
                <div className="mt-1 font-mono text-lg font-semibold">{v}</div>
              </CardContent></Card>
            ))}
          </div>
          <p><span className="text-foreground">Why?</span> A few honest reasons:</p>
          <ul className="list-inside list-disc space-y-1">
            <li>Daily headline sentiment is a <span className="text-foreground">weak, noisy signal</span> — much news is already priced in by the time it's published.</li>
            <li>FinBERT was trained on formal financial sentences, so short, slangy crypto headlines are partly out-of-distribution.</li>
            <li>Bitcoin's strong multi-year trend is hard to beat by sitting in cash during dips.</li>
          </ul>
          <p>
            Crucially, the framework lets you <span className="text-foreground">measure</span> this rather than
            guess — and tuning the threshold, smoothing, or enabling shorts changes the outcome, which is
            exactly the kind of exploration the dashboard is for.
          </p>
        </Section>

        <Section id="architecture" icon={Layers} kicker="The build" title="A 3-tier architecture">
          <Code>{`COLAB (train, once)  ──model──▶  FASTAPI (backend)  ──JSON──▶  REACT (frontend)
   GPU                  files        inference + sim      HTTP       dashboard`}</Code>
          <div className="space-y-2">
            <Def term="Training (Colab)">Runs once on a free GPU, fine-tunes FinBERT, and exports the model. Keeps heavy compute off the local machine.</Def>
            <Def term="Backend (FastAPI)">Loads the model, serves <code className="rounded bg-secondary px-1 text-foreground">/predict</code>, <code className="rounded bg-secondary px-1 text-foreground">/simulate</code>, and <code className="rounded bg-secondary px-1 text-foreground">/prices</code>; caches scored sentiment for instant simulations.</Def>
            <Def term="Frontend (React + Vite)">Tailwind + shadcn/ui dashboard with Recharts and TradingView charts, TanStack Query for data, and a stacked sentiment-tester dialog.</Def>
          </div>
        </Section>

        <Section id="challenges" icon={Wrench} kicker="Engineering" title="Challenges I hit (and solved)">
          <div className="space-y-2">
            <Def term="CPU-only + throttled network">The dev machine had no GPU and a slow link to HuggingFace's CDN. Fixed by training in Colab, using the CPU PyTorch wheel, routing model downloads through a mirror, and pre-caching results.</Def>
            <Def term="Library version drift">Newer <code className="rounded bg-secondary px-1 text-foreground">datasets</code>/<code className="rounded bg-secondary px-1 text-foreground">transformers</code> dropped script datasets and changed tokenizer loading; resolved by switching to a parquet dataset mirror and supplying the fast-tokenizer file.</Def>
            <Def term="Headless UI verification">Used a headless browser to catch real bugs (a frozen Base-UI slider, mobile navbar overflow) instead of eyeballing.</Def>
          </div>
        </Section>

        <Section id="limitations" icon={AlertTriangle} kicker="Honesty" title="Limitations">
          <ul className="list-inside list-disc space-y-1">
            <li>It's a <span className="text-foreground">backtest</span> on history — not live trading, and not a prediction of the future.</li>
            <li>Simplified execution: all-in / all-out positions, no slippage, fills at daily close.</li>
            <li>News coverage isn't perfectly uniform across every day.</li>
            <li><code className="rounded bg-secondary px-1 text-foreground">ProsusAI/finbert</code> was originally trained on Financial PhraseBank, so re-fine-tuning mainly demonstrates the pipeline.</li>
          </ul>
        </Section>

        <Section id="future" icon={Rocket} kicker="Next" title="Future work">
          <ul className="list-inside list-disc space-y-1">
            <li><span className="text-foreground">Live mode</span> — real-time prices + a news API for a current sentiment signal.</li>
            <li><span className="text-foreground">Better signals</span> — volume-weighted sentiment, per-source weighting, or combining with price features.</li>
            <li><span className="text-foreground">Parameter search</span> — automatically find the best threshold/window per period.</li>
            <li><span className="text-foreground">More assets</span> — extend beyond BTC to stocks or an ETH comparison.</li>
          </ul>
        </Section>

        <Section id="takeaways" icon={Lightbulb} kicker="Takeaways" title="What this demonstrates">
          <ul className="list-inside list-disc space-y-1">
            <li>Shipping a complete ML product end-to-end: data → model → API → UI.</li>
            <li>Rigorous, no-look-ahead evaluation over cherry-picked results.</li>
            <li>Clean separation across three independently testable tiers.</li>
            <li>Honest reporting — a negative result, clearly explained, is still a real result.</li>
          </ul>
        </Section>

        {/* CTA */}
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border/60 bg-card p-6">
          <div className="flex-1">
            <p className="font-medium">Try it yourself</p>
            <p className="text-sm text-muted-foreground">Tune the strategy and watch it backtest live.</p>
          </div>
          <Button variant="outline" nativeButton={false} render={<Link to="/training" />}>
            <FlaskConical className="h-4 w-4" /> Training sim
          </Button>
          <Button nativeButton={false} render={<Link to="/" />}>
            Open dashboard <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </main>
      <Toc />
      </div>
    </>
  );
}
