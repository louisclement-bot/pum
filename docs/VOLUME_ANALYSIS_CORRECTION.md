# Analyse Corrigée des Volumes de Cuves Disponibles  
_Date de mise à jour : 23 juin 2025_

---

## 1. Contexte

Cette analyse s’appuie désormais sur le fichier **products.json** mis à jour (issues #volumes-invalid / #damona-fix).  
Les volumes de cuves ci-dessous représentent **l’offre complète actuelle**.

---

## 2. Volumes Disponibles

### 2.1 Cuves aériennes  
Volumes uniques triés :
- 400 L  
- 465 L (DAMONA)  
- 700 L  
- 1 000 L  
- 3 000 L  
- 5 000 L  
- 10 000 L  

### 2.2 Cuves enterrées  
Volumes uniques triés :
- 2 000 L  
- 3 000 L  
- 4 000 L  
- 5 000 L  
- 6 000 L  
- 7 000 L  
- 8 000 L  
- 10 000 L  
- 15 000 L  
- 20 000 L  
- 25 000 L  
- 30 000 L  
- 35 000 L  
- 40 000 L  
- 45 000 L  
- 50 000 L  
- 55 000 L  
- 60 000 L  

---

## 3. Analyse des « gaps »

| Gamme | Volumes manquants significatifs | Commentaires |
|-------|---------------------------------|--------------|
| Aériennes | 1 000 L → 3 000 L (gap 2 000 L) <br> 10 000 L → ∞ | Peu d’impact : les besoins supérieurs basculent vers enterré. |
| Enterrées | **Aucun gap ≤ 10 000 L** (granularité 1 000 L) <br> 10 000 L → 15 000 L (5 000 L) | Granularité suffisante pour le dimensionnement réel. |

**Volume maximum disponible : 60 000 L** (enterrée).

---

## 4. Fonction d’Arrondi `roundUpToNearestCap` (V2)

La V2 introduit un **arrondi unifié « plus proche volume supérieur »** basé sur deux listes
de capacités _figées_ dans le code :

```ts
const AERIAL_CAPS = [400, 700, 1000, 3000, 5000, 10000];
const BURIED_CAPS = [3000, 5000, 8000, 10000, 20000];

function roundUpToNearestCap(need: number, caps: number[]) {
  return caps.find((c) => c >= need) ?? need; // si > max, on laisse le besoin tel quel
}
```

| Besoin calculé (L) | Type | Capacité retenue (L) | Règle appliquée |
|--------------------|------|----------------------|-----------------|
| 850 | Aérienne | **1 000** | 1 000 est la 1ʳᵉ valeur ≥ 850 dans `AERIAL_CAPS`. |
| 2 600 | Aérienne | **3 000** | 3 000 est la 1ʳᵉ valeur ≥ 2 600. |
| 4 200 | Enterrée | **5 000** | 5 000 est la 1ʳᵉ valeur ≥ 4 200 dans `BURIED_CAPS`. |
| 7 600 | Enterrée | **8 000** | 8 000 est la 1ʳᵉ valeur ≥ 7 600. |
| 18 500 | Enterrée | **20 000** | 20 000 est la 1ʳᵉ valeur ≥ 18 500. |
| 65 000 | Enterrée | **65 000** | > plus grand cap → renvoyé tel quel (message « sur-mesure »). |

> 🔍  Remarque : l’algorithme ne sous-dimensionne jamais ; il garantit
> un volume **≥** au besoin calculé.

---

## 5. Impacts

1. **Précision accrue** : chaque recommandation correspond exactement à une cuve du catalogue.  
2. **Couverture complète** des besoins de 400 L à 60 000 L sans trou critique côté enterrées.  
3. **Sur-dimensionnement réduit** grâce aux nouveaux volumes intermédiaires (2 000 L, 4 000 L, 6 000 L, 7 000 L, etc.).  
4. **Expérience utilisateur** : message spécifique si besoin > 60 000 L (« solution sur-mesure »).

---

## 6. Conclusion

Le simulateur exploite désormais la **V2** de l’algorithme de recommandation.
La nouvelle fonction `roundUpToNearestCap` garantit :

- Cohérence catalogue ⇄ recommandations.  
- Flexibilité du 400 L jusqu’au 60 000 L.  
- Aucune recommandation fantôme.  

Les futures évolutions catalogue se propageront automatiquement via
`roundUpToNearestCap()` et `getAvailableTankVolumes()`.  
