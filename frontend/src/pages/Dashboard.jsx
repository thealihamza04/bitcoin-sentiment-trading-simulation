import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { CircleDot, Rocket } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "../components/Navbar";
import Controls from "../components/Controls";
import SentimentTester from "../components/SentimentTester";
import MetricsCards from "../components/MetricsCards";
import EquityCurve from "../components/EquityCurve";
import PriceChart from "../components/PriceChart";
import SkeletonDashboard from "../components/SkeletonDashboard";
import { useHealth, useSimulation } from "../hooks";

const DEFAULT_PARAMS = {
  threshold: 0.1,
  smoothing_window: 3,
  allow_short: false,
  initial_capital: 10000,
  transaction_cost_bps: 10,
};

export default function Dashboard() {
  const [params, setParams] = useState(DEFAULT_PARAMS);
  const health = useHealth();
  const sim = useSimulation();
  const autoRan = useRef(false);

  const onRun = () =>
    sim.mutate(params, { onError: (e) => toast.error(e.message) });

  const modelLoaded = health.data?.model_loaded;
  const result = sim.data;

  // Auto-run the default simulation once the model is ready → skeletons → results.
  useEffect(() => {
    if (modelLoaded && !autoRan.current) {
      autoRan.current = true;
      sim.mutate(DEFAULT_PARAMS, { onError: (e) => toast.error(e.message) });
    }
  }, [modelLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <Navbar>
        <SentimentTester />
        <Badge variant="outline" className="gap-1.5">
          <CircleDot className={`h-3 w-3 ${modelLoaded ? "text-emerald-500" : "text-amber-500"}`} />
          {health.isLoading ? "connecting…" : modelLoaded ? "model loaded" : "model not loaded"}
        </Badge>
      </Navbar>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-5">
          <h1 className="text-xl font-semibold tracking-tight">Trading simulation</h1>
          <p className="text-sm text-muted-foreground">
            Fine-tuned FinBERT → daily signals → backtest vs buy-and-hold
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <aside className="space-y-4">
            <Controls params={params} setParams={setParams} onRun={onRun} loading={sim.isPending} />
          </aside>

          <main className="space-y-4">
            {sim.isPending || health.isLoading || (modelLoaded && !result && !sim.isError) ? (
              <SkeletonDashboard />
            ) : result ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <MetricsCards metrics={result.metrics} />
                <Tabs defaultValue="equity">
                  <TabsList>
                    <TabsTrigger value="equity">Equity curve</TabsTrigger>
                    <TabsTrigger value="price">Price &amp; sentiment</TabsTrigger>
                  </TabsList>
                  <TabsContent value="equity" className="mt-3">
                    <EquityCurve curve={result.curve} />
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
