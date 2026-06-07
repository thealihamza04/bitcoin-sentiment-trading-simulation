// A proper case study: problem → approach → data → model → results → learnings.
import { Link } from "react-router-dom";
import {
  Target, Workflow, Database, Brain, LineChart, Layers, Lightbulb, ArrowRight,
} from "lucide-react";
import Navbar from "../components/Navbar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const TAGS = ["NLP", "FinBERT", "Backtesting", "FastAPI", "React"];

function Section({ icon: Icon, kicker, title, children }) {
  return (
    <section className="space-y-4">
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
            headlines into trading decisions — then honestly measures whether it works.
          </p>
          <img src="/dashboard.png" alt="Dashboard"
               className="rounded-xl border border-border/60 shadow-2xl" />
        </header>

        <Section icon={Target} kicker="The problem" title="Does sentiment actually move with the market?">
          <p>
            “The news drives the market” is a common belief, but it's rarely tested rigorously.
            The goal of this project was to build a system that converts <em>real</em> financial
            news sentiment into a trading strategy and evaluates it against the simplest possible
            benchmark: <span className="text-foreground">buy and hold</span>.
          </p>
        </Section>

        <Section icon={Workflow} kicker="The approach" title="A five-step pipeline">
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

        <Section icon={Database} kicker="The data" title="Real, and carefully aligned">
          <ul className="list-inside list-disc space-y-1">
            <li><span className="text-foreground">Financial PhraseBank</span> — labelled sentences for training/evaluating the model.</li>
            <li><span className="text-foreground">~14,000 Bitcoin headlines</span> (2021–2023) for the simulation.</li>
            <li><span className="text-foreground">BTC-USD daily prices</span> from yfinance.</li>
          </ul>
          <p>Headlines were aligned to trading days, and the whole text set was scored once and cached so simulations run in ~0.2s.</p>
        </Section>

        <Section icon={Brain} kicker="The model" title="Fine-tuned FinBERT">
          <p>
            FinBERT (a BERT variant pre-trained on financial text) was fine-tuned for 3-class
            sentiment with a stratified train / validation / test split, and evaluated with
            accuracy, macro-F1, and a confusion matrix on the held-out test set
            <span className="text-foreground"> (full metrics in the Colab notebook)</span>.
          </p>
        </Section>

        <Section icon={LineChart} kicker="The results" title="An honest finding">
          <p>
            With default settings, the sentiment strategy <span className="text-foreground">did not beat
            buy-and-hold</span> over 2021–2023 — a genuine, common outcome:
          </p>
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
          <p>
            That's the point: rather than claiming a magic strategy, the project provides a rigorous,
            no-look-ahead way to <em>measure</em> performance — and lets you tune parameters to explore
            when sentiment helps and when it doesn't.
          </p>
        </Section>

        <Section icon={Layers} kicker="The build" title="A 3-tier architecture">
          <p>
            Training runs once in <span className="text-foreground">Google Colab</span> (GPU) and exports the
            model. A <span className="text-foreground">FastAPI</span> backend loads it and serves inference +
            simulation as JSON. A <span className="text-foreground">React</span> dashboard (Tailwind + shadcn/ui,
            Recharts + TradingView charts) makes it interactive.
          </p>
        </Section>

        <Section icon={Lightbulb} kicker="Takeaways" title="What this demonstrates">
          <ul className="list-inside list-disc space-y-1">
            <li>Shipping a complete ML product: data → model → API → UI.</li>
            <li>Rigorous evaluation (test split + no look-ahead) over cherry-picked results.</li>
            <li>Clean separation of concerns across three independently testable tiers.</li>
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
