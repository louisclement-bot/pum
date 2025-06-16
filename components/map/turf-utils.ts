import * as turf from "@turf/turf"

// Constants for Lambert93 (EPSG:2154) approximation
const LAMBERT93_ORIGIN_LON = 3
const LAMBERT93_ORIGIN_LAT = 46.5
const LAMBERT93_X_OFFSET = 700000
const LAMBERT93_Y_OFFSET = 6600000
const LAMBERT93_SCALE = 100000

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
 * Initialize Turf.js
 * @returns true if initialization is successful
 */
export const initializeTurf = (): boolean => {
  try {
    // Test if Turf.js is working by creating a simple point
    const point = turf.point([0, 0])
    console.log("Turf.js initialized successfully:", point)
    return true
  } catch (error) {
    console.error("Failed to initialize Turf.js:", error)
    return false
  }
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
 * Convert Lambert93 coordinates to WGS84
 * @param coord Lambert93 coordinates [x, y]
 * @returns WGS84 coordinates [longitude, latitude]
 */
export const lambert93ToWGS84 = (coord: [number, number]): [number, number] => {
  try {
    // Approximate conversion from Lambert93 to WGS84
    // This is a simplified conversion that works well for France
    const x = coord[0]
    const y = coord[1]

    const lon = (x - LAMBERT93_X_OFFSET) / LAMBERT93_SCALE + LAMBERT93_ORIGIN_LON
    const lat = (y - LAMBERT93_Y_OFFSET) / LAMBERT93_SCALE + LAMBERT93_ORIGIN_LAT

    console.log("Converted Lambert93 to WGS84:", coord, "->", [lon, lat])
    return [lon, lat]
  } catch (error) {
    console.error("Error converting Lambert93 to WGS84:", error)
    return coord
  }
}

/**
 * Convert WGS84 coordinates to Lambert93
 * @param coord WGS84 coordinates [longitude, latitude]
 * @returns Lambert93 coordinates [x, y]
 */
export const wgs84ToLambert93 = (coord: [number, number]): [number, number] => {
  try {
    // Approximate conversion from WGS84 to Lambert93
    // This is a simplified conversion that works well for France
    const lon = coord[0]
    const lat = coord[1]

    const x = (lon - LAMBERT93_ORIGIN_LON) * LAMBERT93_SCALE + LAMBERT93_X_OFFSET
    const y = (lat - LAMBERT93_ORIGIN_LAT) * LAMBERT93_SCALE + LAMBERT93_Y_OFFSET

    console.log("Converted WGS84 to Lambert93:", coord, "->", [x, y])
    return [x, y]
  } catch (error) {
    console.error("Error converting WGS84 to Lambert93:", error)
    return coord
  }
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

  try {
    // Convert from Lambert93 to WGS84
    if (fromCRS === "EPSG:2154" && toCRS === "EPSG:4326") {
      return lambert93ToWGS84(coord)
    }

    // Convert from WGS84 to Lambert93
    if (fromCRS === "EPSG:4326" && toCRS === "EPSG:2154") {
      return wgs84ToLambert93(coord)
    }

    // For other conversions, return the original coordinates
    console.warn(`Unsupported conversion from ${fromCRS} to ${toCRS}`)
    return coord
  } catch (error) {
    console.error("Error converting coordinates:", error)
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
 * Transform GeoJSON coordinates from Lambert93 to WGS84
 * @param geojson GeoJSON object to transform
 * @returns Transformed GeoJSON object
 */
export const transformGeoJSON = (geojson: any): any => {
  if (!geojson || !geojson.geometry || !geojson.geometry.coordinates) {
    return geojson
  }

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

    console.log(`Detected ${detectedCRS} coordinates, transforming to WGS84`)

    // Create a new GeoJSON object to avoid mutating the original
    const transformedGeoJSON = JSON.parse(JSON.stringify(geojson))

    // Transform coordinates
    if (geojson.geometry.type === "Polygon") {
      transformedGeoJSON.geometry.coordinates = geojson.geometry.coordinates.map((ring: [number, number][]) =>
        ring.map((coord: [number, number]) => convertCoordinates(coord, detectedCRS, "EPSG:4326")),
      )
    } else if (geojson.geometry.type === "MultiPolygon") {
      transformedGeoJSON.geometry.coordinates = geojson.geometry.coordinates.map((polygon: [number, number][][]) =>
        polygon.map((ring: [number, number][]) =>
          ring.map((coord: [number, number]) => convertCoordinates(coord, detectedCRS, "EPSG:4326")),
        ),
      )
    }

    return transformedGeoJSON
  } catch (error) {
    console.error("Error transforming GeoJSON:", error)
    return geojson
  }
}

/**
 * Validate GeoJSON structure
 * @param geojson GeoJSON object to validate
 * @returns true if the GeoJSON is valid
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
