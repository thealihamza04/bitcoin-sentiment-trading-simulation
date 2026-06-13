import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CircleDot, Rocket, ArrowRight, Trophy, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "../components/Navbar";
import Controls from "../components/Controls";
import SentimentTester from "../components/SentimentTester";
import MetricsCards from "../components/MetricsCards";
import PipelineStatus from "../components/PipelineStatus";
import EquityCurve from "../components/EquityCurve";
import PriceChart from "../components/PriceChart";
import SkeletonDashboard from "../components/SkeletonDashboard";
import { useHealth, useSimulation, useDebounce } from "../hooks";

const DEFAULT_PARAMS = {
  threshold: 0.10,
  smoothing_window: 5,
  allow_short: false,
  initial_capital: 10000,
  transaction_cost_bps: 10,
};

const money = (x) => `$${Math.round(x).toLocaleString()}`;

// One-line outcome: did following the model beat just holding?
function Verdict({ result }) {
  const { metrics, curve, params } = result;
  if (!curve?.length) return null;
  const s = metrics.strategy, b = metrics.buy_hold;
  const beat = s.total_return >= b.total_return;
  const pp = Math.abs((s.total_return - b.total_return) * 100).toFixed(1);
  const last = curve[curve.length - 1];
  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border px-4 py-3 text-sm ${
      beat ? "border-emerald-500/30 bg-emerald-500/5" : "border-rose-500/25 bg-rose-500/5"}`}>
      {beat
        ? <Trophy className="h-4 w-4 shrink-0 text-emerald-500" />
        : <ShieldAlert className="h-4 w-4 shrink-0 text-rose-500" />}
      <span className="font-medium">
        {beat ? `Strategy beat Buy & Hold by ${pp}pp` : `Buy & Hold won by ${pp}pp`}
      </span>
      <span className="ml-auto font-mono text-xs tabular-nums text-muted-foreground">
        {money(params.initial_capital)} → <span className="text-emerald-500">{money(last.equity)}</span> strategy
        · {money(last.buy_hold_equity)} B&H
      </span>
    </div>
  );
}

export default function Dashboard() {
  const [params, setParams] = useState(DEFAULT_PARAMS);
  const debouncedParams = useDebounce(params, 200);
  const health = useHealth();
  const modelLoaded = health.data?.model_loaded;

  // Auto-runs whenever (debounced) params change; previous result stays on screen.
  const sim = useSimulation(debouncedParams, !!modelLoaded);
  const result = sim.data;

  const reset = () => setParams(DEFAULT_PARAMS);

  // Surface backend errors (e.g. model not loaded) without tearing down the UI.
  useEffect(() => {
    if (sim.isError) toast.error(sim.error.message);
  }, [sim.isError, sim.error]);

  return (
    <>
      <Navbar>
        <SentimentTester />
        <Badge variant="outline" className="gap-1.5">
          <CircleDot className={`h-3 w-3 ${modelLoaded ? "text-emerald-500" : "text-amber-500"}`} />
          <span className="hidden sm:inline">
            {health.isLoading ? "connecting…" : modelLoaded ? "model loaded" : "model not loaded"}
          </span>
        </Badge>
      </Navbar>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight">Trading simulation</h1>
            <Badge variant="outline" className="font-mono text-[10px]">BTC-USD · 2021–2023</Badge>
          </div>
          <p className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
            Fine-tuned FinBERT <ArrowRight className="h-3.5 w-3.5" /> daily signals
            <ArrowRight className="h-3.5 w-3.5" /> backtest vs buy-and-hold
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <Controls params={params} setParams={setParams} onReset={reset} fetching={sim.isFetching} />
            <PipelineStatus active={sim.isFetching && !!modelLoaded} />
          </aside>

          <main className="space-y-4">
            {health.isLoading || (modelLoaded && !result && !sim.isError) ? (
              <SkeletonDashboard />
            ) : result ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <Verdict result={result} />
                <MetricsCards metrics={result.metrics} />
                <Tabs defaultValue="equity">
                  <TabsList>
                    <TabsTrigger value="equity">Equity curve</TabsTrigger>
                    <TabsTrigger value="price">Price &amp; sentiment</TabsTrigger>
                  </TabsList>
                  <TabsContent value="equity" className="mt-3">
                    <EquityCurve curve={result.curve} initialCapital={result.params?.initial_capital} />
                  </TabsContent>
                  <TabsContent value="price" className="mt-3">
                    <PriceChart curve={result.curve} />
                  </TabsContent>
                </Tabs>
              </motion.div>
            ) : (
              <Card>
                <CardContent className="grid place-items-center gap-3 py-20 text-center text-muted-foreground">
                  <Rocket className="h-8 w-8 text-primary" />
                  <p>Set your strategy on the left and hit <b className="text-foreground">Run simulation</b>.</p>
                  {!modelLoaded && !health.isLoading && (
                    <p className="text-xs">
                      Heads up: the model isn’t loaded yet — drop the exported folder into{" "}
                      <code className="rounded bg-secondary px-1">backend/model/</code>.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </main>
        </div>
      </div>
    </>
  );
}
