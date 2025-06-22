# Intégration de l’API Aides Financières  
`docs/FINANCIAL_AID_API_INTEGRATION_GUIDE.md`

---

## 1. Executive Summary
Le simulateur PUM utilise aujourd’hui des aides financières **mockées** (hard-codées) affichées dans `components/steps/financial-aid.tsx`.  
Objectif : remplacer cette implémentation factice par les données temps-réel de l’API **ApiAidesFi** (`https://apiaidesfi.pia-production.fr`).  
Le flux cible :  
1. Récupérer le **code postal** du foyer (déjà présent dans `SimulatorData.postalCode`).  
2. Obtenir le **code INSEE** via `GET /v4/communes/{searchValue}`.  
3. Récupérer les aides pour ce code INSEE via `GET /v4/redp/{code_insee}`.  
4. Mapper la réponse API vers la structure d’affichage existante.  

---

## 2. Current Architecture Analysis

| Élément | Emplacement | Observations clés |
|---------|-------------|-------------------|
| Mock UI | `components/steps/financial-aid.tsx` | Hard-coded tableau `Aid[]` injecté après `setTimeout` de 1 500 ms. |
| Données adresse | `components/steps/address-input.tsx` → `AddressSearchContext` | Capture `postalCode`, `citycode` (INSEE) lors du POST `/api/roof-surface`. |
| Types | `types/addressTypes.ts`, `components/rainwater-simulator.tsx` | `SimulatorData` contient `postalCode`, `city`, `latitude`, `longitude`. |
| INSEE déjà dispo | Réponse back-end `/api/roof-surface` : `geocoded_address.citycode`. Cette valeur est stockée dans `AddressSearchContext.state.apiResponse`. Accessible dans le front. |

Data structures :
```ts
// actuelle (mock)
type Aid = {
  id: string
  name: string
  organization: string
  amount: string
  conditions: string
  icon: React.ReactNode
}
```
Réponse API cible (abrégé) :
```json
{
  "aides": [{
    "id": 1,
    "libelle": "Aide à la récupération d'eau de pluie",
    "libelle_programme": "Programme ...",
    "montant_calcule": 500,
    "montants": [...],
    "groupe_racine": [...],
    "ville": "Lyon",
    ...
  }]
}
```

---

## 3. API Integration Specifications

### 3.1 Authentification
```
Header:  X-AUTH-TOKEN: ZEc5clpXNWZjSEp2WkY5d2RXMWZZbUZqYTJWdVpFRlFTUT09
```

### 3.2 Endpoints

| Action | Méthode & Route | Paramètre | Description |
|--------|-----------------|-----------|-------------|
| Lookup commune | `GET /v4/communes/{searchValue}` | `{searchValue}` = code postal (string) | Retourne tableau de communes avec `code_insee`. |
| Aides | `GET /v4/redp/{code_insee}` | `{code_insee}` = INSEE (string) | Détaille toutes les aides REDP pour la commune. |

### 3.3 Schémas (essentiels)

`/v4/communes/75001` →  
```json
[ { "nom": "Paris", "code_postal": "75001", "code_insee": "75056" } ]
```

`/v4/redp/75056` → voir exemple complet dans doc technique.

### 3.4 Gestion des erreurs
* 400 : mauvais format de paramètre (regex INSEE).
* 401 : token invalide ou manquant → déclencher re-connexion silencieuse ?.
* 404 : commune inconnue ou aucune aide → afficher message « Aucune aide disponible ».
* 500 : réessayer + fallback messages.

---

## 4. Implementation Plan

| Étape | Actions détaillées |
|-------|-------------------|
| 1. **Nouveau service** | `lib/financialAidService.ts` avec fonctions: <br>• `getInseeByPostcode(postcode)` → appelle `/v4/communes/{postcode}` (prend 1er résultat).<br>• `getFinancialAids(codeInsee)` → appelle `/v4/redp/{codeInsee}`. |
| 2. **Types** | Créer `types/financialAidTypes.ts` (interfaces strictes des réponses API + structure UI). |
| 3. **Component refactor** | Dans `components/steps/financial-aid.tsx` :<br>• Remplacer `useEffect` mock par appel réel.<br>• Déduire `postalCode` et/ou `citycode` depuis `data` ou `AddressSearchContext`.<br>• Gestion états: `isLoading`, `error`, `aids`. |
| 4. **Error / Loading UX** | Réutiliser squelettes existants. Ajouter Toast/Alert pour erreurs 401/500. |
| 5. **Tests** | • Unit : mock fetch pour service.<br>• Integration React Testing Library: vérifier rendu liste aides.<br>• e2e (Playwright) : scénario adresse → aides. |
| 6. **Docs / ENV** | Ajouter token dans `.env.local` `NEXT_PUBLIC_AIDESFI_TOKEN=...` et lire via `process.env`. |
| 7. **CI** | Linter + tests doivent passer. Ajouter param de build secret. |

---

## 5. Data Mapping

| Source API | Champ UI (`Aid`) | Transformation |
|------------|-----------------|----------------|
| `id` | `id` | string |
| `libelle` | `name` | direct |
| `libelle_programme` | `organization` | direct |
| `montant_calcule` + `montants[]` | `amount` | ex. `"Jusqu'à 500 €"` (formatter). |
| `groupe_racine` | `conditions` | concat textes libelle. |
| (icône) | `icon` | utiliser `Euro`, `Building`, etc. selon `libelle_programme`. |

Lookup flow :
```
postalCode -> /v4/communes/ -> code_insee -> /v4/redp/ -> map -> UI
```
Si `citycode` déjà dispo via roof-surface : sauter la 1ʳᵉ requête.

---

## 6. Technical Considerations

* **Performance** : deux requêtes réseau, parallélisables si INSEE déjà connu.  
* **Caching** :  
  - In-memory (React Query SWR) 10 min.  
  - Persist localStorage pour affichage offline light.  
* **Rate Limiting** : aucune info, prévoir back-off (exponential) après 429/500.  
* **Security** :  
  - Ne jamais exposer token côté client si possible ; sinon restreindre par CORS côté proxy.  
  - Stocker dans variable d’environnement Next.js server → appeler via route API Next (`/api/financial-aid`) pour masquer le token.  
* **Fallback** :  
  - Si API KO → afficher bannière « Service indisponible, données indicatives » et recharger mock.  
* **i18n** : données en français ; prévoir traduction ultérieure.

---

## 7. Code Examples

### 7.1 Service (`lib/financialAidService.ts`)
```ts
const BASE_URL = "https://apiaidesfi.pia-production.fr/v4";
const HEADERS = {
  "X-AUTH-TOKEN": process.env.AIDESFI_TOKEN!,
  "Content-Type": "application/json",
};

export async function getInseeByPostcode(postcode: string) {
  const res = await fetch(`${BASE_URL}/communes/${postcode}`, { headers: HEADERS });
  if (!res.ok) throw new Error(`Commune lookup failed (${res.status})`);
  const data = await res.json();
  if (!data.length) throw new Error("Aucune commune trouvée");
  return data[0].code_insee as string;
}

export async function getFinancialAids(codeInsee: string) {
  const res = await fetch(`${BASE_URL}/redp/${codeInsee}`, { headers: HEADERS });
  if (!res.ok) throw new Error(`Aides lookup failed (${res.status})`);
  return (await res.json()) as FinancialAidApiResponse;
}
```

### 7.2 Types (`types/financialAidTypes.ts`)
```ts
export interface FinancialAidApiResponse {
  nb_aides: number;
  aides: ApiAid[];
}
export interface ApiAid {
  id: number;
  libelle: string;
  libelle_programme: string;
  montant_calcule: number | null;
  montants: { valeur: number; valeur_max?: number }[];
  groupe_racine: { conditions: { libelle: string }[] }[];
}
export interface AidUI {
  id: string;
  name: string;
  organization: string;
  amount: string;
  conditions: string;
}
```

### 7.3 Component patch (extrait)
```tsx
import { getFinancialAids, getInseeByPostcode } from "@/lib/financialAidService";
...
useEffect(() => {
  const load = async () => {
    try {
      const codeInsee = data.citycode ?? (await getInseeByPostcode(data.postalCode!));
      const api = await getFinancialAids(codeInsee);
      setAids(
        api.aides.map((a): Aid => ({
          id: String(a.id),
          name: a.libelle,
          organization: a.libelle_programme,
          amount:
            a.montant_calcule != null
              ? `Jusqu'à ${a.montant_calcule.toLocaleString()}€`
              : formatMontants(a.montants),
          conditions: a.groupe_racine
            .flatMap((g) => g.conditions.map((c) => c.libelle))
            .join("; "),
          icon: <Euro className="h-5 w-5 text-[#1D40AF]" />,
        })),
      );
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };
  if (data.postalCode) load();
}, [data.postalCode, data.citycode]);
```

### 7.4 Proxy route (optional, hides token)
`app/api/financial-aid/route.ts`
```ts
import { NextResponse } from "next/server";
import { getFinancialAids, getInseeByPostcode } from "@/lib/financialAidService";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const postcode = searchParams.get("postcode");
  if (!postcode) return NextResponse.json({ error: "postcode required" }, { status: 400 });

  try {
    const insee = await getInseeByPostcode(postcode);
    const aids = await getFinancialAids(insee);
    return NextResponse.json(aids);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
```

---

## 8. Next Steps & Acceptance Criteria
1. PR sur branche `droid/financial-aid-api-integration` avec :
   - nouveau service, types, route proxy (si retenue),
   - refacto composant,
   - tests + documentation.  
2. CI verte ; couverture tests ≥ 80 % sur nouveau code.  
3. UX identique à l’existant (squelettes, messages).  
4. Validation fonctionnelle : aides réelles visibles pour au moins 3 codes postaux distincts.  

*Fin du guide.*
