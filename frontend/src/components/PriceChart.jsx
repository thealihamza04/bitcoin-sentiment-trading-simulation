// BTC price (area) + daily sentiment (line) using TradingView lightweight-charts.
import { useEffect, useRef } from "react";
import { createChart, AreaSeries, LineSeries } from "lightweight-charts";
import { CandlestickChart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PriceChart({ curve }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !curve?.length) return;

    const chart = createChart(containerRef.current, {
      height: 300,
      layout: {
        background: { color: "transparent" },
        textColor: "#a1a1aa",
        fontFamily: "inherit",
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.05)" },
        horzLines: { color: "rgba(255,255,255,0.05)" },
      },
      rightPriceScale: { borderColor: "rgba(255,255,255,0.1)" },
      timeScale: { borderColor: "rgba(255,255,255,0.1)" },
      crosshair: { mode: 1 },
      autoSize: true,
    });

    // BTC price as an orange area on the right scale.
    const priceSeries = chart.addSeries(AreaSeries, {
      priceScaleId: "right",
      lineColor: "#f7931a",
      topColor: "rgba(247,147,26,0.4)",
      bottomColor: "rgba(247,147,26,0)",
      lineWidth: 2,
    });
    priceSeries.setData(curve.map((d) => ({ time: d.date, value: d.close })));

    // Sentiment as a blue line on a separate overlay scale [-1, 1].
    const sentSeries = chart.addSeries(LineSeries, {
      priceScaleId: "sentiment",
      color: "#3b82f6",
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
    });
    sentSeries.setData(
      curve.filter((d) => d.sentiment != null).map((d) => ({ time: d.date, value: d.sentiment }))
    );
    chart.priceScale("sentiment").applyOptions({
      scaleMargins: { top: 0.1, bottom: 0.1 },
      visible: false,
    });

    chart.timeScale().fitContent();
    return () => chart.remove();
  }, [curve]);

  if (!curve?.length) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CandlestickChart className="h-4 w-4 text-primary" /> BTC price
          <span className="ml-1 text-xs font-normal text-muted-foreground">
            (orange) vs sentiment (blue)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={containerRef} className="w-full" style={{ height: 300 }} />
      </CardContent>
    </Card>
  );
}
