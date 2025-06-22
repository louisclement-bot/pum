# Guide : Implémentation du **Early Fetch** des aides financières  
`docs/FINANCIAL_AID_EARLY_FETCH_IMPLEMENTATION_GUIDE.md`

---

## 1. Objectif

Optimiser le flux « aides financières » :

\`\`\`
Pluviométrie (Rainfall) ──► Early fetch API
                   │
                   └─── stocker dans SimulatorData.financialAids
                              │
Résultats (Results) ──► bouton conditionnel « Voir les X aides »
                              │
Aides (FinancialAid) ──► affichage offline-first (aucun appel API)
\`\`\`

Gains :  
* une seule requête réseau → UX plus fluide  
* pas de spinner long dans l’écran Aides  
* logique d’affichage fiable (bouton absent si zéro aide)

---

## 2. Pré-requis

| Élément | Action |
|---------|--------|
| Token API | `.env.local` : `NEXT_PUBLIC_AIDESFI_TOKEN=…` |
| Proxy route | déjà présent `app/api/financial-aid/route.ts` |
| Types API | `types/financialAidTypes.ts` |

---

## 3. Spécification de l’API `GET /v4/redp/{code_insee}`

### 3.1 Endpoint

\`\`\`
GET https://apiaidesfi.pia-production.fr/v4/redp/{code_insee}
\`\`\`

| Élément        | Valeur                                                               |
|----------------|---------------------------------------------------------------------|
| `code_insee`   | **Path param** – code INSEE de la commune (`^[0-9][0-9AB][0-9]{3}$`) |
| `X-AUTH-TOKEN` | **Header** – Jeton d’authentification (voir `.env.local`)            |

Exemple Curl :

\`\`\`bash
curl -H "X-AUTH-TOKEN: $NEXT_PUBLIC_AIDESFI_TOKEN" \
     https://apiaidesfi.pia-production.fr/v4/redp/75056
\`\`\`

### 3.2 Réponse `200` – Exemple réel (2 aides trouvées)

\`\`\`json
{
  "nb_aides": 2,
  "liste_id_aides": [7920, 7921],
  "aides": [
    {
      "id": 7920,
      "libelle": "Récupérateurs aériens d’un volume de récupération de 3 m3 minimum",
      "description": "En cas d’installation de récupérateurs d’eaux pluviales pour usage sanitaire (WC et/ou lave-linge), le taux monte à 35%.",
      "montants": [
        {
          "plafond": { "valeur": 5000, "type": "€" },
          "unite": null,
          "type": "POURCENTAGE",
          "poste": "main d'oeuvre + fournitures",
          "valeur": 25,
          "valeur_max": 0
        }
      ],
      "tableau_ressources": null,
      "montant_calcule": 0,
      "groupe_racine": {
        "type": "ET",
        "libelle": "Groupe racine",
        "groupes_fils": [],
        "conditions": [
          { "libelle": "Cuve aérienne" },
          { "libelle": "Installation d'une cuve d’un volume de récupération de 3 m3 minimum." }
        ]
      },
      "plafond_globale": null,
      "site": "https://www.iledefrance.fr/…",
      "groupe_racine_programme": {
        "type": "ET",
        "libelle": "Groupe racine",
        "groupes_fils": [],
        "conditions": [{ "libelle": "Résidence principale" }]
      },
      "libelle_programme": "Installation de récupérateurs d'eau de pluie Région Ile-de-France",
      "description_programme": "Afin de favoriser l’usage de l’eau à la source…",
      "lien_documentation": "https://www.aidesauxtravaux.fr/…pdf",
      "ville": "Saint-Ouen-sur-Seine",
      "code_postal": "93400",
      "adresse": "Conseil régional d'Île-de-France",
      "adresse2": "2, rue Simone Veil",
      "telephone": "",
      "mail": "recuperateurs-eaux-pluviales@iledefrance.fr"
    },
    { "... second aid object …" }
  ]
}
\`\`\`

### 3.3 Réponse `200` – Exemple « schema » (0 aide, `groupe_racine` **tableau**)

\`\`\`json
{
  "nb_aides": 0,
  "liste_id_aides": [0],
  "aides": [
    {
      "id": 0,
      "libelle": "Aide à la rénovation thermique propriétaire occupant",
      "libelle_programme": "Aides … Département du Vaucluse",
      "montant_calcule": 1000,
      "montants": [{ "valeur": 3000, "valeur_max": 5000, "type": "FORFAITAIRE", "poste": "main d'oeuvre et fournitures", "unite": "m²",
        "plafond": { "valeur": 2000, "type": "€" } }],
      "plafond_globale": { "valeur": 3000, "type": "€" },
      "groupe_racine": [
        {
          "type": "ET",
          "libelle": "Groupe Racine",
          "conditions": [{ "libelle": "Etre propriétaire occupant" }],
          "groupes_fils": [{}]
        }
      ],
      "groupe_racine_programme": [{}],
      "tableau_ressources": { "plafonds_par_personnes": {}, "plafond_additionnel_par_personne": 0 },
      "ville": "Orange",
      "code_postal": 84100,
      "adresse": "string",
      "adresse2": "string",
      "site": "string",
      "telephone": "string",
      "mail": "string"
    }
  ]
}
\`\`\`

### 3.4 Codes d’état

| Code | Signification                                                     | Action front-end recommandée                          |
|------|-------------------------------------------------------------------|-------------------------------------------------------|
| 200  | OK – corps conforme aux exemples ci-dessus                        | Mapper et stocker (peut être vide)                    |
| 400  | Mauvais paramètre (regex INSEE)                                   | Afficher toast « Mauvais code INSEE »                 |
| 401  | Jeton invalide                                                    | Journaliser + fallback vide + alerte monitoring       |
| 404  | Commune inconnue / aucune aide                                    | Stocker `financialAids: []` → bouton masqué           |
| 500  | Erreur serveur                                                    | Réessayer (back-off) puis fallback vide + log Sentry  |

---

## 4. Correction du bug `groupeRacine.flatMap is not a function`

### 3.1 Racine du problème  
L’API retourne **deux** formats :

* **Objet** (majorité des communes)  
  \`\`\`json
  "groupe_racine": {
    "conditions": [...]
  }
  \`\`\`
* **Tableau** (schema de la doc)  
  \`\`\`json
  "groupe_racine": [ { "conditions": [...] } ]
  \`\`\`

Le mapping actuel suppose obligatoirement un tableau → `flatMap` lève une exception sur un objet.

### 3.2 Fix

\`\`\`ts
// lib/financialAidService.ts
function extractConditions(groupe: any): string[] {
  if (!groupe) return [];
  // Normalise en tableau
  const list = Array.isArray(groupe) ? groupe : [groupe];
  return list
    .flatMap((g: any) => g.conditions ?? [])
    .map((c: any) => c.libelle)
    .filter(Boolean);
}

export function formatConditions(groupeRacine: any): string {
  const labels = extractConditions(groupeRacine);
  return labels.length ? labels.join("; ") : "Conditions non spécifiées";
}
\`\`\`

*Ajoutez un test unitaire couvrant objet + tableau.*

---

## 5. Extension de `SimulatorData`

\`\`\`ts
// components/rainwater-simulator.tsx
export type SimulatorData = {
  /* …champs existants… */
  financialAids?: Aid[]        // NEW
}
\`\`\`

---

## 6. Étape 1 : Early Fetch dans **Rainfall**

### 5.1 Service helper

\`\`\`ts
// lib/useFinancialAid.ts
export async function fetchFinancialAid(postal?: string, insee?: string): Promise<Aid[]> {
  const params = insee ? `codeInsee=${insee}` : `postcode=${postal}`;
  const res = await fetch(`/api/financial-aid?${params}`);
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()).aids as Aid[];
}
\`\`\`

### 5.2 Intégration dans le composant

\`\`\`tsx
// components/steps/rainfall.tsx  (extrait)
const [fetchingAids, setFetchingAids] = useState(false);

const handleNext = async () => {
  /* rainfall logic */
  try {
    setFetchingAids(true);
    const aids = await fetchFinancialAid(data.postalCode, data.citycode);
    updateData({ annualRainfall: rainfall, financialAids: aids });
  } catch (e) {
    console.error("[API] Financial aid fetch failed:", e);
    updateData({ annualRainfall: rainfall, financialAids: [] });
  } finally {
    setFetchingAids(false);
    nextStep();
  }
}
\`\`\`

UI : afficher un loader discret tant que `fetchingAids` est `true`.

---

## 7. Étape 2 : Bouton conditionnel dans **Results**

\`\`\`tsx
// components/steps/results.tsx  (extrait)
const aidsCount = data.financialAids?.length ?? 0;

{aidsCount > 0 && (
  <Button onClick={() => goToStep(STEP_IDS.FINANCIAL_AID)}>
    {`Voir les ${aidsCount} aide${aidsCount > 1 ? "s" : ""} disponibles`}
    <ChevronRight className="ml-2 h-4 w-4" />
  </Button>
)}
\`\`\`

*Astuce* : gardez l’ancien test `!!data.postalCode` en *fallback* pour ne pas casser l’UX en cas d’erreur serveur.

---

## 8. Étape 3 : Affichage read-only dans **FinancialAid**

* Supprimez tout `useEffect` de fetch.  
* Consommez simplement `props.data.financialAids`.

\`\`\`tsx
if (!data.financialAids || data.financialAids.length === 0) {
  return <EmptyState />; // message « Aucune aide »
}

return (
  <div>{data.financialAids.map(renderAidCard)}</div>
);
\`\`\`

---

## 9. Gestion des erreurs & fallback

| Scénario | Comportement |
|----------|--------------|
| API 401/500 | Log `console.error`, stocker `financialAids: []`, bouton Results non affiché |
| Timeout | idem (utiliser `AbortController` 8 s) |
| API retourne 0 aide | Stocker `[]`, bouton masqué |
| Parsing error | Catch, log & fallback à `[]` |

---

## 10. Journalisation utile

* `[AID_FETCH] start|success|error` dans `Rainfall`.
* Stockez la taille `aids.length` dans le log pour debugging rapide.
* Ajoutez `performance.now()` pour mesurer la durée de l’appel.

---

## 11. Tests

### 10.1 Unit ‑ service

*Mock : objet vs tableau*

\`\`\`ts
it("extracts conditions from object & array", () => {
  expect(formatConditions(sampleObject)).toBe("Cuve aérienne; Installation …");
  expect(formatConditions([sampleObject])).toBe("Cuve aérienne; Installation …");
});
\`\`\`

### 10.2 Integration ‑ Rainfall

* Simulez réponse API 2 aides → attendez `updateData` avec `financialAids.length === 2`.

### 10.3 E2E (Playwright)

* Flow complet : adresse → pluie → results → bouton comptant 2 aides → navigation → cartes visibles.

---

## 12. Mapping complet API → UI

| Champ API                                      | Champ UI (`Aid`) / SimulatorData | Transformation / Exemple                           |
|-----------------------------------------------|----------------------------------|----------------------------------------------------|
| `id`                                          | `Aid.id`                         | `String(id)`                                       |
| `libelle`                                     | `Aid.name`                       | direct                                             |
| `libelle_programme`                           | `Aid.organization`               | direct                                             |
| `montant_calcule` + `montants[]`              | `Aid.amount`                     | `formatAmount()` voir service                      |
| `groupe_racine`                               | `Aid.conditions`                 | `formatConditions()` (objet **ou** tableau)        |
| `site` / `telephone` / `mail` (facultatif)    | (non affiché v1)                 | Stocker si UX futur                                |

## 13. Interfaces TypeScript recommandées

\`\`\`ts
export interface RedpResponse {
  nb_aides: number;
  liste_id_aides: number[];
  aides: RedpAid[];
}

export interface RedpAid {
  id: number;
  libelle: string;
  libelle_programme: string;
  description: string;
  montant_calcule: number;
  montants: ApiMontant[];
  groupe_racine: ApiGroup | ApiGroup[];     // objet **ou** tableau
  groupe_racine_programme: ApiGroup | ApiGroup[];
  site: string | null;
  ville: string;
  code_postal: string | number;
  adresse?: string;
  adresse2?: string;
  telephone?: string;
  mail?: string;
  // … autres champs ignorés dans v1
}

export interface ApiMontant {
  valeur: number;
  valeur_max?: number;
  type: "POURCENTAGE" | "FORFAITAIRE";
  poste: string;
  unite?: string | null;
  plafond?: { valeur: number; type: string };
}

export interface ApiGroup {
  type: "ET" | "OU";
  libelle: string;
  conditions?: { libelle: string }[];
  groupes_fils?: ApiGroup[];
}
\`\`\`

---

## 14. Checklist de livraison

- [ ] Fix `formatConditions` et tests OK  
- [ ] Ajout `financialAids` dans `SimulatorData`  
- [ ] Early fetch dans `rainfall.tsx` + loader UX  
- [ ] Bouton dynamique dans `results.tsx`  
- [ ] `financial-aid.tsx` sans requête réseau  
- [ ] Docs CI & README mis à jour  

*Feature branch :* `droid/financial-aid-early-fetch`  
*PR message :* inclure « Closes #P0-earlyFetch-financialAid ».

---

© 2025 PUM – Engineering Excellence
