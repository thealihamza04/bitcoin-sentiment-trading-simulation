// Compact "Leva-style" slider: the whole row is the control — label on the left,
// value on the right, an accent fill from the left up to the handle.
import { Slider as SliderPrimitive } from "@base-ui/react/slider";
import { cn } from "@/lib/utils";

export function RowSlider({
  label,
  value,
  display,
  min = 0,
  max = 100,
  step = 1,
  onValueChange,
  className,
}) {
  // Base UI's Indicator only fills between thumbs (zero width for a single value),
  // so we draw the left fill ourselves from the value.
  const pct = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

  return (
    <SliderPrimitive.Root
      value={value}
      min={min}
      max={max}
      step={step}
      thumbAlignment="edge"
      onValueChange={(v) => onValueChange(Array.isArray(v) ? v[0] : v)}
      className={cn("w-full", className)}>
      <SliderPrimitive.Control
        className="group relative flex h-9 w-full cursor-ew-resize items-center overflow-hidden rounded-lg bg-secondary/70 px-3 ring-1 ring-border/60 transition select-none hover:ring-border data-disabled:cursor-not-allowed data-disabled:opacity-50">
        {/* Accent fill from the left up to the current value */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 bg-gradient-to-r from-[#f7931a]/25 to-[#f7931a]/45 transition-[width] duration-75"
          style={{ width: `${pct}%` }} />

        {/* Label + value sit on top and don't block dragging */}
        <span className="pointer-events-none relative z-10 text-sm text-muted-foreground">
          {label}
        </span>
        <span className="pointer-events-none relative z-10 ml-auto font-mono text-sm tabular-nums">
          {display ?? value}
        </span>

        {/* Thin vertical drag handle */}
        <SliderPrimitive.Thumb
          className="absolute z-10 h-5 w-[3px] -translate-x-1/2 rounded-full bg-[#f7931a] shadow-sm select-none after:absolute after:-inset-x-2 after:inset-y-0 focus-visible:outline-none" />
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  );
}
