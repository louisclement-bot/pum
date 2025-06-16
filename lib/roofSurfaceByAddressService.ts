import axios from "axios"
import type { Feature, Polygon, MultiPolygon } from "geojson"
import * as turf from "@turf/turf"
import type { GeocodeResult } from "./geocodeService"
import type { BuildingDataResponse, BuildingAttributes } from "./buildingServiceTypes"

const SEARCH_BUFFER_METERS = 20 // How far around the geocoded point to search

/**
 * Fetches building data from BDNB API using the address interoperability key (cle_interop_adr)
 * from BAN geocoding results.
 *
 * @param geocodeResult The geocoding result containing the BAN ID (cle_interop_adr)
 * @returns Array of building data responses or null if no buildings found
 */
export async function fetchBuildingDataByAddress(geocodeResult: GeocodeResult): Promise<BuildingDataResponse[] | null> {
  // We need the cle_interop_adr (BAN ID) from the geocoding result
  const cleInteropAdr = geocodeResult.banId

  if (!cleInteropAdr) {
    console.warn("BDNB: No cle_interop_adr (BAN ID) available from geocoding result.")
    return null
  }

  // According to the documentation, this is the correct endpoint for address lookups
  const url = `https://api.bdnb.io/v1/bdnb/donnees/batiment_groupe_complet/adresse`

  // Following the example in the documentation
  const params = {
    limit: 10,
    // Select only fields that are shown in the documentation example
    select:
      "batiment_groupe_id,code_departement_insee,code_commune_insee,code_iris,libelle_commune_insee,libelle_adr_principale_ban,geom_groupe,hauteur_mean,altitude_sol_mean,nb_log,surface_emprise_sol,fiabilite_emprise_sol",
    cle_interop_adr: `eq.${cleInteropAdr}`,
  }

  console.log(`Querying BDNB by address: ${url} with cle_interop_adr=${cleInteropAdr}`)

  try {
    const response = await axios.get(url, { params })

    // Check if we got any results
    if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
      console.log("BDNB: No buildings found for the address.")
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

      // The building geometry is in the geom_groupe field
      const footprintFeature: Feature<Polygon | MultiPolygon> = {
        type: "Feature",
        geometry: building.geom_groupe,
        properties: {},
      }

      // Use the API-provided surface area directly
      const surfaceArea = building.surface_emprise_sol || null
      if (surfaceArea) {
        console.log(`Using API-provided area for building ${i}: ${surfaceArea.toFixed(2)} m²`)
      } else {
        console.warn(`No surface_emprise_sol provided for building ${i}`)
      }

      // Extract attributes
      const attributes: BuildingAttributes = {
        id: building.batiment_groupe_id || null,
        source_id: building.batiment_groupe_id || null,
        emprise_sol_aire: surfaceArea, // Use ONLY the API-provided area
        fiabilite_emprise_sol: building.fiabilite_emprise_sol || null, // Store reliability indicator
        label: building.libelle_adr_principale_ban || `Bâtiment ${i + 1}`,
      }

      buildings.push({
        source: "BDNB",
        footprint: footprintFeature,
        attributes,
        isSelected: i === 0, // Select the first building by default
      })
    }

    console.log(`BDNB Success: Found ${buildings.length} buildings using address`)
    return buildings
  } catch (error: any) {
    console.error("Error fetching from BDNB API by address:", error.response?.data || error.message)
    return null
  }
}

/**
 * Fetches building data from OSM Overpass using latitude and longitude
 * This is a fallback option if BDNB API doesn't return results
 *
 * @param lat Latitude
 * @param lon Longitude
 * @returns Array of building data responses or null if no buildings found
 */
export async function fetchBuildingDataFromOSM(lat: number, lon: number): Promise<BuildingDataResponse[] | null> {
  const bufferDegrees = SEARCH_BUFFER_METERS / 111000
  const bbox = `${lat - bufferDegrees},${lon - bufferDegrees},${lat + bufferDegrees},${lon + bufferDegrees}` // south,west,north,east
  const query = `
     [out:json][timeout:25];
     (
       way["building"](${bbox});
       relation["building"](${bbox});
     );
     out geom;
   `
  const overpassUrl = "https://overpass-api.de/api/interpreter"
  console.log(`Querying OSM Overpass near ${lat},${lon}`)

  try {
    const response = await axios.post(overpassUrl, `data=${encodeURIComponent(query)}`, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    })

    const elements = response.data.elements
    if (!elements || elements.length === 0) {
      console.log("OSM Overpass: No building elements found.")
      return null
    }

    // Convert Overpass elements to GeoJSON Features
    const features: Feature<Polygon | MultiPolygon>[] = []
    for (const element of elements) {
      if (element.type === "way" && element.geometry) {
        // Overpass 'out geom' provides geometry as {lat, lon} points
        const coordinates = element.geometry.map((pt: { lat: number; lon: number }) => [pt.lon, pt.lat])
        // Ensure polygon is closed
        if (
          coordinates.length > 2 &&
          (coordinates[0][0] !== coordinates[coordinates.length - 1][0] ||
            coordinates[0][1] !== coordinates[coordinates.length - 1][1])
        ) {
          coordinates.push(coordinates[0])
        }
        if (coordinates.length >= 4) {
          // Minimum for a valid linear ring
          features.push(
            turf.polygon([coordinates], {
              osm_id: element.id,
              ...element.tags,
              name: element.tags?.name || `Building ${element.id}`,
            }),
          )
        }
      }
      // Handling relations (MultiPolygons) is more complex and omitted for brevity
    }

    if (features.length === 0) {
      console.log("OSM Overpass: No valid building ways converted.")
      return null
    }

    // Find buildings near the target point
    const targetPoint = turf.point([lon, lat])
    const buildings: BuildingDataResponse[] = []

    // Sort features by distance to target point
    const featuresWithDistance = features
      .map((feature) => {
        try {
          const centroid = turf.centroid(feature)
          const distance = turf.distance(targetPoint, centroid, { units: "meters" })
          return { feature, distance }
        } catch (error) {
          return { feature, distance: Number.POSITIVE_INFINITY }
        }
      })
      .sort((a, b) => a.distance - b.distance)

    // Take the closest 5 buildings
    const closestFeatures = featuresWithDistance.slice(0, 5)

    for (let i = 0; i < closestFeatures.length; i++) {
      const { feature, distance } = closestFeatures[i]

      if (distance <= SEARCH_BUFFER_METERS * 2) {
        // Calculate area using turf.js
        let calculatedArea = null
        try {
          calculatedArea = turf.area(feature)
        } catch (error) {
          console.warn(`Failed to calculate area for OSM building ${i}:`, error)
        }

        const attributes: BuildingAttributes = {
          id: feature.properties?.osm_id?.toString() || null,
          source_id: feature.properties?.osm_id?.toString() || null,
          emprise_sol_aire: calculatedArea, // Use calculated area
          fiabilite_emprise_sol: "OSM", // Indicate this is from OSM
          label: feature.properties?.name || `Bâtiment ${i + 1}`,
        }

        buildings.push({
          source: "OSM",
          footprint: {
            type: "Feature",
            geometry: feature.geometry,
            properties: {}, // Clear properties unless needed downstream
          },
          attributes,
          isSelected: i === 0, // Select the first building by default
        })
      }
    }

    console.log(`OSM Overpass Success: Found ${buildings.length} buildings`)
    return buildings.length > 0 ? buildings : null
  } catch (error: any) {
    console.error("Error fetching from Overpass API:", error.response?.data || error.message)
    return null
  }
}

/**
 * Generate simulated building data as a last resort fallback
 *
 * @param lat Latitude
 * @param lon Longitude
 * @returns Array of simulated building data responses
 */
export function simulateBuildingData(lat: number, lon: number): BuildingDataResponse[] {
  const buildings: BuildingDataResponse[] = []

  // Create 3 buildings of different sizes around the point
  const bufferSizes = [0.0003, 0.0005, 0.0004]
  const offsets = [
    [0, 0],
    [0.0008, 0.0008],
    [-0.0008, 0.0008],
  ]

  for (let i = 0; i < 3; i++) {
    const bufferDegrees = bufferSizes[i]
    const [offsetLon, offsetLat] = offsets[i]

    const buildingLon = lon + offsetLon
    const buildingLat = lat + offsetLat

    const coordinates = [
      [buildingLon - bufferDegrees, buildingLat - bufferDegrees],
      [buildingLon + bufferDegrees, buildingLat - bufferDegrees],
      [buildingLon + bufferDegrees, buildingLat + bufferDegrees],
      [buildingLon - bufferDegrees, buildingLat + bufferDegrees],
      [buildingLon - bufferDegrees, buildingLat - bufferDegrees], // Close the polygon
    ]

    const footprint: Feature<Polygon> = {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [coordinates],
      },
      properties: {},
    }

    // Calculate area in square meters
    const area = turf.area(footprint)

    buildings.push({
      source: "SIMULATED",
      footprint,
      attributes: {
        id: `sim-${Math.random().toString(36).substring(2, 10)}`,
        source_id: null,
        emprise_sol_aire: area,
        fiabilite_emprise_sol: "SIMULATED",
        label: `Bâtiment simulé ${i + 1}`,
      },
      isSelected: i === 0, // Select the first building by default
    })
  }

  return buildings
}
