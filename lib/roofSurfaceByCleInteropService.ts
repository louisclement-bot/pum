import axios from "axios"
import type { Feature, Polygon, MultiPolygon } from "geojson"
import * as turf from "@turf/turf"
import type { BuildingDataResponse, BuildingAttributes } from "./buildingServiceTypes"

/**
 * Fetches building data from BDNB API directly using cle_interop_adr (BAN ID)
 * This can be used as a direct method if the BAN ID is already known
 *
 * @param cleInteropAdr The BAN ID (cle_interop_adr)
 * @returns Array of building data responses or null if no buildings found
 */
export async function fetchBuildingDataByCleInterop(cleInteropAdr: string): Promise<BuildingDataResponse[] | null> {
  if (!cleInteropAdr) {
    console.warn("BDNB: No cle_interop_adr (BAN ID) provided.")
    return null
  }

  // According to the documentation, this is the correct endpoint for address lookups
  const url = `https://api.bdnb.io/v1/bdnb/donnees/batiment_groupe_complet/adresse`

  // Following the example in the documentation
  const params = {
    limit: 10,
    // Select only fields that are shown in the documentation example
    select:
      "batiment_groupe_id,code_departement_insee,code_commune_insee,code_iris,libelle_commune_insee,libelle_adr_principale_ban,geom_groupe,hauteur_mean,altitude_sol_mean,nb_log",
    cle_interop_adr: `eq.${cleInteropAdr}`,
  }

  console.log(`Querying BDNB directly by cle_interop: ${url} with cle_interop_adr=${cleInteropAdr}`)

  try {
    const response = await axios.get(url, { params })

    // Check if we got any results
    if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
      console.log(`BDNB: No buildings found for cle_interop ${cleInteropAdr}.`)
      return null
    }

    // Process all buildings from the results
    const buildings: BuildingDataResponse[] = []

    for (let i = 0; i < response.data.length; i++) {
      const building = response.data[i]

      // Extract the geometry
      if (!building.geom_groupe) {
        console.warn(`BDNB: Building ${i} has no geometry.`)
        continue
      }

      // Convert to GeoJSON feature
      const footprintFeature: Feature<Polygon | MultiPolygon> = {
        type: "Feature",
        geometry: building.geom_groupe,
        properties: {},
      }

      // Calculer l'aire du bâtiment à partir de la géométrie
      let area = null
      try {
        area = turf.area(footprintFeature)
        console.log(`Calculated area for building ${i}: ${area.toFixed(2)} m²`)
      } catch (error) {
        console.warn(`Failed to calculate area for building ${i}:`, error)
      }

      // Extract attributes
      const attributes: BuildingAttributes = {
        id: building.batiment_groupe_id || null,
        source_id: building.batiment_groupe_id || null,
        emprise_sol_aire: area,
        label: building.libelle_adr_principale_ban || `Bâtiment ${i + 1}`,
      }

      buildings.push({
        source: "BDNB",
        footprint: footprintFeature,
        attributes,
        isSelected: i === 0, // Select the first building by default
      })
    }

    console.log(`BDNB Success: Found ${buildings.length} buildings using cle_interop directly`)
    return buildings
  } catch (error: any) {
    console.error("Error fetching from BDNB API by cle_interop:", error.response?.data || error.message)
    return null
  }
}

/**
 * Fetches building data from BDNB API using the relationship between
 * buildings and addresses via the rel_batiment_groupe_adresse endpoint
 * This method can sometimes find buildings that the direct method misses
 *
 * @param cleInteropAdr The BAN ID (cle_interop_adr)
 * @returns Array of building data responses or null if no buildings found
 */
export async function fetchBuildingDataByAddressRelation(
  cleInteropAdr: string,
): Promise<BuildingDataResponse[] | null> {
  if (!cleInteropAdr) {
    console.warn("BDNB: No cle_interop_adr (BAN ID) provided for relationship lookup.")
    return null
  }

  // First, get the building group IDs associated with this address
  // According to the documentation, this is the correct endpoint for the relationship table
  const relationUrl = `https://api.bdnb.io/v1/bdnb/donnees/rel_batiment_groupe_adresse`
  const relationParams = {
    cle_interop_adr: `eq.${cleInteropAdr}`,
    select: "batiment_groupe_id",
  }

  console.log(`Querying BDNB address relation: ${relationUrl} with cle_interop_adr=${cleInteropAdr}`)

  try {
    const relationResponse = await axios.get(relationUrl, { params: relationParams })

    if (!relationResponse.data || !Array.isArray(relationResponse.data) || relationResponse.data.length === 0) {
      console.log(`BDNB: No building relationships found for cle_interop ${cleInteropAdr}.`)
      return null
    }

    // Extract the building group IDs
    const buildingGroupIds = relationResponse.data.map((relation) => relation.batiment_groupe_id).filter(Boolean)

    if (buildingGroupIds.length === 0) {
      console.log("BDNB: No valid building group IDs found in relationships.")
      return null
    }

    console.log(`BDNB: Found ${buildingGroupIds.length} building relationships for cle_interop ${cleInteropAdr}.`)

    // Now fetch the actual building data using these IDs
    // According to the documentation, for ID-based lookups we should use the main endpoint
    const buildingUrl = `https://api.bdnb.io/v1/bdnb/donnees/batiment_groupe_complet`

    // Format the IN parameter correctly according to the documentation examples
    // The format should be: in.(value1,value2,value3)
    // For quoted values: in.("value1","value2","value3")
    const buildingIdsParam = `in.(${buildingGroupIds.map((id) => `"${id}"`).join(",")})`

    const buildingParams = {
      batiment_groupe_id: buildingIdsParam,
      // Select only fields that are shown in the documentation example
      select:
        "batiment_groupe_id,code_departement_insee,code_commune_insee,code_iris,libelle_commune_insee,libelle_adr_principale_ban,geom_groupe,hauteur_mean,altitude_sol_mean,nb_log",
    }

    console.log(`Querying BDNB buildings by IDs: ${buildingUrl} with IDs: ${buildingGroupIds.join(", ")}`)

    const buildingResponse = await axios.get(buildingUrl, { params: buildingParams })

    if (!buildingResponse.data || !Array.isArray(buildingResponse.data) || buildingResponse.data.length === 0) {
      console.log("BDNB: No buildings found using the relationship IDs.")
      return null
    }

    // Process all buildings from the results
    const buildings: BuildingDataResponse[] = []

    for (let i = 0; i < buildingResponse.data.length; i++) {
      const building = buildingResponse.data[i]

      // Extract the geometry
      if (!building.geom_groupe) {
        console.warn(`BDNB: Building ${i} has no geometry.`)
        continue
      }

      // Convert to GeoJSON feature
      const footprintFeature: Feature<Polygon | MultiPolygon> = {
        type: "Feature",
        geometry: building.geom_groupe,
        properties: {},
      }

      // Calculer l'aire du bâtiment à partir de la géométrie
      let area = null
      try {
        area = turf.area(footprintFeature)
      } catch (error) {
        console.warn(`Failed to calculate area for building ${i}:`, error)
      }

      // Extract attributes
      const attributes: BuildingAttributes = {
        id: building.batiment_groupe_id || null,
        source_id: building.batiment_groupe_id || null,
        emprise_sol_aire: area,
        label: building.libelle_adr_principale_ban || `Bâtiment ${i + 1}`,
      }

      buildings.push({
        source: "BDNB",
        footprint: footprintFeature,
        attributes,
        isSelected: i === 0, // Select the first building by default
      })
    }

    console.log(`BDNB Success: Found ${buildings.length} buildings using address relationships`)
    return buildings
  } catch (error: any) {
    console.error("Error fetching from BDNB API using address relationships:", error.response?.data || error.message)
    return null
  }
}
