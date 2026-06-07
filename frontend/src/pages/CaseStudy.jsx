// A detailed case study: background → data → model → signal → backtest →
// results → architecture → challenges → limitations → future work.
import { Link } from "react-router-dom";
import {
  Target, Workflow, Database, Brain, Signal, LineChart, Layers, Wrench,
  AlertTriangle, Rocket, Lightbulb, ArrowRight,
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

function Section({ icon: Icon, kicker, title, children }) {
  return (
    <section className="space-y-4 scroll-mt-20">
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

export default function CaseStudy() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl space-y-12 px-4 py-12 sm:px-6">
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

        <Section icon={Target} kicker="Background" title="Why this question matters">
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

        <Section icon={Workflow} kicker="Approach" title="A five-step pipeline">
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

        <Section icon={Database} kicker="The data" title="Sources, scale & alignment">
          <ul className="list-inside list-disc space-y-1">
            <li><span className="text-foreground">Financial PhraseBank</span> — ~4,800 labelled financial sentences (negative / neutral / positive) for training & evaluating the model.</li>
            <li><span className="text-foreground">~14,000 Bitcoin headlines</span> (2021–2023) from a public dataset — the text that drives the simulation.</li>
            <li><span className="text-foreground">BTC-USD daily OHLCV</span> from yfinance.</li>
          </ul>
          <p>
            Headlines were normalised (one headline per line, whitespace cleaned), parsed to dates, and
            filtered to the 2021–2023 price window. Multiple headlines on the same day are aggregated
            into a single daily sentiment. The full text set is scored <span className="text-foreground">once</span> and
            cached to disk, so changing strategy parameters never re-runs the model — simulations
            return in ~0.2&nbsp;seconds.
          </p>
        </Section>

        <Section icon={Brain} kicker="The model" title="Fine-tuning FinBERT">
          <p>
            <span className="text-foreground">FinBERT</span> is BERT pre-trained on financial text. I
            fine-tuned it for 3-class sentiment using the HuggingFace <code className="rounded bg-secondary px-1 text-foreground">Trainer</code>,
            with a stratified train / validation / test split and these settings:
          </p>
          <Code>{`base model      ProsusAI/finbert
task            sequence classification (3 labels)
max length      128 tokens
epochs          2–3
batch size      16
learning rate   2e-5
optimizer       AdamW (weight decay 0.01)`}</Code>
          <p>
            The model is evaluated on a held-out test set it never saw during training, reporting
            <span className="text-foreground"> accuracy</span>, <span className="text-foreground">macro-F1</span>,
            and a <span className="text-foreground">confusion matrix</span> (full figures in the Colab
            notebook). For each headline it outputs class probabilities, which are reduced to a single
            score:
          </p>
          <Code>{`sentiment = P(positive) − P(negative)     # in [-1, +1]`}</Code>
        </Section>

        <Section icon={Signal} kicker="The strategy" title="From sentiment to a position">
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

        <Section icon={LineChart} kicker="Methodology" title="An honest backtest">
          <p>The simulation is deliberately strict to avoid the classic ways backtests lie:</p>
          <div className="space-y-2">
            <Def term="No look-ahead">Today's sentiment decides today's position, which earns <em>tomorrow's</em> return. The model never sees information from the future.</Def>
            <Def term="Transaction costs">A configurable cost (basis points) is charged every time the position changes, penalising over-trading.</Def>
            <Def term="Benchmark">Performance is always shown against buy-and-hold — the honest bar any strategy must clear.</Def>
            <Def term="Metrics">Total return, CAGR, Sharpe ratio (risk-adjusted), max drawdown (worst peak-to-trough), win rate, and trade count.</Def>
          </div>
        </Section>

        <Section icon={LineChart} kicker="Results" title="What actually happened">
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

        <Section icon={Layers} kicker="The build" title="A 3-tier architecture">
          <Code>{`COLAB (train, once)  ──model──▶  FASTAPI (backend)  ──JSON──▶  REACT (frontend)
   GPU                  files        inference + sim      HTTP       dashboard`}</Code>
          <div className="space-y-2">
            <Def term="Training (Colab)">Runs once on a free GPU, fine-tunes FinBERT, and exports the model. Keeps heavy compute off the local machine.</Def>
            <Def term="Backend (FastAPI)">Loads the model, serves <code className="rounded bg-secondary px-1 text-foreground">/predict</code>, <code className="rounded bg-secondary px-1 text-foreground">/simulate</code>, and <code className="rounded bg-secondary px-1 text-foreground">/prices</code>; caches scored sentiment for instant simulations.</Def>
            <Def term="Frontend (React + Vite)">Tailwind + shadcn/ui dashboard with Recharts and TradingView charts, TanStack Query for data, and a stacked sentiment-tester dialog.</Def>
          </div>
        </Section>

        <Section icon={Wrench} kicker="Engineering" title="Challenges I hit (and solved)">
          <div className="space-y-2">
            <Def term="CPU-only + throttled network">The dev machine had no GPU and a slow link to HuggingFace's CDN. Fixed by training in Colab, using the CPU PyTorch wheel, routing model downloads through a mirror, and pre-caching results.</Def>
            <Def term="Library version drift">Newer <code className="rounded bg-secondary px-1 text-foreground">datasets</code>/<code className="rounded bg-secondary px-1 text-foreground">transformers</code> dropped script datasets and changed tokenizer loading; resolved by switching to a parquet dataset mirror and supplying the fast-tokenizer file.</Def>
            <Def term="Headless UI verification">Used a headless browser to catch real bugs (a frozen Base-UI slider, mobile navbar overflow) instead of eyeballing.</Def>
          </div>
        </Section>

        <Section icon={AlertTriangle} kicker="Honesty" title="Limitations">
          <ul className="list-inside list-disc space-y-1">
            <li>It's a <span className="text-foreground">backtest</span> on history — not live trading, and not a prediction of the future.</li>
            <li>Simplified execution: all-in / all-out positions, no slippage, fills at daily close.</li>
            <li>News coverage isn't perfectly uniform across every day.</li>
            <li><code className="rounded bg-secondary px-1 text-foreground">ProsusAI/finbert</code> was originally trained on Financial PhraseBank, so re-fine-tuning mainly demonstrates the pipeline.</li>
          </ul>
        </Section>

        <Section icon={Rocket} kicker="Next" title="Future work">
          <ul className="list-inside list-disc space-y-1">
            <li><span className="text-foreground">Live mode</span> — real-time prices + a news API for a current sentiment signal.</li>
            <li><span className="text-foreground">Better signals</span> — volume-weighted sentiment, per-source weighting, or combining with price features.</li>
            <li><span className="text-foreground">Parameter search</span> — automatically find the best threshold/window per period.</li>
            <li><span className="text-foreground">More assets</span> — extend beyond BTC to stocks or an ETH comparison.</li>
          </ul>
        </Section>

        <Section icon={Lightbulb} kicker="Takeaways" title="What this demonstrates">
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
          <Button render={<Link to="/" />}>
            Open dashboard <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </main>
    </>
  );
}
