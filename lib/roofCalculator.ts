import * as turf from "@turf/turf"
import type { Feature, Polygon, MultiPolygon } from "geojson"
import type { BuildingDataSource } from "./buildingService"

export interface RoofCalculationResult {
  area: number // 2D Footprint Area in m²
  method: string // Description of how the area was obtained
}

/**
 * Determines the 2D roof surface area (building footprint).
 * NO PITCH CORRECTION APPLIED (as per requirements v1.1).
 * @param footprintGeoJson GeoJSON feature with Polygon or MultiPolygon geometry.
 * @param source The source of the building data ('BDNB', 'IGN_WFS', 'OSM').
 * @param precalculatedArea Optional pre-calculated 2D footprint area (e.g., from BDNB emprise_sol_aire).
 * @returns The 2D roof surface area in square meters and the method description.
 */
export function calculateRoofSurfaceFromFootprint(
  footprintGeoJson: Feature<Polygon | MultiPolygon>,
  source: BuildingDataSource,
  precalculatedArea?: number | null,
): RoofCalculationResult {
  // Add to calculateRoofSurfaceFromFootprint function
  console.log(`Source: ${source}, Pre-calculated area: ${precalculatedArea || "None"}`)
  console.log(`Geometry type: ${footprintGeoJson.geometry.type}`)

  // Sample coordinates for debugging
  let sampleCoords: any = []
  if (footprintGeoJson.geometry.type === "Polygon") {
    sampleCoords = footprintGeoJson.geometry.coordinates[0].slice(0, 3)
  } else if (footprintGeoJson.geometry.type === "MultiPolygon") {
    sampleCoords = footprintGeoJson.geometry.coordinates[0][0].slice(0, 3)
  }
  console.log(`Sample coordinates: ${JSON.stringify(sampleCoords)}`)

  // Determine coordinate system
  const likelyCoordSystem = determineCoordinateSystem(footprintGeoJson)
  console.log(`Likely coordinate system: ${likelyCoordSystem}`)
  // If we have a valid pre-calculated area from the API, use it
  if (precalculatedArea && precalculatedArea > 0 && source === "BDNB") {
    console.log(`Using pre-calculated area from ${source}: ${precalculatedArea.toFixed(2)} m²`)
    return {
      area: precalculatedArea,
      method: `${source}: Pre-calculated area from API`,
    }
  }

  try {
    // Determine if we need to transform coordinates based on the source
    let areaToUse: number
    let methodDescription: string

    if (source === "BDNB") {
      // For BDNB, we know the coordinates are in Lambert-93 (EPSG:2154)
      // Calculate area directly using the Lambert-93 coordinates
      // This is more accurate than transforming to WGS84 and then calculating
      areaToUse = calculateAreaInLambert93(footprintGeoJson)
      methodDescription = `${source}: Calculated area in Lambert-93 projection`
    } else {
      // For other sources (OSM, SIMULATED), assume WGS84 coordinates
      areaToUse = turf.area(footprintGeoJson)
      methodDescription = `${source}: Calculated 2D footprint area (turf.area)`
    }

    console.log(`Calculated 2D area from ${source} geometry: ${areaToUse.toFixed(2)} m²`)

    if (areaToUse === 0) {
      console.warn(`Calculated zero area from ${source} geometry.`)
      return {
        area: 0,
        method: `${methodDescription} - WARNING: Zero Area`,
      }
    }

    return {
      area: areaToUse,
      method: methodDescription,
    }
  } catch (error: any) {
    console.error(`Error calculating area for ${source}:`, error.message)
    return { area: 0, method: `${source}: Error calculating 2D footprint area` }
  }
}

/**
 * Calculates the area of a polygon in Lambert-93 projection.
 * Lambert-93 is a metric coordinate system, so area calculation is straightforward.
 * @param feature GeoJSON feature with coordinates in Lambert-93
 * @returns Area in square meters
 */
function calculateAreaInLambert93(feature: Feature<Polygon | MultiPolygon>): number {
  try {
    // Since Lambert-93 is already in meters, we can calculate the area directly
    // We're using a simple polygon area formula for each ring
    let totalArea = 0

    if (feature.geometry.type === "Polygon") {
      // For each ring in the polygon (first ring is exterior, rest are holes)
      for (let i = 0; i < feature.geometry.coordinates.length; i++) {
        const ring = feature.geometry.coordinates[i]
        const ringArea = calculateRingAreaInMetricSystem(ring)
        // First ring is exterior (positive area), others are holes (negative area)
        totalArea += i === 0 ? Math.abs(ringArea) : -Math.abs(ringArea)
      }
    } else if (feature.geometry.type === "MultiPolygon") {
      // For each polygon in the multipolygon
      for (const polygon of feature.geometry.coordinates) {
        let polygonArea = 0
        // For each ring in the polygon
        for (let i = 0; i < polygon.length; i++) {
          const ring = polygon[i]
          const ringArea = calculateRingAreaInMetricSystem(ring)
          // First ring is exterior (positive area), others are holes (negative area)
          polygonArea += i === 0 ? Math.abs(ringArea) : -Math.abs(ringArea)
        }
        totalArea += polygonArea
      }
    }

    return totalArea
  } catch (error) {
    console.error("Error calculating area in Lambert-93:", error)
    return 0
  }
}

/**
 * Calculates the area of a ring (linear ring) in a metric coordinate system.
 * @param ring Array of [x, y] coordinates forming a closed ring
 * @returns Area in square meters
 */
function calculateRingAreaInMetricSystem(ring: number[][]): number {
  let area = 0

  // Ensure the ring is closed
  if (ring.length < 4 || ring[0][0] !== ring[ring.length - 1][0] || ring[0][1] !== ring[ring.length - 1][1]) {
    console.warn("Ring is not closed, area calculation may be inaccurate")
  }

  // Calculate area using the Shoelace formula (Gauss's area formula)
  for (let i = 0; i < ring.length - 1; i++) {
    area += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1]
  }

  return Math.abs(area) / 2
}

function determineCoordinateSystem(feature: Feature<Polygon | MultiPolygon>): string {
  // This is a placeholder function.  A real implementation would need to
  // examine the coordinates and potentially use heuristics or external
  // libraries to determine the coordinate system.
  // For example, you might check if the coordinates are within a certain
  // range that is typical for Lambert-93.

  // In a real implementation, you might also consider the `crs` property
  // of the GeoJSON feature, if it is present.

  // This simple example always returns "Unknown".
  return "Unknown"
}
