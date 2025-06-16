export interface RoofDetails {
  orientation?: string
  slope?: number
  material?: string
  age?: number
  condition?: string
  area?: number
  source?: string
}

/**
 * Récupère les détails du toit à partir du rnb_id
 * @param rnbId Identifiant RNB du bâtiment
 * @returns Détails du toit ou null si non disponible
 */
export async function fetchRoofDetailsByRnbId(rnbId: string): Promise<RoofDetails | null> {
  if (!rnbId) {
    console.warn("Aucun rnb_id fourni pour la recherche des détails du toit")
    return null
  }

  try {
    // Dans un environnement réel, nous ferions un appel à l'API BDNB
    // Pour l'instant, nous simulons des données

    // Simuler un délai réseau
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Générer des données aléatoires mais cohérentes basées sur le rnb_id
    // Utiliser le rnb_id comme graine pour la génération pseudo-aléatoire
    const seed = Array.from(rnbId).reduce((acc, char) => acc + char.charCodeAt(0), 0)

    const orientations = ["Nord", "Nord-Est", "Est", "Sud-Est", "Sud", "Sud-Ouest", "Ouest", "Nord-Ouest"]
    const materials = ["Tuiles", "Ardoises", "Zinc", "Béton", "Tôle", "Végétalisé"]

    // Générer des valeurs déterministes basées sur le seed
    const orientationIndex = seed % orientations.length
    const materialIndex = (seed * 13) % materials.length
    const slope = 5 + (seed % 40) // Pente entre 5° et 45°
    const age = 1 + (seed % 50) // Âge entre 1 et 50 ans

    return {
      orientation: orientations[orientationIndex],
      slope,
      material: materials[materialIndex],
      age,
      condition: age < 15 ? "Bon" : age < 30 ? "Moyen" : "À rénover",
      source: "BDNB (simulé)",
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des détails du toit:", error)
    return null
  }
}
