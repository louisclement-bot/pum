import type { GeocodeResult } from "./geocodeService"
import type { BuildingDataResponse } from "./buildingServiceTypes"
import {
  fetchBuildingDataByAddress,
  fetchBuildingDataFromOSM,
  simulateBuildingData,
} from "./roofSurfaceByAddressService"
import { fetchBuildingDataByCleInterop, fetchBuildingDataByAddressRelation } from "./roofSurfaceByCleInteropService"

// Ajouter l'import pour le nouveau service
import { fetchRnbIdsByBatimentGroupe } from "./rnbIdService"

export type BuildingDataSource = "BDNB" | "OSM" | "SIMULATED"

/**
 * Main orchestration function to retrieve building data
 * Attempts multiple approaches in order of preference with robust fallback strategy
 *
 * @param geocodeResult The geocoding result containing coordinates and interoperability key
 * @returns Array of building data responses or null if no buildings found
 */
export async function getBuildingData(geocodeResult: GeocodeResult): Promise<BuildingDataResponse[] | null> {
  console.log("Getting building data for:", {
    address: geocodeResult.label,
    banId: geocodeResult.banId,
    coordinates: [geocodeResult.longitude, geocodeResult.latitude],
  })

  const { latitude, longitude, banId } = geocodeResult
  console.log(`Attempting to find building data near ${latitude}, ${longitude} with BAN ID ${banId || "N/A"}`)

  // Track which methods we've tried for better logging
  const attemptedMethods: string[] = []
  const errorMessages: string[] = []

  // 1. Try the optimized address lookup via BDNB API
  attemptedMethods.push("BDNB address lookup")
  try {
    console.log("Attempting BDNB address lookup...")
    const bdnbData = await fetchBuildingDataByAddress(geocodeResult)
    if (bdnbData && bdnbData.length > 0) {
      console.log(`✅ Successfully found ${bdnbData.length} buildings using BDNB address lookup`)

      // Enrichir les données avec les rnb_id
      const enrichedData = await enrichBuildingsWithRnbIds(bdnbData)
      return enrichedData
    } else {
      console.log("❌ No buildings found using BDNB address lookup")
    }
  } catch (error: any) {
    const errorMsg = `Error with BDNB address lookup: ${error.message || "Unknown error"}`
    console.error(errorMsg)
    errorMessages.push(errorMsg)
  }

  // 2. If we have a BAN ID, try direct lookup by cle_interop_adr
  if (banId) {
    attemptedMethods.push("BDNB direct cle_interop lookup")
    try {
      console.log(`Attempting direct BDNB lookup with cle_interop: ${banId}...`)
      const cleInteropData = await fetchBuildingDataByCleInterop(banId)
      if (cleInteropData && cleInteropData.length > 0) {
        console.log(`✅ Successfully found ${cleInteropData.length} buildings using direct cle_interop lookup`)

        // Enrichir les données avec les rnb_id
        const enrichedData = await enrichBuildingsWithRnbIds(cleInteropData)
        return enrichedData
      } else {
        console.log("❌ No buildings found using direct cle_interop lookup")
      }
    } catch (error: any) {
      const errorMsg = `Error with direct cle_interop lookup: ${error.message || "Unknown error"}`
      console.error(errorMsg)
      errorMessages.push(errorMsg)
    }

    // 3. Try relationship lookup as a fallback for BDNB
    attemptedMethods.push("BDNB address relationship lookup")
    try {
      console.log(`Attempting BDNB address relationship lookup with cle_interop: ${banId}...`)
      const relationData = await fetchBuildingDataByAddressRelation(banId)
      if (relationData && relationData.length > 0) {
        console.log(`✅ Successfully found ${relationData.length} buildings using address relationship lookup`)

        // Enrichir les données avec les rnb_id
        const enrichedData = await enrichBuildingsWithRnbIds(relationData)
        return enrichedData
      } else {
        console.log("❌ No buildings found using address relationship lookup")
      }
    } catch (error: any) {
      const errorMsg = `Error with address relationship lookup: ${error.message || "Unknown error"}`
      console.error(errorMsg)
      errorMessages.push(errorMsg)
    }
  } else {
    console.log("⚠️ No BAN ID available, skipping direct cle_interop and relationship lookups")
  }

  // 4. Try OSM Overpass as a secondary data source
  attemptedMethods.push("OSM Overpass")
  try {
    console.log(`Attempting OSM Overpass lookup at coordinates: ${latitude}, ${longitude}...`)
    const osmData = await fetchBuildingDataFromOSM(latitude, longitude)
    if (osmData && osmData.length > 0) {
      console.log(`✅ Successfully found ${osmData.length} buildings using OSM Overpass`)
      return osmData
    } else {
      console.log("❌ No buildings found using OSM Overpass")
    }
  } catch (error: any) {
    const errorMsg = `Error with OSM data: ${error.message || "Unknown error"}`
    console.error(errorMsg)
    errorMessages.push(errorMsg)
  }

  // 5. Fallback to simulated data as a last resort
  console.log(`⚠️ All data sources failed (${attemptedMethods.join(", ")}). Using simulated building data.`)
  if (errorMessages.length > 0) {
    console.log("Errors encountered:")
    errorMessages.forEach((msg, i) => console.log(`  ${i + 1}. ${msg}`))
  }

  return simulateBuildingData(latitude, longitude)
}

// Ajouter une nouvelle fonction pour enrichir les données de bâtiment avec les rnb_id
/**
 * Enrichit les données de bâtiment avec les identifiants RNB (rnb_id)
 *
 * @param buildings Tableau de données de bâtiments
 * @returns Le même tableau enrichi avec les rnb_id
 */
export async function enrichBuildingsWithRnbIds(buildings: BuildingDataResponse[]): Promise<BuildingDataResponse[]> {
  if (!buildings || buildings.length === 0) {
    return buildings
  }

  // Extraire les batiment_groupe_id des bâtiments BDNB
  const bdnbBuildings = buildings.filter((b) => b.source === "BDNB" && b.attributes.id)

  if (bdnbBuildings.length === 0) {
    console.log("Aucun bâtiment BDNB à enrichir avec des rnb_id")
    return buildings
  }

  const buildingIds = bdnbBuildings.map((b) => b.attributes.id as string)

  try {
    // Récupérer les rnb_id pour tous les bâtiments en une seule requête
    const rnbIdsMap = await fetchRnbIdsForMultipleGroups(buildingIds)

    // Enrichir chaque bâtiment avec son rnb_id
    return buildings.map((building) => {
      // Ne traiter que les bâtiments BDNB avec un ID
      if (building.source === "BDNB" && building.attributes.id) {
        const buildingId = building.attributes.id
        const rnbResults = rnbIdsMap[buildingId]

        // Si nous avons des résultats pour ce bâtiment
        if (rnbResults && rnbResults.length > 0) {
          // Ajouter le premier rnb_id aux attributs du bâtiment
          return {
            ...building,
            attributes: {
              ...building.attributes,
              rnb_id: rnbResults[0].rnb_id,
            },
          }
        }
      }

      // Retourner le bâtiment inchangé si pas de résultat ou pas un bâtiment BDNB
      return building
    })
  } catch (error) {
    console.error("Erreur lors de l'enrichissement des bâtiments avec les rnb_id:", error)
    return buildings
  }
}

async function fetchRnbIdsForMultipleGroups(buildingIds: string[]) {
  const rnbIdsMap: { [key: string]: any[] } = {}

  for (const buildingId of buildingIds) {
    try {
      const rnbIds = await fetchRnbIdsByBatimentGroupe(buildingId)
      rnbIdsMap[buildingId] = rnbIds
    } catch (error) {
      console.error(`Error fetching RNB IDs for building ${buildingId}:`, error)
      rnbIdsMap[buildingId] = [] // Store an empty array to avoid retries
    }
  }

  return rnbIdsMap
}

/**
 * Helper function to select a building by ID
 *
 * @param buildings Array of building data responses
 * @param buildingId ID of the building to select
 * @returns Updated array with the selected building
 */
export function selectBuilding(buildings: BuildingDataResponse[], buildingId: string): BuildingDataResponse[] {
  if (!buildings || buildings.length === 0) {
    console.warn("Cannot select building: No buildings provided")
    return buildings || []
  }

  if (!buildingId) {
    console.warn("Cannot select building: No building ID provided")
    return buildings
  }

  // Find if the building exists in the array
  const buildingExists = buildings.some((building) => building.attributes.id === buildingId)
  if (!buildingExists) {
    console.warn(`Building with ID ${buildingId} not found in the provided buildings array`)
  }

  // Update the selection state
  return buildings.map((building) => ({
    ...building,
    isSelected: building.attributes.id === buildingId,
  }))
}

/**
 * Helper function to get the selected building from an array
 *
 * @param buildings Array of building data responses
 * @returns The selected building or null if none is selected
 */
export function getSelectedBuilding(buildings: BuildingDataResponse[]): BuildingDataResponse | null {
  if (!buildings || buildings.length === 0) {
    return null
  }

  return buildings.find((building) => building.isSelected) || buildings[0]
}
