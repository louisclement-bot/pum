# Location Modification – Data Flow Documentation

_Last updated: 22 June 2025_

## 1. Feature Overview
Users can now adjust their **postal code (and optionally the city)** directly from the “Pluviométrie annuelle dans votre région” (Rainfall) step, even after an initial address search.  
The UI exposes a “Modifier l’emplacement” action under the address banner. When pressed:

1. A small form lets the user enter a new postal code (`newPostalCode`) and city (`newCity`, optional).  
2. On _Save_, the simulator **clears** all data that was derived from the previous location, persists the new values in `SimulatorData`, and triggers a fresh rainfall fetch.

This keeps the simulation coherent without forcing the user to restart the wizard.

---

## 2. Data Flow When Location Is Changed

```
UI (Rainfall step)
   │
   ├── handleModifyLocation()  – shows edit form
   │
   └── handleSaveLocation()
        │
        ├─ 2.1 Reset local UI state
        │     • setPostalCode(cleanedPostal)
        │     • setCoordinates(null)
        │     • setRainfall(0)
        │     • setDataSource("none")
        │
        ├─ 2.2 Propagate to global SimulatorData via updateData()
        │     • postalCode          ← cleanedPostal
        │     • city                ← newCity
        │     • latitude/longitude  ← undefined
        │     • annualRainfall      ← undefined
        │     • detailedPrecip…     ← undefined
        │     • rainfallDataSource  ← undefined
        │
        └─ 2.3 fetchRainfall(cleanedPostal)
               ├─ Geocode → coordinates
               ├─ Open-Meteo → annual & monthly rainfall
               └─ update local + SimulatorData once resolved
```

---

## 3. What Gets Cleared and Why

| Field                                | Reason for reset                                                                                 |
|--------------------------------------|--------------------------------------------------------------------------------------------------|
| `latitude`, `longitude`              | Coordinates belong to the old location; must be refreshed for new rainfall queries.             |
| `annualRainfall`, `detailed…`        | Rainfall amounts were calculated for the previous coords.                                        |
| `rainfallDataSource`                 | To correctly reflect the source once new data arrive.                                            |
| `postalCode`, `city` (updated)       | Persist user’s new location.                                                                     |

Resetting prevents **stale data** and guarantees that every downstream calculation uses fresh, location-specific inputs.

---

## 4. Downstream Components Affected

| Component / Service                          | Consumption of updated data                                      | Behaviour after change |
|----------------------------------------------|------------------------------------------------------------------|------------------------|
| **`financial-aid.tsx`**                      | `data.postalCode`                                                | React `useEffect` keyed on `postalCode` automatically refetches Aides-Fi API. |
| **`results.tsx` & progress metrics**         | `annualRainfall`, `coverageRate`, `recommendedTankSize`, etc.    | Values recomputed once the Rainfall step is saved and **Next** is pressed. |
| **Rainfall charts** (`rainfall-details.tsx`) | `detailedPrecipitationData`                                      | Re-render with new monthly dataset; gracefully shows “Aucune donnée” until fetch completes. |
| **Roof/tank calculators** (`roofCalculator`, etc.) | Indirect via `annualRainfall`                                     | Produce new sizing once Rainfall step completes. |
| **API proxies** (`financialAidService`, etc.) | rely on `postalCode`/coords                                       | No change required – they read from updated `SimulatorData`. |

Because the reset happens **before** the fetch call, these consumers only ever see consistent datasets.

---

## 5. Testing Checklist

| Scenario | Steps | Expected Outcome |
|----------|-------|------------------|
| **Basic change** | Modify postal code from 75017 → 33000.<br>Press _Enregistrer_ and _Continuer_. | • Rainfall refetches for Bordeaux.<br>• Results page numbers change.<br>• Financial-aid list is empty or Bordeaux-specific. |
| **Manual city blank** | Enter new postal without city. | City field may auto-populate from BAN geocoder; otherwise remains blank without breaking anything. |
| **Invalid postal** | Enter “ABCDE”. | Front-end blocks save (disabled button). |
| **Slow network** | Throttle network.<br>Save new location. | Spinner appears inside rainfall card; no stale Paris data shown. |
| **Return to previous step** | After modifying location, click “Précédent”, then “Suivant”. | New rainfall still present; no regression to old values. |
| **Refresh during Rainfall step** | Reload page while edit form is open. | Form persists thanks to React state; if not, user can reopen without crash. |

Run these tests in **light & dark themes** and on **mobile width ≤ 640 px**.

---

## 6. Edge Cases & Handling

| Edge case | Handling strategy |
|-----------|------------------|
| User supplies postal code but Open-Meteo fails | Error banner + manual rainfall input prompt. |
| User quickly changes postal twice in a row | `isLoading` guards plus fresh state ensure last change wins. |
| Existing coordinates present but belong to old location | We explicitly nullify them **before** running `fetchRainfall` (Section 3). |
| Financial-aid API returns error for new code | Error message shown; simulation still continues. |
| User enters 0 or negative rainfall manually | Validation rejects; error copy “valeur numérique valide supérieure à 0”. |
| BAN geocoder returns city that differs from user input | We keep user’s city unless undefined, preventing unexpected override. |

---

_This document should be kept in sync with any future modifications to the location flow or data schema._  
For questions, ping `@Louis-Clément` or check the inline comments inside `components/steps/rainfall.tsx`.
