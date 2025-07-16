# Fixing Chart Rendering Inside Hidden Tabs

This document explains **why Recharts graphs were not displaying after switching tabs** and how we solved the problem.  
Use it as a playbook whenever you embed _any_ component that needs to measure its container (charts, maps, data-grids, etc.) inside a tab system that hides inactive panels.

---

## 1&nbsp;·&nbsp;The Original Problem

1. `RainfallDetails` shows several `<Tabs>` (Monthly, Cumulative, Composition, Table).  
2. Only the active panel is visible; Radix UI hides all others by applying the inline style `display: none` to each `<TabsContent>`.  
3. All three chart components (`MonthlyRainfallChart`, `CumulativeRainfallChart`, `PrecipitationCompositionChart`) mount **immediately** because we pass `forceMount`, but their _wrapper_ `<div>` still has `display:none`.  
4. `ResponsiveContainer` (from **Recharts**) measures its parent on mount, receives **0 × 0** and caches the value.  
5. When a user switches tabs Radix removes `display:none`, yet Recharts never re-measures, leaving an invisible 0 × 0 SVG.

The result: blank panels and confused users.

---

## 2&nbsp;·&nbsp;Why Does This Happen?

| Layer | What it does | Hidden-tab effect |
|-------|--------------|-------------------|
| **Browser layout engine** | Skips layout for nodes with `display:none` → reported size is 0. | Parent container of chart is 0 × 0. |
| **Recharts `ResponsiveContainer`** | Reads `offsetWidth/Height` during `componentDidMount` once. | Caches 0 × 0 forever. |
| **Tab library** (Radix) | Hides inactive content with inline `display:none`. | Triggers the entire failure chain. |

Because inline styles outrank CSS classes, simply adding `display:block` in a stylesheet will not override it.

---

## 3&nbsp;·&nbsp;Solution Overview

We attacked the problem from **both ends**:

1. **UI Layer fix** – customise `<TabsContent>` so _inactive_ panels stay in the DOM *and* keep their natural dimensions.
2. **Chart Layer fix** – introduce `useChartVisibility` hook that:
   - Watches when a chart becomes visible (Intersection Observer).
   - Forces Recharts to re-measure by bumping a `key` whenever size/visibility changes.

### 3.1  TabsContent override (`components/ui/tabs.tsx`)

\`\`\`tsx
<TabsPrimitive.Content
  forceMount   // stops Radix from unmounting
  className={cn(
    "relative",
    /* Hide visually but keep in layout tree */
    "data-[state=inactive]:absolute data-[state=inactive]:-left-[200vw]",
    "data-[state=inactive]:opacity-0 data-[state=inactive]:pointer-events-none",
  )}
>
  {children}
</TabsPrimitive.Content>
\`\`\`

Key points:

* We **don’t touch `display`**. Instead we move inactive panels far off-screen (`left:-200vw`), preserve width/height, set `opacity:0`, and disable interaction.
* `forceMount` guarantees the component is never unmounted, so expensive children initialise only once.

### 3.2  Visibility / Resize hook (`hooks/use-chart-visibility.ts`)

Core features:

* `IntersectionObserver` → sets `isVisible` when at least 10 % of the chart enters the viewport.
* `ResizeObserver` → updates when container dimensions change (e.g., window resize, sidebar toggle).
* An `updateTrigger` counter is incremented to invalidate the chart by passing it as `key` to `ResponsiveContainer`.

Usage inside a chart:

\`\`\`tsx
const { ref: containerRef, isVisible, updateTrigger } = useChartVisibility();

return (
  <div ref={containerRef} className="w-full h-[300px]">
    {!(mounted && isVisible) ? <Placeholder /> : (
      <ResponsiveContainer key={updateTrigger}>
        {/* chart */}
      </ResponsiveContainer>
    )}
  </div>
);
\`\`\`

---

## 4&nbsp;·&nbsp;How the Fix Works Internally

1. When the page loads every tab’s panel exists at the same coordinates off-screen.  
   ➜ `ResponsiveContainer` now measures a **real** width/height (because the element participates in layout) and renders correctly.
2. When the user activates another tab we simply teleport the panel back into view (absolute → static).  
   ➜ Chart already has proper dimensions, nothing else needed.
3. If container size changes later (e.g., mobile rotate) `ResizeObserver` triggers `updateTrigger`, React re-mounts `ResponsiveContainer` with a new `key`, and Recharts performs a fresh measurement.

No manual `window.dispatchEvent(new Event('resize'))` hacks are required.

---

## 5&nbsp;·&nbsp;Applying This Pattern Elsewhere

* Works for **any framework** that:
  - Mounts all tab panels (or accordions, carousels, etc.) simultaneously; and
  - Hides inactive ones with `display:none`.
* Libraries known to require visible dimensions:
  - Recharts, Victory, Visx
  - Leaflet / Mapbox maps
  - AG-Grid, DataGrid, virtualised lists
* Checklist:
  1. Ensure the component always mounts (`forceMount` or unconditional render).
  2. Replace `display:none` with off-screen positioning or `visibility:hidden; position:absolute;`.
  3. (Optional) Add a visibility/resize observer to trigger re-measure for libraries that cache size.

---

## 6&nbsp;·&nbsp;Testing Recommendations

1. **Unit** – Jest/RTL render the tab set, assert that inactive panel has `left:-200vw` not `display:none`.
2. **E2E** – Cypress/Playwright script:
   - Visit simulator page.
   - Switch through all tabs on desktop & mobile viewport widths.
   - Take screenshot diff → charts must be visible.
3. **Performance** – Verify charts initialise **once**:
   - Add `console.count('mount MonthlyChart')`.
   - Mount count should remain **1** after cycling through tabs.
4. **Accessibility** – Using Axe:
   - Ensure off-screen panels are not focusable (`pointer-events:none`, `tabindex="-1"` if necessary).
5. **Regression guard** – Add a unit test that fails if future library updates re-introduce `display:none`.

---

## 7&nbsp;·&nbsp;Further Reading

* Radix UI Tabs docs – `forceMount` prop  
* [MDN docs: `display` vs `visibility` vs off-screen positioning](https://developer.mozilla.org/)
* Recharts issue #172 (#responsive-container-zero-width)

---

_Last updated: 2025-06-23_
