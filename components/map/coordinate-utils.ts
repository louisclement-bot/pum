import { initializeProj4 } from "./proj4-loader"
import type { Feature, Polygon, MultiPolygon } from "geojson"

// Cache for coordinate transformations
const coordCache = new Map<string, [number, number]>()

// Helper function to create a cache key
const createCacheKey = (coord: [number, number], fromCRS: string, toCRS: string): string => {
  return `${coord[0]},${coord[1]}|${fromCRS}|${toCRS}`
}

/**
 * Detect coordinate system based on value ranges
 * @param coord Coordinates to detect
 * @returns The detected coordinate system code
 */
export const detectCoordinateSystem = (coord: [number, number]): string => {
  // Lambert 93 coordinates are typically large numbers (6-7 digits)
  // X values range roughly from 0 to 1,300,000
  // Y values range roughly from 6,000,000 to 7,200,000
  if (coord[0] > 0 && coord[0] < 1300000 && coord[1] > 6000000 && coord[1] < 7200000) {
    return "EPSG:2154" // Lambert 93
  }

  // WGS84 longitude ranges from -180 to 180, latitude from -90 to 90
  if (coord[0] >= -180 && coord[0] <= 180 && coord[1] >= -90 && coord[1] <= 90) {
    return "EPSG:4326" // WGS84
  }

  // If we can't determine, assume it's Lambert 93 (most common in France)
  return "EPSG:2154"
}

/**
 * Convert coordinates from one CRS to another
 * @param coord Coordinates to convert
 * @param fromCRS Source coordinate reference system
 * @param toCRS Target coordinate reference system
 * @returns Converted coordinates
 */
export const convertCoordinates = (coord: [number, number], fromCRS: string, toCRS: string): [number, number] => {
  // If source and target CRS are the same, return the original coordinates
  if (fromCRS === toCRS) {
    return coord
  }

  // Check cache first
  const cacheKey = createCacheKey(coord, fromCRS, toCRS)
  if (coordCache.has(cacheKey)) {
    return coordCache.get(cacheKey) as [number, number]
  }

  try {
    // Initialize proj4 if needed
    const proj4 = initializeProj4()

    let result: [number, number]

    if (proj4) {
      // Use proj4 for accurate conversion
      result = proj4(fromCRS, toCRS, coord)
      console.log(`Converted ${fromCRS} to ${toCRS} using proj4js:`, coord, "->", result)
    } else {
      // Fallback to approximate conversion for Lambert 93 to WGS84
      if (fromCRS === "EPSG:2154" && toCRS === "EPSG:4326") {
        const x = coord[0]
        const y = coord[1]
        const lon = (x - 700000) / 100000 + 3
        const lat = (y - 6600000) / 100000 + 46.5
        result = [lon, lat]
        console.warn("Using fallback approximate conversion:", coord, "->", result)
      } else if (fromCRS === "EPSG:4326" && toCRS === "EPSG:2154") {
        // Fallback for WGS84 to Lambert 93
        const lon = coord[0]
        const lat = coord[1]
        const x = (lon - 3) * 100000 + 700000
        const y = (lat - 46.5) * 100000 + 6600000
        result = [x, y]
        console.warn("Using fallback approximate conversion:", coord, "->", result)
      } else {
        // For other conversions or if we can't convert, return the original
        console.warn(`Cannot convert coordinates from ${fromCRS} to ${toCRS} without proj4js`)
        result = coord
      }
    }

    // Cache the result
    coordCache.set(cacheKey, result)
    return result
  } catch (error) {
    console.error("Error converting coordinates:", error)

    // Fallback to approximate conversion if any error occurs
    if (fromCRS === "EPSG:2154" && toCRS === "EPSG:4326") {
      const x = coord[0]
      const y = coord[1]
      const lon = (x - 700000) / 100000 + 3
      const lat = (y - 6600000) / 100000 + 46.5
      const result: [number, number] = [lon, lat]
      coordCache.set(cacheKey, result)
      console.warn("Using fallback approximate conversion after error:", coord, "->", result)
      return result
    } else if (fromCRS === "EPSG:4326" && toCRS === "EPSG:2154") {
      const lon = coord[0]
      const lat = coord[1]
      const x = (lon - 3) * 100000 + 700000
      const y = (lat - 46.5) * 100000 + 6600000
      const result: [number, number] = [x, y]
      coordCache.set(cacheKey, result)
      console.warn("Using fallback approximate conversion after error:", coord, "->", result)
      return result
    }

    return coord
  }
}

/**
 * Prepare coordinates for use with Leaflet
 * @param center Center coordinates in [longitude, latitude] format (GeoJSON standard)
 * @returns Coordinates in the format expected by Leaflet [latitude, longitude]
 */
export const prepareMapCenter = (center: [number, number]): [number, number] => {
  if (!center) return [0, 0]

  // Log input coordinates for debugging
  console.log("Input coordinates to prepareMapCenter:", center)

  // Detect coordinate system
  const detectedCRS = detectCoordinateSystem(center)
  console.log("Detected coordinate system:", detectedCRS, "for coordinates:", center)

  // Convert to WGS84 if needed
  let mapCenter = center
  if (detectedCRS !== "EPSG:4326") {
    mapCenter = convertCoordinates(center, detectedCRS, "EPSG:4326")
    console.log("Converted center coordinates to WGS84:", mapCenter)
  }

  // Check if coordinates are in a reasonable range for France
  // France is roughly between longitudes -5 to 10 and latitudes 41 to 52
  const isFrenchLongitude = mapCenter[0] >= -5 && mapCenter[0] <= 10
  const isFrenchLatitude = mapCenter[1] >= 41 && mapCenter[1] <= 52

  // If coordinates don't look like they're in France, log a warning
  if (!isFrenchLongitude || !isFrenchLatitude) {
    console.warn("Coordinates may not be in France:", mapCenter)
  }

  // Leaflet always expects [latitude, longitude] but GeoJSON is [longitude, latitude]
  // Always swap for consistency when dealing with WGS84 coordinates
  const leafletCoords: [number, number] = [mapCenter[1], mapCenter[0]]
  console.log("Swapped coordinates for Leaflet [lat, lng] format:", leafletCoords)

  return leafletCoords
}

/**
 * Validate if coordinates are in a reasonable range for France
 * @param coords Coordinates to validate in [longitude, latitude] format
 * @returns Boolean indicating if coordinates are likely in France
 */
export const validateFrenchCoordinates = (coords: [number, number]): boolean => {
  // France is roughly between longitudes -5 to 10 and latitudes 41 to 52
  const [lon, lat] = coords
  return lon >= -5 && lon <= 10 && lat >= 41 && lat <= 52
}

/**
 * Determines the likely coordinate system of a GeoJSON feature based on its coordinates.
 * @param feature GeoJSON feature to analyze
 * @returns The likely coordinate system ('WGS84', 'LAMBERT93', or 'UNKNOWN')
 */
export function determineCoordinateSystem(feature: Feature<Polygon | MultiPolygon>): "WGS84" | "LAMBERT93" | "UNKNOWN" {
  try {
    let coordinates: number[][] = []

    // Extract coordinates from the feature
    if (feature.geometry.type === "Polygon") {
      coordinates = feature.geometry.coordinates[0]
    } else if (feature.geometry.type === "MultiPolygon") {
      coordinates = feature.geometry.coordinates[0][0]
    }

    if (coordinates.length === 0) {
      return "UNKNOWN"
    }

    // Check a sample of coordinates to determine the likely system
    let isLikely_WGS84 = true
    let isLikely_LAMBERT93 = true

    for (const coord of coordinates.slice(0, 5)) {
      // Check first 5 points
      const [x, y] = coord

      // WGS84 longitude is typically between -180 and 180
      // WGS84 latitude is typically between -90 and 90
      if (Math.abs(x) > 180 || Math.abs(y) > 90) {
        isLikely_WGS84 = false
      }

      // Lambert-93 coordinates in France are typically:
      // X: between 600,000 and 1,200,000
      // Y: between 6,000,000 and 7,100,000
      if (x < 600000 || x > 1200000 || y < 6000000 || y > 7100000) {
        isLikely_LAMBERT93 = false
      }
    }

    if (isLikely_WGS84) return "WGS84"
    if (isLikely_LAMBERT93) return "LAMBERT93"
    return "UNKNOWN"
  } catch (error) {
    console.error("Error determining coordinate system:", error)
    return "UNKNOWN"
  }
}
