"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-slate-100 p-1 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
      className,
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow-sm dark:ring-offset-slate-950 dark:focus-visible:ring-slate-300 dark:data-[state=active]:bg-slate-950 dark:data-[state=active]:text-slate-50",
      className,
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    /* Always keep the panel mounted so heavy children (e.g. charts) can
       initialise once and simply stay in the DOM when their tab becomes active. */
    forceMount
    className={cn(
      "mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 dark:ring-offset-slate-950 dark:focus-visible:ring-slate-300",
      /* ------------------------------------------------------------------
         Stack all panels in the same grid cell so they all have the same
         dimensions. Control visibility with opacity instead of positioning.
         This ensures chart containers always have correct dimensions.
      ------------------------------------------------------------------ */
      "grid-row-1 grid-col-1", // All panels occupy the same grid cell
      "transition-opacity duration-300", // Smooth transition between panels
      "data-[state=inactive]:opacity-0 data-[state=inactive]:pointer-events-none", // Hide inactive panels
      "data-[state=active]:opacity-100 data-[state=active]:z-10", // Show active panel on top
      className,
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

// Modified Tabs component that wraps content in a grid container
const TabsContentGrid = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content> & {
    wrapperClassName?: string;
  }
>(({ className, wrapperClassName, ...props }, ref) => (
  <div className={cn("grid grid-cols-1 grid-rows-1", wrapperClassName)}>
    <TabsContent ref={ref} className={className} {...props} />
  </div>
))
TabsContentGrid.displayName = "TabsContentGrid"

export { Tabs, TabsList, TabsTrigger, TabsContent, TabsContentGrid }
