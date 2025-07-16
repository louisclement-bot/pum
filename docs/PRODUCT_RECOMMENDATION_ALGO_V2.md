# Product Recommendation Algorithm – Current State & Refactor Blueprint  
_Last update: 2025-06-23_

---

## 1. Scope  

This document analyses the **existing** product-recommendation flow (tanks & pumps) and details the **V2 rules** requested by business. It is the implementation blueprint for the upcoming refactor `droid/product-reco-refactor`.

> The JSON catalogue in `public/data/products.json` **must remain untouched**.  
> All logic changes happen in TypeScript only.

---

## 2. Current Architecture (v1)

### 2.1 Core helpers (all in `lib/productService.ts`)

| Helper | Responsibility |
|--------|----------------|
| `fetchProducts()` | Load catalogue (API → static) & memoise. |
| `sortByPriority()` | Secondary ordering: `display_priority` → volume. |
| `getRecommendedTanks(recommendedSize, usages, limit = 3)` | Returns **≤3** tanks mixing aerial & buried depending on indoor usage. Size logic uses “ideal/acceptable/fallback” ranges. Ratio: 2 buried + 1 aerial (if indoor) or 1 buried + 2 aerial (garden-only). |
| `getAdditionalRecommendedTanks(recommendedSize, usages, topProducts)` | Adds up to 9 extra tanks.<br>• Mixed = 6 buried + 3 aerial<br>• Indoor-only = 9 buried<br>• Garden-only = 5 aerial + 4 buried |
| `getCompatiblePumps(usages, recommendedTanks?)` | Heuristic string matching & volume compatibility arrays. Returns ≤ 2 pumps. |
| UI helpers | `isBestsellerProduct()`, `getProductFeatures()` (visual only). |

### 2.2 UI consumer  

`components/steps/recommended-products.tsx`

1. Calls helpers inside a `useEffect` to compute **top-3**, **additional 9**, **pumps**.  
2. Displays **top-3** by default with “Voir plus” to reveal the rest.  
3. Pump section shows up to 3 cards (helpers supply max 2).

### 2.3 Shortcomings vs new business requirements

| Requirement | v1 status |
|-------------|-----------|
| Indoor usage ⇒ only buried tanks | v1 still delivers mixed results. |
| Garden-only ⇒ exactly 2 aerial + 1 buried (optional) | Ratio & option not enforced. |
| Capacity rounding to *nearest available ≥ need* | v1 uses broad % ranges; can overshoot. |
| Top-3 = closest capacities | Priority sometimes outweighs proximity. |
| Next-6 = same filter logic | Partially compliant; affected by new ratios. |
| Pump selection matrix (3 literal names) | Heuristic may return wrong kits. |

---

## 3. V2 – Target Rules

### 3.1 Tank-selection logic

1. **Indoor present** (`toilet` *or* `washing`): **only buried tanks**.  
2. **Garden-only**: aim for **3 results** → 2 aerial + 1 buried. The buried one is included **only if** a buried capacity ≥ need exists, otherwise return just the 3 aerial.  
3. **Top-3** = tanks with capacities **closest to, but not below,** `roundedNeed`; distance primary, `display_priority` tie-breaker.  
4. **Next-6**: continue the same filter and ordering until **max 9** total.

### 3.2 Capacity rounding

\`\`\`ts
const AERIAL_CAPS = [400, 700, 1000, 3000, 5000, 10000];
const BURIED_CAPS = [3000, 5000, 8000, 10000, 20000];
\`\`\`

`roundUpToNearestCap(need, typeList)` returns the **smallest capacity ≥ need** from the list; if none exists (need > largest), keep `need` (existing fallback).

### 3.3 Pump rules

| Usage combination | Pumps to return (max 2) |
|-------------------|-------------------------|
| Garden-only | `KIT POMPE POUR CUVE AERIENNE REEMPLOI EXTERIEUR`,<br>`KIT POMPE POUR REEMPLOI EXTERIEUR` |
| ≥ 1 Indoor usage | `KIT POMPE POUR REEMPLOI EXTERIEUR/INTERIEUR` |
| Indoor-only | *same as previous line* |

### 3.4 Display ordering

1. Distance to `roundedNeed` (ascending).  
2. `display_priority` (ascending).  
3. Volume (ascending) as final tie-breaker (implicit in helper).

---

## 4. Implementation Plan

### 4.1 Branch

\`\`\`bash
git checkout -b droid/product-reco-refactor
\`\`\`

### 4.2 Code changes

| File | Action |
|------|--------|
| `lib/productService.ts` | • Add `roundUpToNearestCap()` util.<br>• Re-write `getRecommendedTanks` per §3.1/3.2.<br>• Re-write `getAdditionalRecommendedTanks` to respect new ratios & ordering.<br>• Replace `getCompatiblePumps` with literal filter per §3.3.<br>• Remove obsolete “ideal/acceptable” logic. |
| `components/steps/recommended-products.tsx` | No interface change; ensure UI copes if only **1** pump returned. |
| `docs/VOLUME_ANALYSIS_CORRECTION.md` | Update rounding explanation. |
| `docs/PRODUCT_RECOMMENDATION_ALGO_V2.md` | *this file*. |
| `__tests__/productService.test.ts` | Unit tests covering every rule in §3. |

### 4.3 Migration & Backwards Compatibility

* **Catalogue untouched** → SSR CORS/cache unchanged.  
* UI already guards against empty arrays. Minor CSS/layout unaffected.

### 4.4 Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Inventory lacks capacity for required ratio | After ratio pass, back-fill with any eligible tanks ≥ need. |
| Literal pump names missing in catalogue | Fallback to old heuristic if literal search yields 0. |
| Performance hits from extra sorting | Dataset ≤ 100 rows; negligible. Use cached arrays per call. |

---

## 5. Next-Steps Checklist

- [ ] Create `droid/product-reco-refactor` branch.  
- [ ] Commit this spec & doc updates.  
- [ ] Implement utilities & refactor helpers (TDD).  
- [ ] Add Jest tests; run `pnpm test`.  
- [ ] Manual QA via simulator (`pnpm dev`) with scenarios:  
  1. Garden-only, need = 850 L → 1000 L aerial + 700 L aerial (no buried returned). Pumps = 2 garden kits.  
  2. Toilet + Garden, need = 4200 L → 5000 L, 8000 L, 10000 L buried. Pumps = indoor/exterior kit.  
- [ ] Open PR, include changelog & migration note.

---

_End of document_
