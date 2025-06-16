# PUM – Bug-Fix Guide  
_v1.1 · June 2025_

Ce document compile les retours client et propose les correctifs à appliquer sur le dépôt **pum**.  
Les tâches sont priorisées ; chaque action cite : fichier, lignes approximatives, cause, solution prête à copier/coller.

---

> **Statut d’implémentation — juillet 2025**
>
> | Priorité | Domaine | Statut |
> |----------|---------|--------|
> | **P0**   | Défense anti-double-clic | ✅ Implémenté (commit `eff3200`, branche `droid/p0-anti-double-click-fixes`) |
> | **P1**   | Navigation & Adresse     | 🔄 En cours |
> | **P2**   | Calculs, UX, Aides       | ⏳ À faire |

## 1. Défense globale anti-double-clic (P0)

### 1.1  Hook générique `useSingleFlight`

Ajouter un helper réutilisable :

```ts
// lib/useSingleFlight.ts
import { useRef, useCallback } from "react"

export function useSingleFlight<T extends any[]>(
  fn: (...args: T) => Promise<void> | void,
): [(...args: T) => void, () => boolean] {
  const busy = useRef(false)
  const wrapped = useCallback(async (...args: T) => {
    if (busy.current) return
    busy.current = true
    try { await fn(...args) } finally { busy.current = false }
  }, [fn])
  return [wrapped, () => busy.current]
}
```

### 1.2  Patch `StepButtons`

`components/ui-elements/step-buttons.tsx`

```tsx
type StepButtonsProps = {
  onNext?: () => void
  onPrev?: () => void
  nextLabel?: string
  prevLabel?: string
  nextDisabled?: boolean
  busy?: boolean          /* NEW */
}

<Button
  disabled={nextDisabled || busy}
>
  {busy ? "…" : nextLabel}
</Button>
```

### 1.3  Implémentations par écran

| Écran & Action | Fichier | Lignes | Solution rapide |
|----------------|---------|--------|-----------------|
| Besoins & usages → « Suivant » | `components/steps/usage-selection.tsx` `L35-60` | `const [safeNext,isBusy]=useSingleFlight(handleNext);` puis `<StepButtons onNext={safeNext} busy={isBusy()} …/>` |
| Surface du toit → « OUI / NON » | `components/steps/roof-surface-question.tsx` `L25-45` | `const [respond,isBusy]=useSingleFlight((k:boolean)=>{updateData({knowsRoofSurface:k});goToStep(...);});` puis `disabled={isBusy()}` |
| Adresse → « Continuer » | `contexts/AddressSearchContext.tsx` `handleContinue` `L170-210` | ```ts const [handleContinue,isBusy]=useSingleFlight(_impl); ``` et exposer `isBusy` à `ContinueButton` : `disabled={isBusy || …}` |
| Autocomplete adresse | même fichier `handleAddressSelect` `L270-290` | Supprimer `setTimeout`; protéger `handleSearch` par `useSingleFlight`. |

---

## 2. Navigation & état Adresse (P1)

| Problème | Fichier | Correctif |
|----------|---------|-----------|
| Retour arrière depuis la saisie CP bloque le formulaire | `components/rainwater-simulator.tsx` `prevStep` | Lorsque l’on recule de step 3 → 2 : `updateData({ annualRainfall: undefined })` |
| CP & rainfall non réinitialisés | `components/steps/address-input.tsx` | `useEffect(()=>{ updateData({ postalCode: undefined, annualRainfall: undefined }); },[]);` |
| Pluviométrie manquante après retour | `contexts/AddressSearchContext.tsx` `handleContinue` | Vérifier `annualRainfall`; si absent → erreur et pas de navigation. |

---

## 3. UX Adresse (P1)

* Retirer le `<h3>Sélectionnez votre bâtiment</h3>` statique dans `components/address/building/BuildingMapSection.tsx` ou l’afficher seulement si `buildings.length > 1`.

---

## 4. Calculs & Résultats (P2)

### 4.1  Arrondi volume cuve

`components/steps/autonomy-selection.tsx` `L100-115`

```ts
const recommendedTankSizeM3Rounded = Math.ceil(recommendedTankSizeM3)
const recommendedTankSize = recommendedTankSizeM3Rounded * 1000   // litres
```

### 4.2  Économie : pas de centimes + note

`components/steps/results.tsx`

* Formattage euros : `formatNumber(data.potentialSavingsEuros,0)`
* Sous la carte « Économie potentielle » :

```tsx
<p className="text-xs text-gray-500 mt-2">
  Économie calculée sur un prix moyen de 4 €/m³
</p>
```

### 4.3  Taux de couverture – texte invisible

```tsx
const textColor = coveragePercentage < 30 ? "text-slate-900 dark:text-white" : "text-white";
<div className={`absolute … font-bold ${textColor}`}>{formatNumber(data.coverageRate,1)}%</div>
```

### 4.4  Graphiques précipitations non affichés

`components/rainfall-details.tsx`

* Au lieu de `return null` quand `error`, afficher un `Card` avec message.
* Si pas de coordonnées mais `annualRainfall` présent → générer 12 mois synthétiques (uniformes).

---

## 5. Aides disponibles (P2)

* Remplacer le `setTimeout` mock dans `components/steps/financial-aid.tsx` par un appel API réel.
* Dans `components/steps/results.tsx`, cacher le bouton « Voir les aides » si `aids.length === 0`.

---

## 6. Tests automatisés

| Type | Fichier | Vérifie |
|------|---------|---------|
| RTL | `usage-selection.test.tsx` | Double-clic sur « Suivant » déclenche une navigation |
| RTL | `roof-surface-question.test.tsx` | Un seul appel à `goToStep` malgré dbl-click |
| Jest | `roofCalculator.test.ts` | 4.2 m³ → 5 m³ |
| Cypress | `address_flow.cy.ts` | Aller/retour adresse sans blocage |

---

## 7. Planning

| Pri. | Action | Charge |
|------|--------|--------|
| P0 | Implémenter `useSingleFlight` + patch composants | 0.5 j |
| P1 | Navigation & UX adresse | 1 j |
| P1 | Arrondi + affichage résultats | 0.5 j |
| P2 | Pluviométrie, aides | 1.5 j |
| QA | Tests unitaires + e2e | 1 j |

---

### Annexe – Snippet anti-double-clic vanilla

```ts
const guard = (fn:()=>Promise<void>|void)=>{
  let busy=false;
  return async ()=>{ if(busy) return;
    busy=true; try{ await fn(); } finally{ busy=false; }
  };
};
```

---

© 2025 PUM Engineering
