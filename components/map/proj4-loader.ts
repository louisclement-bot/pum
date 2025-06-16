import proj4 from "proj4"

// Coordinate system definitions
export const LAMBERT93_DEF =
  "+proj=lcc +lat_1=49 +lat_2=44 +lat_0=46.5 +lon_0=3 +x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"
export const WGS84_DEF = "+proj=longlat +datum=WGS84 +no_defs"

/**
 * Initialize proj4 with the necessary coordinate systems
 * @returns The initialized proj4 instance or null if initialization fails
 */
export const initializeProj4 = (): typeof proj4 | null => {
  try {
    // Define the coordinate systems
    proj4.defs("EPSG:2154", LAMBERT93_DEF) // Lambert 93 (France)
    proj4.defs("EPSG:4326", WGS84_DEF) // WGS84 (standard GPS)

    // Test the conversion to ensure it's working
    const testCoord: [number, number] = [652000, 6862000] // Example Lambert 93 coordinate
    const testResult = proj4("EPSG:2154", "EPSG:4326", testCoord)
    console.log("Proj4js test conversion:", testCoord, "->", testResult)

    return proj4
  } catch (error) {
    console.error("Failed to initialize proj4:", error)
    return null
  }
}
