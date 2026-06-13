// Strategy controls — compact Leva-style rows driving the simulation live.
import { RotateCcw, Loader2, SlidersHorizontal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RowSlider } from "@/components/ui/row-slider";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// One-click strategy presets (initial capital is left untouched).
const PRESETS = [
  { name: "Default",   p: { threshold: 0.10, smoothing_window: 5, allow_short: false, transaction_cost_bps: 10 } },
  { name: "Patient",   p: { threshold: 0.15, smoothing_window: 7, allow_short: false, transaction_cost_bps: 10 } },
  { name: "Twitchy",   p: { threshold: 0.05, smoothing_window: 1, allow_short: false, transaction_cost_bps: 10 } },
  { name: "Shorts on", p: { threshold: 0.10, smoothing_window: 5, allow_short: true,  transaction_cost_bps: 10 } },
];

const presetActive = (params, p) =>
  Object.entries(p).every(([k, v]) => params[k] === v);

export default function Controls({ params, setParams, onReset, fetching }) {
  const set = (key, value) => setParams({ ...params, [key]: value });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <SlidersHorizontal className="h-4 w-4 text-[#f7931a]" /> Strategy
          {fetching && <Loader2 className="ml-auto h-3.5 w-3.5 animate-spin text-muted-foreground" />}
        </CardTitle>
      </CardHeader>
      <CardContent
        aria-disabled={fetching}
        className={`space-y-2.5 transition-opacity ${fetching ? "pointer-events-none opacity-50" : ""}`}
      >
        {/* presets */}
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map(({ name, p }) => (
            <button key={name} type="button"
              onClick={() => setParams({ ...params, ...p })}
              className={`rounded-full px-2.5 py-1 text-xs ring-1 transition ${
                presetActive(params, p)
                  ? "bg-[#f7931a]/15 font-medium text-[#f7931a] ring-[#f7931a]/40"
                  : "bg-secondary/70 text-muted-foreground ring-border/60 hover:text-foreground"}`}>
              {name}
            </button>
          ))}
        </div>

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

        <p className="pt-0.5 text-center text-xs text-muted-foreground">
          Changes apply live as you adjust them.
        </p>
        <Button variant="outline" className="w-full" onClick={onReset}>
          <RotateCcw className="h-4 w-4" /> Reset to defaults
        </Button>
      </CardContent>
    </Card>
  );
}
