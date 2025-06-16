"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn("relative flex w-full touch-none select-none items-center", className)}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-blue-100 dark:bg-blue-900/40">
      <SliderPrimitive.Range className="absolute h-full bg-[#1D40AF] dark:bg-blue-500" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-6 w-6 rounded-full border-2 border-[#1D40AF] bg-white shadow-lg ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D40AF] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:border-blue-500 dark:bg-blue-50 dark:ring-offset-slate-950 dark:focus-visible:ring-blue-500">
      <div className="absolute inset-0 rounded-full bg-[#1D40AF]/10 opacity-0 transition-opacity hover:opacity-100" />
    </SliderPrimitive.Thumb>
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
