# Financial Aid – Early Fetch Implementation **Summary**  
`docs/EARLY_FETCH_IMPLEMENTATION_SUMMARY.md`

---

## 1. Context & Objectives  
The “groupeRacine.flatMap is not a function” runtime error revealed two structural issues:

1. **Inconsistent API schema** – `groupe_racine` can be **object _or_ array**.  
2. **Late-fetch flow** – the Financial Aid screen still performed its own network call, producing an extra spinner and hiding the “Voir les aides” button until data arrived.

The Early Fetch initiative fixes the bug **and** rewires the simulator so that aids are downloaded **once** (during the Rainfall step) and reused offline-first throughout the rest of the journey.

---

## 2. Key Fixes  

| Area | Change | Details |
|------|--------|---------|
| **Data mapping** | `formatConditions()` patched | Normalises payload: `Array.isArray(groupe) ? groupe : [groupe]` → no more `flatMap` on objects. |
| **Types** | `types/financialAidTypes.ts` | `groupe_racine: ApiAidGroup \| ApiAidGroup[]` union + exhaustive comments. |
| **API proxy** | `app/api/financial-aid/route.ts` | Accepts **`postcode` or `codeInsee`**, resolves INSEE when required, returns UI-ready aids; robust 400/401/404/500 handling. |
| **Service layer** | `lib/financialAidService.ts` | • Helper `extractConditions()` <br>• `mapApiAidsToUiAids()` centralises transformation (icon, amount, conditions). |
| **Simulator model** | `SimulatorData` | new optional field `financialAids?: Aid[]`. |
| **Rainfall step** | Early fetch logic | On **Next** → `/api/financial-aid?...` with debounce & loader, stores result in `SimulatorData.financialAids`. |
| **Results step** | Conditional CTA | Button text adapts: “Voir les X aides disponibles” if `financialAids.length > 0`, hidden otherwise (legacy postcode fallback kept). |
| **Financial Aid step** | Offline-first | Removed `useEffect` fetch; simply reads `data.financialAids`, shows skeleton while `undefined`. |
| **Unit build** | All changes compile; `npm run build` passes. |

### API contract alignment (🚦 NEW)

| Endpoint | What we validated | Result |
|----------|------------------|--------|
| `GET /v4/communes/{searchValue}` | Returns **array** `[{ id_commune, nom, code_postal, code_insee }]` when queried with postcode or city name. | Added `CommuneApiResponse` type (`id_commune` was missing). |
| `GET /v4/redp/{code_insee}` | Returns object `{ nb_aides, liste_id_aides, aides: [...] }`. Each aid may have `description`, `groupe_racine` **object or array**, `montant_calcule`, nested `montants`, contact fields, etc. | Type `FinancialAidApiResponse` updated: `liste_id_aides`, `description`, optional `plafond_globale`, `tableau_ressources`, etc. |

Those adjustments guarantee **compile-time safety** and prevent runtime crashes caused by unmodelled fields.

---

## 3. How It Works end-to-end  

```
Rainfall.handleNext()
      ├─ fetch `/api/financial-aid?codeInsee=…|postcode=…`
      │     ├─ route.ts resolves INSEE + downloads aids
      │     └─ maps to lightweight Aid DTO
      ├─ store in SimulatorData.financialAids
      └─ nextStep()

Results
  └─ if financialAids.length > 0
        render CTA with count

FinancialAid
  └─ instant display (no network)
```

One **network request** is issued per simulation; every downstream screen reads the cached array.

---

## 4. Benefits Achieved  

| Axis | Impact |
|------|--------|
| **UX latency** | Spinner removed from Financial Aid step; button becomes immediately visible with aid count. |
| **Robustness** | Mixed object/array schemas supported; defensive error paths return empty list, never crash UI. |
| **Bandwidth** | 1 × API call instead of 2 × (before: INSEE + Aids in FinancialAid). |
| **State cohesion** | All simulation data (roof, rain, aids, results) now live in **one** `SimulatorData` source. |
| **Extensibility** | Route already handles bearer token errors & future INSEE overrides; offline-first pattern reusable for other APIs. |

---

## 5. Next Steps / Checklist  

- [ ] Add unit test for `formatConditions(object)` **and** `formatConditions(array)`.  
- [ ] Playwright E2E “Address → Rainfall → Results → Aids” (assert count & no spinner).  
- [ ] Update CI docs (`README.md`) with `NEXT_PUBLIC_AIDESFI_TOKEN` notes.  

---

© 2025 PUM Engineering
