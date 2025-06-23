# PUM – Bug-Fix Guide  
_v1.1 · June 2025_

Ce document compile les retours client et propose les correctifs à appliquer sur le dépôt **pum**.  
Les tâches sont priorisées ; chaque action cite : fichier, lignes approximatives, cause, solution prête à copier/coller.

---

> **Statut d'implémentation — juillet 2025**
>
> | Priorité | Domaine | Statut |
> |----------|---------|--------|
> | **P0**   | Défense anti-double-clic | ✅ Implémenté (commit `eff3200`, branche `droid/p0-anti-double-click-fixes`) |
> | **P1**   | Navigation & Adresse     | 🔄 En cours |
> | **P2**   | Calculs, UX, Aides       | ⏳ À faire |
> | **P1**   | Graphiques (onglets)     | ✅ Implémenté (commit `2509dd5`, branche `droid/fix-chart-rendering-in-tabs`) |

## 1. Défense globale anti-double-clic (P0)

### 1.1  Hook générique `useSingleFlight`

Ajouter un helper réutilisable :

\`\`\`ts
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
\`\`\`

### 1.2  Patch `StepButtons`

`components/ui-elements/step-buttons.tsx`

\`\`\`tsx
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
\`\`\`

### 1.3  Implémentations par écran

| Écran & Action | Fichier | Lignes | Solution rapide |
|----------------|---------|--------|-----------------|
| Besoins & usages → « Suivant » | `components/steps/usage-selection.tsx` `L35-60` | `const [safeNext,isBusy]=useSingleFlight(handleNext);` puis `<StepButtons onNext={safeNext} busy={isBusy()} …/>` |
| Surface du toit → « OUI / NON » | `components/steps/roof-surface-question.tsx` `L25-45` | `const [respond,isBusy]=useSingleFlight((k:boolean)=>{updateData({knowsRoofSurface:k});goToStep(...);});` puis `disabled={isBusy()}` |
| Adresse → « Continuer » | `contexts/AddressSearchContext.tsx` `handleContinue` `L170-210` | ```ts const [handleContinue,isBusy]=useSingleFlight(_impl); ``` et exposer `isBusy` à `ContinueButton` : `disabled={isBusy || …}` |
| Autocomplete adresse | même fichier `handleAddressSelect` `L270-290` | Supprimer `setTimeout`; protéger `handleSearch` par `useSingleFlight`. |

---

#### 1.4 Debugging : **Composants dupliqués**

Durant la mise en place de la défense anti-double-clic, un problème subtil a été découvert :

| Élément | Détail |
|---------|--------|
| **Problème** | Le correctif a été appliqué à `components/steps/roof-surface-question.tsx`, mais l'application charge en réalité `components/steps/roof-surface-question-fixed.tsx`. Les doubles-clics persistaient donc. |
| **Cause racine** | `rainwater-simulator.tsx` importe la version *-fixed* :<br>`import RoofSurfaceQuestion from "./steps/roof-surface-question-fixed"` |
| **Comment le détecter ?** | 1. Les logs indiquaient encore deux navigations.<br>2. Rechercher dans le projet `roof-surface-question-fixed` a révélé la duplication. |
| **Correctif appliqué** | • Copié/porté le hook `useSingleFlight` sur `roof-surface-question-fixed.tsx`.<br>• Ajout de `disabled={isBusy()}` sur les boutons **Oui / Non**.<br>• Utilisation des constantes `STEP_IDS`/`SUBSTEP_IDS` pour une navigation claire. |
| **Statut** | Les **deux** composants sont maintenant protégés **et** le fichier obsolète a été renommé :`roof-surface-question-deprecated-do-not-use.tsx` (commit `b2117dc`).<br>→ plus de double-clic possible. Ce fichier pourra être supprimé lors d'un futur nettoyage. |

> **Bonne pratique** : lorsqu'un correctif paraît inefficace, vérifier systématiquement **le chemin d'import réel** dans le routeur ou le composant parent afin de repérer d'éventuels doublons/fichiers morts.

## 2. Navigation & état Adresse (P1)

| Problème | Fichier | Correctif |
|----------|---------|-----------|
| Retour arrière depuis la saisie CP bloque le formulaire | `components/rainwater-simulator.tsx` `prevStep` | Lorsque l'on recule de step 3 → 2 : `updateData({ annualRainfall: undefined })` |
| CP & rainfall non réinitialisés | `components/steps/address-input.tsx` | `useEffect(()=>{ updateData({ postalCode: undefined, annualRainfall: undefined }); },[]);` |
| Pluviométrie manquante après retour | `contexts/AddressSearchContext.tsx` `handleContinue` | Vérifier `annualRainfall`; si absent → erreur et pas de navigation. |
| « Arrosage du jardin » seul → « Suivant » inactif | `components/steps/usage-selection.tsx` `handleNext` | Mettre à jour l'état **puis** naviguer : appeler `goToStep` _après_ `updateData` (ex. `setTimeout(()=>goToStep(1,2),0)` ou utiliser un `useEffect` déclenché sur `data.usages`). |

---

## 3. Graphiques précipitations dans les onglets (P1)

### 3.1  Problème

Les graphiques **Recharts** contenus dans les onglets _Précipitations_ n’étaient plus visibles après un changement d’onglet : le SVG restait en **0 × 0**.

### 3.2  Cause racine

`TabsContent` de Radix cachait les panneaux inactifs avec `display:none`.  
`ResponsiveContainer` calcule ses dimensions au montage et garde **0 px** en cache.

### 3.3  Correctif appliqué

1. Surcharge de `components/ui/tabs.tsx`  
   *Inactif* ➜ `position:absolute; left:-200vw; opacity:0; pointer-events:none;`  
   `forceMount` empêche le `display:none`.
2. Ajout du hook `hooks/use-chart-visibility.ts` (Intersection + Resize Observer).  
   Les composants graphiques repassent le `key` à `ResponsiveContainer` lorsque le conteneur devient visible.

Documentation détaillée : [`docs/CHART_TAB_RENDERING_FIX.md`](./CHART_TAB_RENDERING_FIX.md)

**Statut** : ✅ **RÉSOLU** – Les graphiques sont visibles sur tous les onglets et redimensionnent correctement.

---

## 4. UX Adresse (P1)

1. **Symptôme**  
   • L'utilisateur coche uniquement « Arrosage du jardin », le bouton **Suivant** devient actif visuellement mais aucun passage à l'étape suivante ne se produit.  
   • La console affiche `Current selected usages: []` en boucle, puis la logique de navigation cherche un sous-étape invalide.

2. **Analyse – cause racine**  
   *Dans `components/steps/usage-selection.tsx`* :  
   \`\`\`tsx
   function UsageCard({ … }) {
     const selectedUsages = []   // ← VARIABLE LOCALE FANTÔME
   \`\`\`
   Cette variable masque (shadow) l'état remonté par le composant parent : `selectedUsages` reste donc **toujours vide** à l'intérieur du composant, les logs console sont trompeurs et la logique `handleNext` pense qu'aucun usage n'est sélectionné.

   De plus, même après correction de cette variable, un second problème existe : les mises à jour d'état React sont asynchrones, donc `data.usages` n'est pas immédiatement disponible lors de l'appel à `goToStep(1, 2)`.

3. **Lignes problématiques**  
   \`\`\`tsx
   // components/steps/usage-selection.tsx  (fin de fichier)
   132: function UsageCard({ id, … }) {
   133:   const selectedUsages = []   // <= à supprimer
   \`\`\`
   
   \`\`\`tsx
   // components/steps/usage-selection.tsx (dans handleNext)
   58: if (selectedUsages.includes("garden")) {
   59:   goToStep(1, 2) // <= navigation avant mise à jour d'état
   \`\`\`

4. **Étapes exactes du dysfonctionnement**  
   1. L'utilisateur clique sur la carte « Jardin » → `handleUsageToggle("garden")` met à jour l'état parent.  
   2. `UsageSelection` se re-render ; la carte se voit passer `checked={true}`.  
   3. À l'intérieur de `UsageCard`, la variable locale `selectedUsages` est *recréée vide*, les logs affichent `[]`.  
   4. Lors du clic sur **Suivant**, `handleNext` exécute `if (selectedUsages.includes("garden"))` → la condition est vraie mais la navigation vers `goToStep(1,2)` échoue car `data.usages` n'est pas encore mis à jour lorsque le routeur vérifie `condition: (data) => data.usages.includes("garden")`.

5. **Pistes de résolution**  
   *Approche A – Minimaliste (implémentée)*  
   • Supprimer la variable fantôme et déclencher la navigation *après* la mise à jour d'état :
   \`\`\`diff
     function UsageCard({ … }: UsageCardProps) {
   -   const selectedUsages = [] // Declare the variable here
       return (
   \`\`\`
   \`\`\`diff
     // Dans handleNext
     updateData(updatedData)
     if (selectedUsages.includes("garden")) {
   -   goToStep(1, 2)
   +   setTimeout(() => goToStep(1, 2), 0) // Exécution après commit de l'état
     }
   \`\`\`  
   
   *Approche B – useEffect pattern*  
   • Utiliser un effet pour détecter les changements de `data.usages` et naviguer automatiquement.

6. **Correctif appliqué**  
   \`\`\`patch
   *** Update File: components/steps/usage-selection.tsx
   @@
   -function UsageCard({ id, title, description, icon, checked, onToggle }: UsageCardProps) {
   -  const selectedUsages = [] // BUG : masque l'état réel
   -  {console.log("Current selected usages:", selectedUsages)}
   +function UsageCard({ id, title, description, icon, checked, onToggle }: UsageCardProps) {
   +  // Utiliser uniquement la prop `checked` pour savoir si la carte est sélectionnée
   \`\`\`  
   \`\`\`patch
   @@
   if (selectedUsages.includes("garden")) {
   -  goToStep(1, 2) // Explicitly go to step 1, substep 2 (Garden Surface)
   +  // Delay navigation to ensure `updateData` state is committed
   +  setTimeout(() => goToStep(1, 2), 0)
   }
   \`\`\`

   **Statut** : ✅ **RÉSOLU** - Le bouton Suivant fonctionne maintenant correctement lorsque seul "Arrosage du jardin" est sélectionné.

## 3. UX Adresse (P1)

* Retirer le `<h3>Sélectionnez votre bâtiment</h3>` statique dans `components/address/building/BuildingMapSection.tsx` ou l'afficher seulement si `buildings.length > 1`.

---

## 5. Calculs & Résultats (P2)

### 4.1  Arrondi volume cuve

`components/steps/autonomy-selection.tsx` `L100-115`

\`\`\`ts
const recommendedTankSizeM3Rounded = Math.ceil(recommendedTankSizeM3)
const recommendedTankSize = recommendedTankSizeM3Rounded * 1000   // litres
\`\`\`

### 4.2  Économie : pas de centimes + note

`components/steps/results.tsx`

* Formattage euros : `formatNumber(data.potentialSavingsEuros,0)`
* Sous la carte « Économie potentielle » :

\`\`\`tsx
<p className="text-xs text-gray-500 mt-2">
  Économie calculée sur un prix moyen de 4 €/m³
</p>
\`\`\`

### 4.3  Taux de couverture – texte invisible

\`\`\`tsx
const textColor = coveragePercentage < 30 ? "text-slate-900 dark:text-white" : "text-white";
<div className={`absolute … font-bold ${textColor}`}>{formatNumber(data.coverageRate,1)}%</div>
\`\`\`

### 4.4  Graphiques précipitations non affichés

`components/rainfall-details.tsx`

* Au lieu de `return null` quand `error`, afficher un `Card` avec message.
* Si pas de coordonnées mais `annualRainfall` présent → générer 12 mois synthétiques (uniformes).

---

## 6. Aides disponibles (P2)

* Remplacer le `setTimeout` mock dans `components/steps/financial-aid.tsx` par un appel API réel.
* Dans `components/steps/results.tsx`, cacher le bouton « Voir les aides » si `aids.length === 0`.

---

## 7. Tests automatisés

| Type | Fichier | Vérifie |
|------|---------|---------|
| RTL | `usage-selection.test.tsx` | Double-clic sur « Suivant » déclenche une navigation |
| RTL | `roof-surface-question.test.tsx` | Un seul appel à `goToStep` malgré dbl-click |
| Jest | `roofCalculator.test.ts` | 4.2 m³ → 5 m³ |
| Cypress | `address_flow.cy.ts` | Aller/retour adresse sans blocage |

---

## 8. Planning

| Pri. | Action | Charge |
|------|--------|--------|
| P0 | Implémenter `useSingleFlight` + patch composants | 0.5 j |
| P1 | Navigation & UX adresse | 1 j |
| P1 | Arrondi + affichage résultats | 0.5 j |
| P2 | Pluviométrie, aides | 1.5 j |
| QA | Tests unitaires + e2e | 1 j |

---

### 9. Annexe – Snippet anti-double-clic vanilla

\`\`\`ts
const guard = (fn:()=>Promise<void>|void)=>{
  let busy=false;
  return async ()=>{ if(busy) return;
    busy=true; try{ await fn(); } finally{ busy=false; }
  };
};
\`\`\`

---

© 2025 PUM Engineering
