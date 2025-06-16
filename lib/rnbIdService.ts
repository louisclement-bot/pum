import axios from "axios"

/**
 * Interface pour les résultats de la requête batiment_construction
 */
export interface BatimentConstructionResult {
  batiment_construction_id: string
  rnb_id: string
  batiment_groupe_id: string
  // Autres champs disponibles dans la table batiment_construction
  hauteur?: number
  altitude_sol?: number
  fictive_geom_cstr?: boolean
  geom_cstr?: any
}

/**
 * Récupère les identifiants RNB (rnb_id) pour un groupe de bâtiments donné
 *
 * @param batimentGroupeId L'identifiant du groupe de bâtiments (batiment_groupe_id)
 * @returns Un tableau d'objets contenant les rnb_id et autres informations, ou null si aucun résultat
 */
export async function fetchRnbIdsByBatimentGroupe(
  batimentGroupeId: string,
): Promise<BatimentConstructionResult[] | null> {
  if (!batimentGroupeId) {
    console.warn("BDNB: Aucun batiment_groupe_id fourni pour la recherche de rnb_id.")
    return null
  }

  // URL de l'API pour la table batiment_construction
  const url = "https://api.bdnb.io/v1/bdnb/donnees/batiment_construction"

  // Paramètres de la requête
  const params = {
    // Sélectionner les champs pertinents
    select: "batiment_construction_id,rnb_id,batiment_groupe_id,hauteur,altitude_sol",
    // Filtrer par batiment_groupe_id
    batiment_groupe_id: `eq.${batimentGroupeId}`,
    // Limiter le nombre de résultats (optionnel)
    limit: 50,
  }

  console.log(`Recherche des rnb_id pour le groupe de bâtiments: ${batimentGroupeId}`)

  try {
    const response = await axios.get(url, { params })

    // Vérifier si nous avons des résultats
    if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
      console.log(`BDNB: Aucun rnb_id trouvé pour le groupe de bâtiments ${batimentGroupeId}.`)
      return null
    }

    // Traiter les résultats
    const results: BatimentConstructionResult[] = response.data.map((item: any) => ({
      batiment_construction_id: item.batiment_construction_id,
      rnb_id: item.rnb_id,
      batiment_groupe_id: item.batiment_groupe_id,
      hauteur: item.hauteur,
      altitude_sol: item.altitude_sol,
      fictive_geom_cstr: item.fictive_geom_cstr,
      geom_cstr: item.geom_cstr,
    }))

    console.log(`BDNB: ${results.length} rnb_id trouvés pour le groupe de bâtiments ${batimentGroupeId}.`)
    return results
  } catch (error: any) {
    console.error("Erreur lors de la récupération des rnb_id depuis l'API BDNB:", error.response?.data || error.message)
    return null
  }
}

/**
 * Récupère les identifiants RNB (rnb_id) pour plusieurs groupes de bâtiments
 *
 * @param batimentGroupeIds Tableau d'identifiants de groupes de bâtiments
 * @returns Un objet avec les batiment_groupe_id comme clés et les résultats comme valeurs
 */
export async function fetchRnbIdsForMultipleGroups(
  batimentGroupeIds: string[],
): Promise<Record<string, BatimentConstructionResult[] | null>> {
  if (!batimentGroupeIds || batimentGroupeIds.length === 0) {
    console.warn("BDNB: Aucun batiment_groupe_id fourni pour la recherche de rnb_id.")
    return {}
  }

  // URL de l'API pour la table batiment_construction
  const url = "https://api.bdnb.io/v1/bdnb/donnees/batiment_construction"

  // Formater les IDs pour la clause IN
  // Format: in.("id1","id2","id3")
  const formattedIds = `in.(${batimentGroupeIds.map((id) => `"${id}"`).join(",")})`

  // Paramètres de la requête
  const params = {
    select: "batiment_construction_id,rnb_id,batiment_groupe_id,hauteur,altitude_sol",
    batiment_groupe_id: formattedIds,
  }

  console.log(`Recherche des rnb_id pour ${batimentGroupeIds.length} groupes de bâtiments`)

  try {
    const response = await axios.get(url, { params })

    // Vérifier si nous avons des résultats
    if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
      console.log(`BDNB: Aucun rnb_id trouvé pour les groupes de bâtiments spécifiés.`)
      return batimentGroupeIds.reduce((acc, id) => ({ ...acc, [id]: null }), {})
    }

    // Organiser les résultats par batiment_groupe_id
    const resultsByGroup: Record<string, BatimentConstructionResult[]> = {}

    response.data.forEach((item: any) => {
      const groupId = item.batiment_groupe_id
      if (!resultsByGroup[groupId]) {
        resultsByGroup[groupId] = []
      }

      resultsByGroup[groupId].push({
        batiment_construction_id: item.batiment_construction_id,
        rnb_id: item.rnb_id,
        batiment_groupe_id: item.batiment_groupe_id,
        hauteur: item.hauteur,
        altitude_sol: item.altitude_sol,
        fictive_geom_cstr: item.fictive_geom_cstr,
        geom_cstr: item.geom_cstr,
      })
    })

    // S'assurer que tous les IDs demandés sont présents dans le résultat
    const result: Record<string, BatimentConstructionResult[] | null> = {}
    batimentGroupeIds.forEach((id) => {
      result[id] = resultsByGroup[id] || null
    })

    console.log(
      `BDNB: Résultats trouvés pour ${Object.keys(resultsByGroup).length} groupes de bâtiments sur ${batimentGroupeIds.length} demandés.`,
    )
    return result
  } catch (error: any) {
    console.error("Erreur lors de la récupération des rnb_id depuis l'API BDNB:", error.response?.data || error.message)

    // Retourner un objet avec tous les IDs demandés et des valeurs null
    return batimentGroupeIds.reduce((acc, id) => ({ ...acc, [id]: null }), {})
  }
}

/**
 * Récupère un seul rnb_id pour un groupe de bâtiments donné
 * Utile lorsque vous avez besoin d'un seul identifiant représentatif
 *
 * @param batimentGroupeId L'identifiant du groupe de bâtiments
 * @returns Le premier rnb_id trouvé ou null si aucun
 */
export async function fetchSingleRnbId(batimentGroupeId: string): Promise<string | null> {
  const results = await fetchRnbIdsByBatimentGroupe(batimentGroupeId)

  if (!results || results.length === 0) {
    return null
  }

  // Retourner le premier rnb_id trouvé
  return results[0].rnb_id || null
}
