# Financial Aid API – Fix Summary

## 1. Problem Description & Root-Cause Analysis
When the simulator tried to load financial aids, many requests failed with:

```
Aucune communes avec code insee '75117'
```

Root cause  
* The **Financial-Aid API** (`apiaidesfi.pia-production.fr`) requires an internal 2-step protocol:  
  1. `GET /v4/communes/{searchValue}` – returns the **authoritative INSEE code** it recognises.  
  2. `GET /v4/redp/{code_insee}`   – returns aids for that INSEE code.  
* Our code **bypassed step 1** whenever an INSEE code coming from BAN or the Roof Surface flow was already available.  
* Paris arrondissements (e.g. *75117*) are coded differently in BAN vs. the Financial-Aid database, so skipping the lookup produced systematic 404s.

---

## 2. Affected User Flows
| Flow | Description | Symptom |
|------|-------------|---------|
| **Flow A – “Known roof surface”** | User enters roof surface manually, then a **postal code** during the Rainfall step. | Sometimes worked, sometimes failed depending on lookup logic. |
| **Flow B – “Unknown roof surface / address search”** | User selects a building from address search. `citycode` (BAN INSEE) is stored. Rainfall step calls aids API directly with that code. | Always failed for arrondissements and any commune not present under identical code in AidesFi DB. |

---

## 3. What Was Wrong
1. **API route (`/app/api/financial-aid/route.ts`)**
   * If query parameter `codeInsee` existed, it was forwarded **without** validating through `/v4/communes/{searchValue}`.
2. **Rainfall component**
   * Preferred `citycode` (`codeInsee`) over postal code when building the query string, encouraging the bypass.

---

## 4. Fixes Implemented
### 4.1 API Route
* Unified entry parameter **`searchValue`** → always passed to `getInseeByPostcode(searchValue)`, even if it *looks* like an INSEE code.
* Removed direct `codeInsee` path.
* Added granular error mapping and logging.

### 4.2 Rainfall Step
* Early-fetch logic **always sends `postcode`** (never `codeInsee`) to `/api/financial-aid`.
* Added fallback guard: if no postal code is known, skips early-fetch gracefully.

### 4.3 Branch & Commit
* Branch: `droid/fix-financial-aid-api-flow`  
* Commit: Ensures the two-step protocol is respected across both user flows.

---

## 5. Expected Behaviour After the Fix
| Scenario | Expected Result |
|----------|-----------------|
| User enters postal code only | Commune lookup resolves INSEE; aids list loads (or empty array with 200). |
| User searches by full address | Postal code extracted → same lookup chain → aids load successfully. |
| Commune truly has no aids | Route returns `200 { aids: [], message: "Aucune aide..." }`, UI handles politely. |
| Network/Auth error | Proper 4xx/5xx with explanatory JSON; UI shows toast. |

---

## 6. Testing Recommendations
1. **Regression matrix**

| Postal Code | BAN INSEE (for reference) | Expected HTTP | Notes |
|-------------|--------------------------|---------------|-------|
| `75017` | `75117` | `200` | Paris 17ᵉ – verifies arrondissement mapping |
| A rural commune with aids | — | `200` with `aids.length>0` | Confirms positive path |
| A commune without aids | — | `200` with `aids=[]` | Confirms graceful empty |
| Invalid code `99999` | — | `404` | Validates error branch |

2. **End-to-End flows**
   * *Flow A*: manual roof surface → postal code → Rainfall → verify aids panel after Results step.
   * *Flow B*: address search → building select → Rainfall → verify early-fetch (inspect Network: `/api/financial-aid?postcode=...`).

3. **Unit tests (suggested)**
   * Mock fetch to `/api/financial-aid` ensuring it never receives `codeInsee` param.
   * Assert API route calls `getInseeByPostcode` exactly once per request.

4. **Load tests**
   * Burst 50 concurrent requests with mixed postal codes to ensure commune lookup isn’t rate-limited or cached incorrectly.

---

### Maintainer Notes
* Keep **`FINANCIAL_AID_API_INTEGRATION_GUIDE.md`** up to date with this mandatory 2-step protocol.
* If the Financial-Aid provider adds new auth or changes route signatures, update `lib/financialAidService.ts` first and **never bypass** `/v4/communes/{searchValue}`.  

---

## 7. Deployment Fix

During the first deployment with this branch the build failed because of
syntax errors introduced while refactoring the API route:

* Duplicate `console.log` line where the real `apiResponse` assignment was
  expected.
* An extra closing brace that broke the `try … catch` structure.

These issues were corrected in commit `691d18a`.

| Build | Result |
|-------|--------|
| **Status** | ✅ Passing |
| **Deployment** | Ready for production |
