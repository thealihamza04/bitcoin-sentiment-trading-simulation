// Strategy controls — compact Leva-style rows driving the simulation.
import { Play, Loader2, SlidersHorizontal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RowSlider } from "@/components/ui/row-slider";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Controls({ params, setParams, onRun, loading }) {
  const set = (key, value) => setParams({ ...params, [key]: value });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <SlidersHorizontal className="h-4 w-4 text-[#f7931a]" /> Strategy
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2.5">
        <RowSlider label="Sentiment threshold" value={params.threshold}
                   min={0} max={0.8} step={0.01} display={params.threshold.toFixed(2)}
                   onValueChange={(v) => set("threshold", v)} />

        <RowSlider label="Smoothing window" value={params.smoothing_window}
                   min={1} max={14} step={1} display={`${params.smoothing_window} d`}
                   onValueChange={(v) => set("smoothing_window", v)} />

        <RowSlider label="Transaction cost" value={params.transaction_cost_bps}
                   min={0} max={50} step={1} display={`${params.transaction_cost_bps} bps`}
                   onValueChange={(v) => set("transaction_cost_bps", v)} />

        {/* Allow short — same row aesthetic */}
        <div className="flex h-9 items-center justify-between rounded-lg bg-secondary/70 px-3 ring-1 ring-border/60">
          <span className="text-sm text-muted-foreground">Allow short positions</span>
          <Switch checked={params.allow_short} onCheckedChange={(v) => set("allow_short", v)} />
        </div>

        {/* Initial capital — inline editable row */}
        <div className="flex h-9 items-center justify-between rounded-lg bg-secondary/70 px-3 ring-1 ring-border/60">
          <span className="text-sm text-muted-foreground">Initial capital</span>
          <Input type="number" min={1000} step={1000} value={params.initial_capital}
                 onChange={(e) => set("initial_capital", Number(e.target.value))}
                 className="h-6 w-28 border-0 bg-transparent px-0 text-right font-mono text-sm shadow-none focus-visible:ring-0 dark:bg-transparent" />
        </div>

        <Button className="mt-1 w-full" onClick={onRun} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          {loading ? "Running…" : "Run simulation"}
        </Button>
      </CardContent>
    </Card>
  );
}
