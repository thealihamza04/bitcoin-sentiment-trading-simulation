// Clean, minimal docs — how to use the app + reference.
import { SlidersHorizontal, BarChart3, Plug, Info } from "lucide-react";
import Navbar from "../components/Navbar";

function Section({ icon: Icon, title, children }) {
  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <Icon className="h-5 w-5 text-[#f7931a]" /> {title}
      </h2>
      <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

function Item({ term, children }) {
  return (
    <div className="flex flex-col gap-0.5 border-l-2 border-border/60 pl-3">
      <span className="font-medium text-foreground">{term}</span>
      <span>{children}</span>
    </div>
  );
}

export default function Docs() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl space-y-10 px-4 py-10 sm:px-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Documentation</h1>
          <p className="text-sm text-muted-foreground">
            A quick guide to using the Bitcoin sentiment trading simulation.
          </p>
        </header>

        <Section icon={Info} title="What it is">
          <p>
            This app fine-tunes <span className="text-foreground">FinBERT</span> to read Bitcoin news,
            converts daily sentiment into buy/sell signals, and backtests that strategy on real
            BTC prices (2021–2023) — comparing it to simply holding Bitcoin.
          </p>
        </Section>

        <Section icon={SlidersHorizontal} title="Strategy controls">
          <Item term="Sentiment threshold">How strong the daily sentiment must be before acting. Higher = fewer, more selective trades.</Item>
          <Item term="Smoothing window">Days used to average sentiment, reducing day-to-day noise.</Item>
          <Item term="Transaction cost">Fee charged whenever the position changes, in basis points (10 bps = 0.10%).</Item>
          <Item term="Allow short positions">If on, the strategy can also profit from price drops (long/short) instead of just long/flat.</Item>
          <Item term="Initial capital">Starting pretend money for the simulation.</Item>
        </Section>

        <Section icon={BarChart3} title="Reading the results">
          <Item term="Strategy return vs B&H">Total % gain of the sentiment strategy versus buy-and-hold.</Item>
          <Item term="Sharpe ratio">Risk-adjusted return — higher is better; accounts for volatility.</Item>
          <Item term="Max drawdown">The worst peak-to-trough drop — smaller (less negative) is better.</Item>
          <Item term="Trades / win rate">How often it traded and the share of profitable days.</Item>
          <Item term="Equity curve">Portfolio value over time — green is the strategy, grey is buy-and-hold.</Item>
        </Section>

        <Section icon={Plug} title="API reference">
          <p>The backend (FastAPI) exposes a small JSON API — interactive docs at <code className="rounded bg-secondary px-1 text-foreground">localhost:8000/docs</code>.</p>
          <div className="overflow-hidden rounded-lg border border-border/60">
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary/60 text-foreground">
                <tr><th className="px-3 py-2">Method</th><th className="px-3 py-2">Endpoint</th><th className="px-3 py-2">Description</th></tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                <tr><td className="px-3 py-2 font-mono">GET</td><td className="px-3 py-2 font-mono">/</td><td className="px-3 py-2">Health + model status</td></tr>
                <tr><td className="px-3 py-2 font-mono">POST</td><td className="px-3 py-2 font-mono">/predict</td><td className="px-3 py-2">Headline → sentiment</td></tr>
                <tr><td className="px-3 py-2 font-mono">GET</td><td className="px-3 py-2 font-mono">/prices</td><td className="px-3 py-2">BTC price history</td></tr>
                <tr><td className="px-3 py-2 font-mono">GET</td><td className="px-3 py-2 font-mono">/simulate</td><td className="px-3 py-2">Run the backtest</td></tr>
              </tbody>
            </table>
          </div>
        </Section>

        <Section icon={Info} title="Good to know">
          <p>The data is <span className="text-foreground">real but historical</span> — this is a backtest, not live trading. It uses real BTC prices, real headlines, and a real fine-tuned model, with no look-ahead (today's news drives tomorrow's return).</p>
        </Section>
      </main>
    </>
  );
}
