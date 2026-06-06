import { Slider as SliderPrimitive } from "@base-ui/react/slider"

import { cn } from "@/lib/utils"

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  ...props
}) {
  const _values = Array.isArray(value)
    ? value
    : Array.isArray(defaultValue)
      ? defaultValue
      : [min, max]

  return (
    <SliderPrimitive.Root
      className={cn("data-horizontal:w-full data-vertical:h-full", className)}
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      thumbAlignment="edge"
      {...props}>
      <SliderPrimitive.Control
        className="group/slider relative flex w-full cursor-pointer touch-none items-center py-1.5 select-none data-disabled:cursor-not-allowed data-disabled:opacity-50">
        <SliderPrimitive.Track
          data-slot="slider-track"
          className="relative h-2 w-full grow overflow-hidden rounded-full bg-muted select-none">
          <SliderPrimitive.Indicator
            data-slot="slider-range"
            className="h-full rounded-full bg-gradient-to-r from-[#f7931a] to-[#ffb347] select-none" />
        </SliderPrimitive.Track>
        {Array.from({ length: _values.length }, (_, index) => (
          <SliderPrimitive.Thumb
            data-slot="slider-thumb"
            key={index}
            className={cn(
              "relative block size-4 shrink-0 rounded-full border-2 border-[#f7931a] bg-background shadow-md select-none",
              "cursor-grab transition-[transform,box-shadow] after:absolute after:-inset-2",
              "hover:scale-110 hover:shadow-[0_0_0_4px_rgba(247,147,26,0.15)]",
              "focus-visible:outline-none focus-visible:shadow-[0_0_0_4px_rgba(247,147,26,0.25)]",
              "active:cursor-grabbing active:scale-105",
              "disabled:pointer-events-none disabled:opacity-50"
            )} />
        ))}
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  );
}

export { Slider }
