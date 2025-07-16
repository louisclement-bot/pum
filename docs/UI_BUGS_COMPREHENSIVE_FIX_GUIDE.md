# UI / UX Bug-Fix Guide  
pum-recup-eau – June 2025  

This guide gives **production-ready fixes** for the five UI/UX issues reported.  
For every issue you get: current-code pointers, root cause, complete code changes, step-by-step implementation, and the expected result.  
Paths are relative to repository root.

---

## 1 · Results screen – coverage-gauge contrast

| Detail | Value |
|--------|-------|
| Component | `components/steps/results.tsx` |
| Lines (before fix) | **163-180** (bar + inner label) |

### 1.1 Current code & root cause  
\`\`\`tsx
<div className="relative w-full h-5 ...">
  <div className={coverageColor} style={{ width:`${coverageRate}%` }} />
  <div className={`absolute ... ${textColor}`}   // ← white when % ≥50
       style={{ left:`${Math.min(Math.max(coverageRate,30),90)}%` }}>
    {formatNumber(coverageRate,1)}%
  </div>
</div>
\`\`\`
`textColor` is chosen solely from the **percentage** (`≥50 % → white`). When the bar is short, the label sits on the white track while staying white → no contrast.

### 1.2 Working solution  
Render **one** label, keep it *inside* the coloured part and rely on `mix-blend-difference` to auto-invert if it ever drifts outside (supported by all evergreen browsers).

\`\`\`tsx
/* results.tsx  – replace the whole label block */
const labelLeft = Math.min(coveragePercentage, 95);   // keep inside parent

<div className="relative w-full h-5 md:h-8 bg-white dark:bg-slate-800 rounded-full overflow-hidden">
  <div
    className={`absolute inset-y-0 left-0 ${coverageColor} rounded-full transition-all duration-700`}
    style={{ width: `${coveragePercentage}%` }}
  />
  <span
    className="absolute inset-y-0 flex items-center font-bold text-xs md:text-sm px-2
               mix-blend-difference text-white select-none"
    style={{ left: `calc(${labelLeft}% - 1.5rem)` }}   /* ≈ label width/2 */
  >
    {formatNumber(data.coverageRate, 1)}%
  </span>
</div>
\`\`\`

### 1.3 Steps  
1. Open `components/steps/results.tsx`.  
2. Replace the existing inner `<div …>` percentage block with the snippet above.  
3. Remove now-unused `textColor` constant.  

### 1.4 Expected outcome  
The percentage text is always readable (white on colour / inverted on white) with **single render**, no duplicate nodes.

---

## 2 · Product list – limit tanks to 6 (3 + 3)

| Detail | Value |
|--------|-------|
| Primary helper | `lib/productService.ts` |
| UI consumer | `components/steps/recommended-products.tsx` |

### 2.1 Current logic  
* UI calls `getRecommendedTanks(..., 3)` → **3 tanks**  
* Then calls `getAdditionalRecommendedTanks(... )` which ends with:  
\`\`\`ts
return additionalTanks.slice(0, 9)   // up to **9** more tanks
\`\`\`
Total visible tanks after “Voir plus” = **3+9=12**.

### 2.2 Root cause  
Hard-coded `.slice(0, 9)` does not match new requirement (max 6 tanks).

### 2.3 Working solution  

\`\`\`diff
--- a/lib/productService.ts
@@
-    // Limit to 9 tanks maximum
-    return additionalTanks.slice(0, 9);
+    // Limit to 3 extra tanks (3 primary + 3 extra = 6 total)
+    return additionalTanks.slice(0, 3);
\`\`\`

_No other change is required._  
The UI automatically receives at most 3 additional tanks; pumps logic (≤2) stays intact.

### 2.4 Steps  
1. Edit `lib/productService.ts`, locate the final return inside `getAdditionalRecommendedTanks`.  
2. Change `.slice(0, 9)` → `.slice(0, 3)`.  
3. Run `pnpm test` – unit tests should still pass.  

### 2.5 Expected outcome  
“Voir plus” now expands from **3** to **6** tanks. With up to **2** pumps, the grid shows ≤ 8 products total.

---

## 3 · ProductCard – image background & label stacking

| File | `components/steps/recommended-products.tsx` (`ProductCard` inner) |

### 3.1 Current code & issues  
\`\`\`tsx
<div className="aspect-video bg-white relative flex items-center">
  <div className="absolute inset-0 bg-gradient-to-br … z-0" />  // overlays white
  <img className="relative z-10 object-contain" … />
</div>
<label className="absolute top-2 left-2 …">…</label>   // no z-index
\`\`\`
* The gradient sits **above** the white layer → transparent PNGs show gradient, not white.  
* Label chips may appear **behind** gradient.

### 3.2 Working solution  
\`\`\`tsx
{/* product image wrapper */}
<div className="aspect-video relative overflow-hidden">
  {/* solid base colour */}
  <div className="absolute inset-0 bg-white" />
  {/* subtle gradient BEHIND image (z-0) */}
  <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700" />
  {/* product image */}
  <img
    src={product.imageUrl || '/placeholder.svg'}
    alt={product.name}
    className="relative z-10 w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
  />
</div>

{/* chips – always on top */}
<div className="absolute top-2 left-2 z-20 …">{typeLabel}</div>
{isBestseller && (
  <div className="absolute top-2 right-2 z-20 …">BESTSELLER</div>
)}
\`\`\`

### 3.3 Steps  
1. In `ProductCard`, adjust wrapper divs as above (white layer first, gradient second).  
2. Add `z-20` to both chips.  
3. Remove obsolete `z-0` from gradient if present.  

### 3.4 Expected outcome  
Product pictures sit on solid white; category/bestseller chips are always visible above the image.

---

## 4 · PDF – logo & table improvements

| File | `lib/pdfGenerator.ts` |
| Asset | `public/images/pum-logo.png` (provided) |

### 4.1 Current code  
* Fetches `/images/pum-logo.svg` via `loadPumLogo()`.  
* Project info rendered as five individual `doc.text()` lines.  
* Pump table has columns **Type** & **Compatibilité** (not needed for pumps).

### 4.2 Root causes  
* Wrong asset (SVG).  
* Redundant info lines instead of card style.  
* Unnecessary columns clutter pump table.

### 4.3 Working solution  

#### 4.3.1 Use PNG logo
\`\`\`ts
// delete loadPumLogo() helper entirely

const logoRes = await fetch('/images/pum-logo.png');
const logoData = await logoRes.arrayBuffer();
doc.addImage(logoData, 'PNG', 15, 12, 40, 11);
\`\`\`

#### 4.3.2 Replace project info block with cartridge table
\`\`\`ts
const infoRows = [
  ['Eau récupérable', `${(data.annualWaterCollectable!/1000).toFixed(0)} m³/an`],
  ['Besoins en eau',   `${(data.annualWaterNeeds!/1000).toFixed(0)} m³/an`],
  ['Volume cuve recommandé', `${(data.recommendedTankSize!/1000).toFixed(1)} m³`],
  ['Économie potentielle', `${Math.ceil(data.potentialSavingsEuros!)} €/an`],
];

autoTable(doc, {
  head:[['Indicateur','Valeur']],
  body:infoRows,
  startY:40,
  headStyles:{ fillColor:[29,64,175] },
});
\`\`\`
Remove the five `doc.text()` calls that previously printed these lines.

#### 4.3.3 Pump table columns
\`\`\`ts
const pumpColumns = ['Référence', 'Produit'];          // 2 cols
const pumpRows = recommendedPumps.map(p => [`Réf: ${p.id}`, p.name]);
\`\`\`

### 4.4 Steps  
1. Copy PNG to `public/images/pum-logo.png`.  
2. Remove `loadPumLogo()` helper; insert code above in header section.  
3. Delete old text block; insert `autoTable` cartridge block.  
4. Adjust pump table columns & rows.  
5. `pnpm build` then run a simulation → check generated PDF.

### 4.5 Expected outcome  
PDF header shows PNG logo; project data in neat two-column table; pump table is cleaner.

---

## 5 · Mobile – CTA buttons above precipitation details

| Component | `components/steps/results.tsx` |

### 5.1 Current layout  
\`\`\`html
<RainfallDetails />
<ActionButtons />
\`\`\`
CTAs follow rainfall card → long scroll on phones.

### 5.2 Working solution (CSS order)  
\`\`\`tsx
<div className={isMobile ? 'flex flex-col-reverse gap-6' : ''}>
  <RainfallDetails data={data} className="mt-6 md:mt-10" />
  <ActionButtons ... />   {/* existing block containing three <Button> components */}
</div>
\`\`\`
No duplication of ActionButtons; on mobile (`max-width:640px`) flex order reverses.

### 5.3 Steps  
1. Wrap the existing RainfallDetails + ActionButtons in a `<div>` and add the class logic above.  
2. Ensure `useMediaQuery('(max-width: 640px)')` already exists (it does).  
3. Verify on small viewport – buttons appear immediately after coverage gauge.

### 5.4 Expected outcome  
On phones CTAs are visible without scrolling; desktop/tablet unchanged.

---

## Roll-out checklist

1. `git checkout -b ui/bug-fixes-jun2025`  
2. Apply changes section 1 → 5 in order.  
3. `pnpm build && pnpm test` – all tests green.  
4. Manual QA  
   * Gauge label readable at 10 %, 70 %, 95 %.  
   * Products: 3 then 6 tanks (+≤2 pumps).  
   * Product cards show white background & visible chips.  
   * PDF: PNG logo, cartridge table, 2-col pump table.  
   * Mobile: CTAs top of rainfall section.  
5. Commit with detailed message & open PR referencing this guide.

---

_Compiled via Factory analysis – June 2025_
