# PUM – Comprehensive UI Fix Guide  
_v1.0 · July 2025_

This document enumerates **all UI issues identified during the 2025 mobile QA audit** and provides complete, copy-pastable solutions.  
Each section contains:

• Symptom reproduced on production  
• Root-cause analysis (file & line)  
• Exact React / Tailwind patch  
• Manual QA checklist  
• Automated-test strategy

🚨 **Scope guard** – We never touch `public/data/products.json` or any other catalogue file. All changes are limited to the React codebase.

---

## 0 · Issue matrix & priorities

| Prio | Ref | Problem | Main file(s) to edit |
|------|-----|---------|----------------------|
| **P0** | 1 | Dev error toast displayed in production | `contexts/AddressSearchContext.tsx` |
| **P1** | 2 | Header consumes >30 % of viewport height on mobile | `app/layout.tsx`, `components/mobile-progress-bar.tsx` |
| **P1** | 3 | Coverage-rate value unreadable (white on light bar) | `components/steps/results.tsx` |
| **P2** | 4 | Long text in Financial-Aid card overflows | `components/steps/financial-aid.tsx` |
| **P2** | 5 | Rainfall charts & toggle must disappear (stats only) | `components/rainfall-details.tsx` |
| **P2** | 6 | Product images require solid white backdrop | `components/steps/recommended-products.tsx` |

---

## 1 · P0 – Remove development error toast

### Symptom  
When the address-autocomplete API is unreachable a **red Sonner toast** appears on mobile production screens.

### Root cause  
`toast.error()` is called unconditionally inside `catch` block of `fetchAddressSuggestions`.

### Solution  
Guard the toast with `process.env.NODE_ENV === "development"`.

### Code patch – `contexts/AddressSearchContext.tsx`
```diff
-import { toast } from "@/components/ui/sonner"
+import { toast } from "@/components/ui/sonner"

...
 catch (err) {
-  toast.error("Error fetching address suggestions: " + (err as Error).message)
+  if (process.env.NODE_ENV === "development") {
+    toast.error(
+      "Error fetching address suggestions: " + (err as Error).message,
+    )
+  } else {
+    console.warn("[AddressSearch] suggest error:", err)
+  }
   setState((s) => ({ ...s, isSearching: false }))
}
```

### QA checklist  
1. Disable network → search → no red toast in prod build (`NODE_ENV=production`).  
2. Enable dev mode → toast still visible.

### Testing strategy  
• **RTL unit test** mocks `NODE_ENV` and asserts `toast.error` called only in dev.  
• **Cypress** offline scenario on mobile viewport.

---

## 2 · P1 – Mobile header height

### Symptom  
On iPhone SE viewport the gradient hero band pushes the simulator wizard below the fold; user must scroll before seeing step content.

### Root cause  
`<Header/>` (logo + gradient) is always rendered. Mobile progress bar is rendered **after** the header, duplicating top space.

### Solution  
Hide desktop header when width ≤ 640 px and make the mobile progress bar sticky to the top.

### Code patch – `app/layout.tsx`
```diff
-<Header />
+{/* desktop only */}
+<div className="hidden sm:block">
+  <Header />
+</div>
```

Add helper spacer (prevents jump when switching breakpoints):
```tsx
function MobileHeaderSpacer() {
  return <div className="sm:hidden h-2" />
}
```
Insert `<MobileHeaderSpacer />` just before `{children}`.

### Code patch – `components/mobile-progress-bar.tsx`
```diff
-<div className={`w-full overflow-x-auto ${className}`}>
+<div
+  className={`w-full overflow-x-auto sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur ${className}`}
+>
```

### QA checklist  
1. iPhone SE: first wizard step is fully visible, no header gradient.  
2. ≥ sm width: original header still present.  
3. Scrolling keeps progress bar pinned.

### Testing strategy  
• **Cypress** view-port 375×667 screenshot diff.  
• Lighthouse mobile CLS check (< 0.1).

---

## 3 · P1 – Coverage-rate text invisible

### Symptom  
Percentage text (`83 %`) inside progress bar is white while bar background at low coverage (<50 %) is light blue → unreadable.

### Root cause  
Text colour hard-coded to `text-white`.

### Solution  
Switch text colour to dark when bar colour is light.

### Code patch – `components/steps/results.tsx`
```diff
-<div className={`absolute top-0 h-full flex items-center ... font-bold text-white text-xs md:text-sm ...`}
+const textColor =
+  coveragePercentage < 50 ? "text-slate-900 dark:text-white" : "text-white"
+
+<div
+  className={`absolute top-0 h-full flex items-center ... font-bold ${textColor} text-xs md:text-sm ...`}
```

### QA checklist  
• Test with 25 %, 55 %, 90 % values in both themes → text readable.  
• Visual regression via Percy.

### Testing strategy  
Jest/RTL renders component with 40 % → element has `text-slate-900`.

---

## 4 · P2 – Financial-Aid card overflow

### Symptom  
Organisation names or long condition strings push the “Montant” column causing layout break on small screens.

### Root cause  
Each row is built with `flex justify-between` → fixed gap; long left text overlaps right value.

### Solution  
Replace row with CSS grid (two columns) so text wraps naturally.

### Code patch – `components/steps/financial-aid.tsx`
```diff
-<div className="flex justify-between items-center">
+<div className="grid grid-cols-[auto_1fr] gap-2 items-start">
...
-<span className="font-medium text-gray-800 ...">{aid.organization}</span>
+<span className="font-medium text-gray-800 ... text-right break-words">
+  {aid.organization}
+</span>
```
Apply same pattern to **Montant** & **Conditions** rows.

### QA checklist  
1. iPhone SE: no horizontal scroll, all labels wrap.  
2. Desktop unaffected.  

### Testing strategy  
Percy snapshot diff after injecting 70-char organisation string.

---

## 5 · P2 – Remove rainfall charts (keep stats only)

### Symptom  
Design decision: monthly/cumulative charts no longer required; only high-level stats must remain.

### Root cause  
`RainfallDetails` contains expandable area (`isExpanded`, `<Tabs>`, charts).

### Solution  
Strip toggle button, `isExpanded` state, and the entire charts container. Component ends after the three `StatCard` blocks.

### Code patch – `components/rainfall-details.tsx` (excerpt)
```diff
-// 🔥  delete Button & Chevron imports
-import { Button } from "@/components/ui/button"
-import { ChevronDown, ChevronUp } from "lucide-react"
-// 🔥  delete chart imports (MonthlyRainfallChart, etc.)
-// 🔥  remove useState isExpanded
...
-// 🔥  delete toggle header section (Button, Chevron icons)
-<h3 className="mb-6 text-xl font-semibold text-blue-800 dark:text-blue-300">
-  Détails des précipitations
-</h3>
...
-// 🔥  delete <motion.div> ...charts...
-// The file now terminates right here.
+</div> {/* end of CardContent */}
```

### QA checklist  
1. Rainfall card shows only total / wettest / driest blocks.  
2. No “Voir les détails” button.  
3. No console errors from missing imports.

### Testing strategy  
RTL render → assert absence of any element with role `tablist` and button text “Voir les détails”.

---

## 6 · P2 – White background under product images

### Symptom  
Transparent PNG renders float above light-grey gradient; blend with page background.

### Root cause  
Image wrapper div uses only gradient background; nothing underneath if gradient edge trimmed.

### Solution  
Add solid white layer underneath gradient.

### Code patch – `components/steps/recommended-products.tsx`  
Inside **`ProductCard`** (≈ line 180):

```diff
-<div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center overflow-hidden">
+<div className="aspect-video bg-white relative flex items-center justify-center overflow-hidden">
+  <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700"></div>
```

No other changes required.

### QA checklist  
1. All product cards show white canvas behind PNG (zoom 400 %).  
2. Hover scale effect intact.  
3. Dark mode retains gradient tint.

### Testing strategy  
Percy diff on product grid; compare baseline & patch.

---

## 7 · Regression-test summary

| Area | Tool | Scenario |
|------|------|----------|
| Address toast | RTL | No toast in production env |
| Header layout | Cypress | Mobile viewport first screen visible |
| Coverage text | RTL | Text colour dark when coverage < 50 % |
| Aid card | Percy | Long strings wrap without overlap |
| Rainfall details | RTL | No charts / toggle present |
| Product card images | Percy | White backdrop under all images |

---

### Done – ship it 🚀
