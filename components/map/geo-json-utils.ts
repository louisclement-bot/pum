import type { Feature, Polygon, MultiPolygon } from "geojson"
import { convertCoordinates, detectCoordinateSystem } from "./coordinate-utils"

/**
 * Validate GeoJSON structure
 * @param geojson GeoJSON to validate
 * @returns Whether the GeoJSON is valid
 */
export const validateGeoJSON = (geojson: any): boolean => {
  if (!geojson) {
    console.error("GeoJSON is null or undefined")
    return false
  }
  if (geojson.type !== "Feature") {
    console.error(`Invalid GeoJSON type: ${geojson.type}, expected "Feature"`)
    return false
  }
  if (!geojson.geometry) {
    console.error("GeoJSON has no geometry")
    return false
  }
  if (geojson.geometry.type !== "Polygon" && geojson.geometry.type !== "MultiPolygon") {
    console.error(`Invalid geometry type: ${geojson.geometry.type}, expected "Polygon" or "MultiPolygon"`)
    return false
  }

  // Validate coordinates structure
  try {
    if (geojson.geometry.type === "Polygon") {
      if (
        !Array.isArray(geojson.geometry.coordinates) ||
        !Array.isArray(geojson.geometry.coordinates[0]) ||
        geojson.geometry.coordinates[0].length < 4
      ) {
        console.error("Invalid Polygon coordinates structure")
        return false
      }
    } else if (geojson.geometry.type === "MultiPolygon") {
      if (
        !Array.isArray(geojson.geometry.coordinates) ||
        !Array.isArray(geojson.geometry.coordinates[0]) ||
        !Array.isArray(geojson.geometry.coordinates[0][0]) ||
        geojson.geometry.coordinates[0][0].length < 4
      ) {
        console.error("Invalid MultiPolygon coordinates structure")
        return false
      }
    }
    return true
  } catch (error) {
    console.error("Error validating coordinates:", error)
    return false
  }
}

/**
 * Ensure coordinates are in WGS84 (EPSG:4326) for Leaflet
 * @param geojson GeoJSON to process
 * @returns GeoJSON with coordinates in WGS84
 */
export const ensureWGS84Coordinates = (geojson: Feature<Polygon | MultiPolygon>): Feature<Polygon | MultiPolygon> => {
  if (!geojson || !geojson.geometry || !geojson.geometry.coordinates) return geojson

  try {
    // Sample the first coordinate to detect the coordinate system
    let sampleCoord: [number, number]
    if (geojson.geometry.type === "Polygon") {
      sampleCoord = geojson.geometry.coordinates[0][0] as [number, number]
    } else {
      // MultiPolygon
      sampleCoord = geojson.geometry.coordinates[0][0][0] as [number, number]
    }

    const detectedCRS = detectCoordinateSystem(sampleCoord)

    // If already in WGS84, return as is
    if (detectedCRS === "EPSG:4326") {
      return geojson
    }

    console.log(`Detected ${detectedCRS} coordinates, converting to WGS84`)

    // Create a new GeoJSON object to avoid mutating the original
    const convertedGeoJSON = JSON.parse(JSON.stringify(geojson))

    // Convert coordinates
    if (geojson.geometry.type === "Polygon") {
      convertedGeoJSON.geometry.coordinates = geojson.geometry.coordinates.map((ring: [number, number][]) =>
        ring.map((coord: [number, number]) => convertCoordinates(coord, detectedCRS, "EPSG:4326")),
      )
    } else if (geojson.geometry.type === "MultiPolygon") {
      convertedGeoJSON.geometry.coordinates = geojson.geometry.coordinates.map((polygon: [number, number][][]) =>
        polygon.map((ring: [number, number][]) =>
          ring.map((coord: [number, number]) => convertCoordinates(coord, detectedCRS, "EPSG:4326")),
        ),
      )
    }

    return convertedGeoJSON
  } catch (error) {
    console.error("Error checking/converting coordinates:", error)
    return geojson
  }
}
