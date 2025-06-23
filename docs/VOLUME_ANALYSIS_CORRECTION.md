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

## 4. Fonction d’Arrondi `ceilToAvailableVolume`

| Besoin calculé (L) | Nouveau volume recommandé (L) | Justification |
|--------------------|-------------------------------|---------------|
| 1 700 | **2 000** | Plus proche volume supérieur. |
| 3 800 | **4 000** | Granularité 1 000 L sur enterrées. |
| 6 500 | **7 000** | Volume 7 000 L existant. |
| 22 000 | **25 000** | 20 000 < 22 000 < 25 000. |
| 58 000 | **60 000** | Plafond catalogue. |
| 65 000 | **60 000** | ≥ max → retourne 60 000 avec alerte « projet sur-mesure ». |

---

## 5. Impacts

1. **Précision accrue** : chaque recommandation correspond exactement à une cuve du catalogue.  
2. **Couverture complète** des besoins de 400 L à 60 000 L sans trou critique côté enterrées.  
3. **Sur-dimensionnement réduit** grâce aux nouveaux volumes intermédiaires (2 000 L, 4 000 L, 6 000 L, 7 000 L, etc.).  
4. **Expérience utilisateur** : message spécifique si besoin > 60 000 L (« solution sur-mesure »).

---

## 6. Conclusion

Le simulateur exploite désormais une gamme révisée ; la fonction d’arrondi supérieur assure :

- Cohérence catalogue ⇄ recommandations.  
- Flexibilité du 400 L jusqu’au 60 000 L.  
- Aucune recommandation fantôme.  

Les futures évolutions catalogue se propageront automatiquement via `ceilToAvailableVolume()` et `getAvailableTankVolumes()`.  
