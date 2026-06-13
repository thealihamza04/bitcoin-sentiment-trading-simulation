// Strategy vs buy-and-hold portfolio value (Recharts inside a shadcn Card).
// Shaded bands mark when the model held a position (green = long, red = short);
// the dashed line is the starting capital.
import {
  Area, AreaChart, CartesianGrid, Legend, ReferenceArea, ReferenceLine,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { LineChart as LineChartIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const money = (x) => `$${Math.round(x).toLocaleString()}`;

// "2021-05-21" -> "May 2021" for axis ticks; "21 May 2021" for the tooltip.
const monthYear = (d) =>
  new Date(d).toLocaleDateString("en-US", { month: "short", year: "numeric" });
const fullDate = (d) =>
  new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });

// Contiguous date ranges where the strategy held the given position.
function positionSegments(curve, pos) {
  const segs = [];
  let start = null;
  for (const d of curve) {
    if (d.position === pos && start === null) start = d.date;
    if (d.position !== pos && start !== null) { segs.push([start, d.date]); start = null; }
  }
  if (start !== null) segs.push([start, curve[curve.length - 1].date]);
  return segs;
}

export default function EquityCurve({ curve, initialCapital = 10000 }) {
  if (!curve?.length) return null;
  const last = curve[curve.length - 1];
  const longSegs = positionSegments(curve, 1);
  const shortSegs = positionSegments(curve, -1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
          <LineChartIcon className="h-4 w-4 text-primary" /> Equity curve
          <span className="ml-auto font-mono text-xs font-normal tabular-nums">
            <span className="text-emerald-500">{money(last.equity)}</span>
            <span className="text-muted-foreground"> vs {money(last.buy_hold_equity)} B&H</span>
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={curve} margin={{ top: 8, right: 12, bottom: 0, left: 8 }}>
            <defs>
              <linearGradient id="gStrat" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />

            {/* when the model was in the market */}
            {longSegs.map(([a, b], i) => (
              <ReferenceArea key={`l${i}`} x1={a} x2={b} fill="#10b981" fillOpacity={0.07} strokeOpacity={0} />
            ))}
            {shortSegs.map(([a, b], i) => (
              <ReferenceArea key={`s${i}`} x1={a} x2={b} fill="#f43f5e" fillOpacity={0.07} strokeOpacity={0} />
            ))}
            <ReferenceLine y={initialCapital} stroke="var(--muted-foreground)" strokeOpacity={0.5} strokeDasharray="4 4" />

            <XAxis dataKey="date" minTickGap={48} tickFormatter={monthYear} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
            <YAxis tickFormatter={money} width={70} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
            <Tooltip
              contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
              labelFormatter={fullDate}
              formatter={(v) => money(v)} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area type="monotone" dataKey="equity" name="Strategy" stroke="#10b981" fill="url(#gStrat)" strokeWidth={2}
                  isAnimationActive animationDuration={400} animationEasing="ease-out" />
            <Area type="monotone" dataKey="buy_hold_equity" name="Buy & Hold" stroke="#71717a" fill="transparent" strokeWidth={1.5}
                  isAnimationActive animationDuration={400} animationEasing="ease-out" />
          </AreaChart>
        </ResponsiveContainer>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          <span className="text-emerald-500">Green bands</span> = model holding BTC
          {shortSegs.length > 0 && <> · <span className="text-rose-500">red bands</span> = short</>}
          {" "}· unshaded = sitting in cash · dashed line = starting capital
        </p>
      </CardContent>
    </Card>
  );
}
