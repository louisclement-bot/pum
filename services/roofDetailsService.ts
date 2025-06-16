import type { RoofDetails } from "../types/addressTypes"

export async function fetchRoofDetails(rnbId: string): Promise<RoofDetails | null> {
  try {
    const response = await fetch(`/api/roof-details?rnbId=${rnbId}`)
    if (!response.ok) {
      console.warn(`Impossible de récupérer les détails du toit pour rnb_id=${rnbId}`)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error("Erreur lors de la récupération des détails du toit:", error)
    return null
  }
}
