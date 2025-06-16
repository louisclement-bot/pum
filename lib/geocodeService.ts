import axios from "axios"
import type { Feature, Point, FeatureCollection } from "geojson"

// Interface for API Adresse response properties based on the documentation
interface ApiAdresseFeatureProperties {
  label: string
  score: number
  housenumber?: string
  id: string // BAN ID (clef d'interopérabilité)
  name: string
  postcode: string
  citycode: string // INSEE Code
  city: string
  type: "housenumber" | "street" | "locality" | "municipality"
  x?: number // Lambert 93 coordinates
  y?: number // Lambert 93 coordinates
  importance?: number
  context?: string
  street?: string
  district?: string
  oldcitycode?: string
  oldcity?: string
}

export interface ApiAdresseFeature extends Feature<Point, ApiAdresseFeatureProperties> {}

export interface ApiAdresseResponse extends FeatureCollection<Point, ApiAdresseFeatureProperties> {
  version?: string
  attribution?: string
  licence?: string
  query?: string
  limit?: number
}

// Result structure focusing on required fields
export interface GeocodeResult {
  latitude: number
  longitude: number
  label: string
  score: number
  type: string
  city?: string
  postcode?: string
  citycode?: string
  banId: string // This is the "id" field from the API (clef d'interopérabilité)
}

/**
 * Geocodes an address using the BAN (Base Adresse Nationale) API
 * @param address The address to geocode (can be a full address or just a postal code)
 * @returns A GeocodeResult object or null if geocoding failed
 */
export async function geocodeAddressViaBAN(address: string): Promise<GeocodeResult | null> {
  const encodedAddress = encodeURIComponent(address)

  // Check if the input is likely just a postal code (5 digits in France)
  const isPostalCode = /^\d{5}$/.test(address.trim())

  // For postal codes, we want to get the municipality center
  const url = isPostalCode
    ? `https://api-adresse.data.gouv.fr/search/?q=${encodedAddress}&limit=1&type=municipality`
    : `https://api-adresse.data.gouv.fr/search/?q=${encodedAddress}&limit=5&type=housenumber`

  const fallbackUrl = `https://api-adresse.data.gouv.fr/search/?q=${encodedAddress}&limit=5` // If no results found

  console.log(`Geocoding BAN: ${url}`)
  try {
    let response = await axios.get<ApiAdresseResponse>(url)
    let features = response.data.features

    // If no results, try generic search
    if (!features || features.length === 0) {
      console.log(`Geocoding BAN (fallback): ${fallbackUrl}`)
      response = await axios.get<ApiAdresseResponse>(fallbackUrl)
      features = response.data.features
    }

    if (!features || features.length === 0) {
      console.warn(`Geocoding BAN: No features found for address: ${address}`)
      return null
    }

    // Log all features for debugging
    console.log(
      `Geocoding BAN: Found ${features.length} features:`,
      features.map((f) => ({
        label: f.properties?.label,
        score: f.properties?.score,
        id: f.properties?.id,
        type: f.properties?.type,
      })),
    )

    // Select the best feature (highest score, prefer housenumber)
    const sortedFeatures = features
      .filter((f) => f.properties && f.geometry?.coordinates)
      .sort((a, b) => {
        const scoreDiff = (b.properties?.score ?? 0) - (a.properties?.score ?? 0)
        if (scoreDiff !== 0) return scoreDiff
        // Prefer housenumber type if scores are equal
        if (a.properties?.type === "housenumber" && b.properties?.type !== "housenumber") return -1
        if (a.properties?.type !== "housenumber" && b.properties?.type === "housenumber") return 1
        return 0
      })

    const bestFeature = sortedFeatures[0]

    if (!bestFeature || !bestFeature.geometry || !bestFeature.properties) {
      console.warn(`Geocoding BAN: Best feature invalid for address: ${address}`)
      return null
    }

    // WGS84 coordinates [longitude, latitude]
    const [longitude, latitude] = bestFeature.geometry.coordinates
    const props = bestFeature.properties

    console.log(`Geocoding BAN Success: ${props.label} (${props.score})`)
    return {
      latitude,
      longitude,
      label: props.label,
      score: props.score,
      type: props.type,
      city: props.city,
      postcode: props.postcode,
      citycode: props.citycode,
      banId: props.id, // This is the "clef d'interopérabilité" needed for BDNB
    }
  } catch (error: any) {
    console.error("Error fetching from API Adresse (BAN):", error.response?.data || error.message)
    return null
  }
}
