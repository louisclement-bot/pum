import { NextResponse } from "next/server"
import { z } from "zod"
import { geocodeAddressViaBAN, type GeocodeResult } from "@/lib/geocodeService"
import { getBuildingData, type BuildingDataSource, type BuildingDataResponse } from "@/lib/buildingService"
import {
  getAverageAnnualPluviometry,
  type PluviometryData,
  type PluviometrySource,
  type PluviometryPrecision,
} from "@/lib/pluvioService"
import type { Feature, Polygon, MultiPolygon } from "geojson"

// Zod schema for input validation with extended fields
const requestSchema = z.object({
  address: z.string().min(5, { message: "Address must be at least 5 characters long." }),
  buildingId: z.string().optional(), // Optional building ID for selection
  coordinates: z.array(z.number()).length(2).optional(), // [longitude, latitude]
  banId: z.string().optional(), // BAN ID (clef d'interopérabilité)
  city: z.string().optional(),
  postcode: z.string().optional(),
  citycode: z.string().optional(),
  useExactAddress: z.boolean().optional(), // Flag to use exact coordinates
})

// Type for the successful response payload
interface SuccessResponseData {
  address_input: string
  geocoded_address: {
    label: string
    latitude: number
    longitude: number
    city?: string
    postcode?: string
    citycode?: string // INSEE code
  } | null
  buildings: Array<{
    building_id: string | null
    building_id_source: BuildingDataSource | null
    roof_surface_m2: number | null
    roof_surface_calculation_method: string | null
    building_geojson: Feature<Polygon | MultiPolygon> | null
    label: string | null
    is_selected: boolean
  }>
  selected_building_id: string | null
  average_annual_pluviometry_mm_per_year: number | null
  pluviometry_period: string | null
  pluviometry_source: PluviometrySource | null
  pluviometry_precision: PluviometryPrecision | null
  map_center: [number, number] | null // [longitude, latitude]
  error: string | null // For non-fatal errors/warnings
  debug_info?: {
    // Optional debug info
    geocoding_source: string
    building_data_source_used: string | null
    pluviometry_source_used: string | null
    processing_time_ms: number
    used_exact_address: boolean
  } | null
}

// Type for error responses
interface ErrorResponseData {
  address_input: string
  error: string
  details?: any // For validation errors
}

// Helper function to validate GeoJSON
function validateGeoJSON(geojson: any): boolean {
  if (!geojson) return false
  if (geojson.type !== "Feature") return false
  if (!geojson.geometry) return false
  if (geojson.geometry.type !== "Polygon" && geojson.geometry.type !== "MultiPolygon") return false

  // Validate coordinates structure
  try {
    if (geojson.geometry.type === "Polygon") {
      if (
        !Array.isArray(geojson.geometry.coordinates) ||
        !Array.isArray(geojson.geometry.coordinates[0]) ||
        geojson.geometry.coordinates[0].length < 4
      ) {
        return false
      }
    } else if (geojson.geometry.type === "MultiPolygon") {
      if (
        !Array.isArray(geojson.geometry.coordinates) ||
        !Array.isArray(geojson.geometry.coordinates[0]) ||
        !Array.isArray(geojson.geometry.coordinates[0][0]) ||
        geojson.geometry.coordinates[0][0].length < 4
      ) {
        return false
      }
    }
    return true
  } catch (error) {
    console.error("Error validating coordinates:", error)
    return false
  }
}

export async function POST(request: Request) {
  const startTime = Date.now()
  let addressInput = ""
  let buildingId: string | undefined = undefined
  let usedExactAddress = false

  try {
    // Parse the request body
    const body = await request.json()
    console.log("API Request body:", {
      address: body?.address,
      buildingId: body?.buildingId,
      hasCoordinates: !!body?.coordinates,
      useExactAddress: body?.useExactAddress,
      banId: body?.banId,
    })

    addressInput = body?.address || ""
    buildingId = body?.buildingId
    const coordinates = body?.coordinates // [longitude, latitude]
    const useExactAddress = body?.useExactAddress === true

    // Validate input
    const validationResult = requestSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          address_input: addressInput,
          error: "Invalid request body.",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 },
      )
    }

    const { address, buildingId: validatedBuildingId } = validationResult.data
    addressInput = address // Update addressInput after validation
    buildingId = validatedBuildingId

    // Initialize response variables
    let geocodingResult: GeocodeResult | null = null
    let buildingInfoList: BuildingDataResponse[] | null = null
    let pluvioData: PluviometryData | null = null
    const finalError: string | null = null

    // 1. Geocode Address (use coordinates if provided)
    if (useExactAddress && coordinates && Array.isArray(coordinates) && coordinates.length === 2) {
      // Si useExactAddress est true, utiliser exactement les coordonnées fournies
      const [longitude, latitude] = coordinates
      geocodingResult = {
        latitude,
        longitude,
        label: address,
        score: 1, // Perfect score since it's from a selected suggestion
        type: "housenumber",
        banId: body.banId || "", // Use banId if provided
        city: body.city,
        postcode: body.postcode,
        citycode: body.citycode,
      }

      console.log("Using exact address coordinates:", { latitude, longitude, banId: body.banId })
      usedExactAddress = true
    } else if (coordinates && Array.isArray(coordinates) && coordinates.length === 2) {
      // Si nous avons des coordonnées mais pas useExactAddress, les utiliser comme fallback
      const [longitude, latitude] = coordinates
      geocodingResult = {
        latitude,
        longitude,
        label: address,
        score: 1, // Perfect score since it's from a selected suggestion
        type: "housenumber",
        banId: body.banId || "", // Use banId if provided
        city: body.city,
        postcode: body.postcode,
        citycode: body.citycode,
      }

      console.log("Using provided coordinates as fallback:", { latitude, longitude })
    } else {
      // Otherwise, geocode the address
      console.log("No coordinates provided, geocoding address:", address)
      geocodingResult = await geocodeAddressViaBAN(address)
    }

    if (!geocodingResult) {
      // If geocoding fails completely, return 404
      return NextResponse.json(
        {
          address_input: address,
          error: "Address not found or could not be geocoded.",
        },
        { status: 404 },
      )
    }

    // Log the geocoding result for debugging
    console.log("Geocoding result:", {
      label: geocodingResult.label,
      coordinates: [geocodingResult.longitude, geocodingResult.latitude],
      banId: geocodingResult.banId,
      source: usedExactAddress ? "exact address" : "geocoded",
    })

    // 2. Get Building Data (using geocoded result)
    buildingInfoList = await getBuildingData(geocodingResult)

    // If a specific building ID was provided, select it
    if (buildingId && buildingInfoList) {
      buildingInfoList = buildingInfoList.map((building) => ({
        ...building,
        isSelected: building.attributes.id === buildingId,
      }))
    }

    // 3. Get Pluviometry
    pluvioData = await getAverageAnnualPluviometry(geocodingResult.latitude, geocodingResult.longitude)
    if (pluvioData?.precision === "unavailable") {
      console.warn(`Pluviometry data unavailable for address: ${address}`)
      // Proceed, but data will be null/unavailable in response
    }

    // 4. Use API-provided surface area directly (no calculation)
    const buildingsData =
      buildingInfoList?.map((buildingInfo) => {
        // Validate GeoJSON before returning (still needed for map display)
        const validatedFootprint = validateGeoJSON(buildingInfo.footprint) ? buildingInfo.footprint : null

        if (!validatedFootprint) {
          console.warn(`Invalid GeoJSON for building ${buildingInfo.attributes.id}`)
        }

        // Use the API-provided surface area directly
        const surfaceArea = buildingInfo.attributes.emprise_sol_aire
        const reliability = buildingInfo.attributes.fiabilite_emprise_sol || "unknown reliability"
        const calculationMethod = surfaceArea
          ? `${buildingInfo.source}: API-provided surface area (${reliability})`
          : `${buildingInfo.source}: No surface area available`

        return {
          building_id: buildingInfo.attributes.id,
          building_id_source: buildingInfo.source,
          roof_surface_m2:
            surfaceArea !== null && surfaceArea !== undefined ? Number.parseFloat(surfaceArea.toFixed(2)) : null,
          roof_surface_calculation_method: calculationMethod,
          building_geojson: validatedFootprint,
          label: buildingInfo.attributes.label,
          is_selected: buildingInfo.isSelected || false,
        }
      }) || []

    // Find the selected building ID
    const selectedBuilding = buildingsData.find((b) => b.is_selected)
    const selectedBuildingId = selectedBuilding?.building_id || null

    // Add fallback handling for missing surface area
    if (buildingsData.length > 0 && buildingsData.every((b) => b.roof_surface_m2 === null)) {
      console.warn("No buildings have API-provided surface area, adding fallback message")

      // Add a message to the response
      return NextResponse.json({
        address_input: address,
        geocoded_address: geocodingResult
          ? {
              label: geocodingResult.label,
              latitude: geocodingResult.latitude,
              longitude: geocodingResult.longitude,
              city: geocodingResult.city,
              postcode: geocodingResult.postcode,
              citycode: geocodingResult.citycode,
            }
          : null,
        buildings: buildingsData,
        selected_building_id: selectedBuildingId,
        average_annual_pluviometry_mm_per_year:
          pluvioData?.value !== null && pluvioData?.value !== undefined
            ? Number.parseFloat(pluvioData.value.toFixed(1))
            : null,
        pluviometry_period: pluvioData?.period ?? null,
        pluviometry_source: pluvioData?.source ?? null,
        pluviometry_precision: pluvioData?.precision ?? null,
        map_center: geocodingResult ? [geocodingResult.longitude, geocodingResult.latitude] : null,
        error: "Aucune surface de toit n'a pu être récupérée depuis l'API. Veuillez saisir manuellement la surface.",
        debug_info: {
          geocoding_source: usedExactAddress ? "exact coordinates" : "API Adresse (BAN)",
          building_data_source_used: buildingInfoList?.[0]?.source ?? null,
          pluviometry_source_used: pluvioData?.source ?? null,
          processing_time_ms: Date.now() - startTime,
          used_exact_address: usedExactAddress,
        },
      })
    }

    // 5. Construct Success Response
    const processingTimeMs = Date.now() - startTime
    const successResponse: SuccessResponseData = {
      address_input: address,
      geocoded_address: geocodingResult
        ? {
            label: geocodingResult.label,
            latitude: geocodingResult.latitude,
            longitude: geocodingResult.longitude,
            city: geocodingResult.city,
            postcode: geocodingResult.postcode,
            citycode: geocodingResult.citycode,
          }
        : null,
      buildings: buildingsData,
      selected_building_id: selectedBuildingId,
      average_annual_pluviometry_mm_per_year:
        pluvioData?.value !== null && pluvioData?.value !== undefined
          ? Number.parseFloat(pluvioData.value.toFixed(1))
          : null,
      pluviometry_period: pluvioData?.period ?? null,
      pluviometry_source: pluvioData?.source ?? null,
      pluviometry_precision: pluvioData?.precision ?? null,
      map_center: geocodingResult ? [geocodingResult.longitude, geocodingResult.latitude] : null,
      error: finalError, // Include any non-fatal errors or warnings if needed
      debug_info: {
        // Optional: Consider removing/disabling in production
        geocoding_source: usedExactAddress ? "exact coordinates" : "API Adresse (BAN)",
        building_data_source_used: buildingInfoList?.[0]?.source ?? null,
        pluviometry_source_used: pluvioData?.source ?? null,
        processing_time_ms: processingTimeMs,
        used_exact_address: usedExactAddress,
      },
    }

    return NextResponse.json(successResponse)
  } catch (error: any) {
    console.error("API Route Unhandled Error:", error)
    // Log the error details (stack trace, etc.)
    return NextResponse.json(
      {
        address_input: addressInput, // Use the validated address if available
        error: "Internal Server Error. Please try again later.",
      },
      { status: 500 },
    )
  }
}

// Handle building selection
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    console.log("PUT request body:", body)

    const { address, buildingId, coordinates, banId, city, postcode, citycode, useExactAddress } = body

    if (!address || !buildingId) {
      return NextResponse.json(
        {
          error: "Address and buildingId are required.",
        },
        { status: 400 },
      )
    }

    // Re-run the POST handler with the selected building ID and coordinates
    const response = await POST(
      new Request(request.url, {
        method: "POST",
        headers: request.headers,
        body: JSON.stringify({
          address,
          buildingId,
          coordinates, // Transmettre les coordonnées pour éviter un nouveau géocodage
          banId,
          city,
          postcode,
          citycode,
          useExactAddress,
        }),
      }),
    )

    return response
  } catch (error: any) {
    console.error("Building selection error:", error)
    return NextResponse.json(
      {
        error: "Error selecting building. Please try again.",
      },
      { status: 500 },
    )
  }
}
