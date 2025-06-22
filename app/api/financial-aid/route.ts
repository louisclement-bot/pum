import { NextResponse } from "next/server"
import { getInseeByPostcode, getFinancialAids, mapApiAidsToUiAids } from "@/lib/financialAidService"
import type { Aid } from "@/types/financialAidTypes"

/**
 * GET handler for financial aid API
 * Accepts query parameters:
 * - postcode: Postal code to lookup INSEE code
 * Always resolves the INSEE code via the Financial-Aid API
 * commune lookup, even if a city-code was previously available
 */
export async function GET(req: Request) {
  console.log("[API] Financial aid route called")
  
  // Extract query parameters
  const { searchParams } = new URL(req.url)
  const postcode = searchParams.get("postcode")
  
  // Validate parameters
  if (!postcode) {
    console.error("[API] Financial aid route called without required postcode")
    return NextResponse.json(
      { error: "Le code postal est requis" },
      { status: 400 }
    )
  }
  
  try {
    // ------------------------------------------------------------------
    // 1. Resolve INSEE code *systematically* via Financial-Aid API lookup
    // ------------------------------------------------------------------
    console.log(`[API] Looking up INSEE code for postal code: ${postcode}`)
    let insee: string
    try {
      insee = await getInseeByPostcode(postcode)
      console.log(`[API] Resolved INSEE code ${insee} for postal code ${postcode}`)
    } catch (error) {
      console.error(`[API] Error getting INSEE code for postal code ${postcode}:`, error)

      if (error instanceof Error && error.message.includes("Aucune commune trouvée")) {
        return NextResponse.json(
          { error: `Aucune commune trouvée pour le code postal ${postcode}` },
          { status: 404 },
        )
      }

      if (error instanceof Error && error.message.includes("authentification")) {
        return NextResponse.json(
          { error: "Erreur d'authentification avec le service d'aides financières" },
          { status: 401 },
        )
      }

      return NextResponse.json(
        { error: "Erreur lors de la recherche de la commune" },
        { status: 500 },
      )
    }
    
    // Get financial aids with the INSEE code
    try {
      console.log(`[API] Fetching financial aids for INSEE code: ${insee}`)
      const apiResponse = await getFinancialAids(insee)
      
      // Map API response to UI format
      const aids: Aid[] = mapApiAidsToUiAids(apiResponse)
      
      // Check if any aids were found
      if (aids.length === 0) {
        console.log(`[API] No financial aids found for INSEE code: ${insee}`)
        return NextResponse.json(
          { 
            aids: [],
            message: "Aucune aide financière disponible pour cette commune" 
          },
          { status: 200 } // Return 200 with empty array rather than 404
        )
      }
      
      console.log(`[API] Successfully retrieved ${aids.length} financial aids`)
      return NextResponse.json({ aids })
    } catch (error) {
      console.error(`[API] Error getting financial aids for INSEE code ${insee}:`, error)
      
      // Handle specific errors from financial aids lookup
      if (error instanceof Error) {
        if (error.message.includes("Aucune aide financière disponible")) {
          return NextResponse.json(
            { aids: [], message: "Aucune aide financière disponible pour cette commune" },
            { status: 200 } // Return 200 with empty array rather than 404
          )
        } else if (error.message.includes("authentification")) {
          return NextResponse.json(
            { error: "Erreur d'authentification avec le service d'aides financières" },
            { status: 401 }
          )
        }
      }
      
      return NextResponse.json(
        { error: "Erreur lors de la recherche d'aides financières" },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("[API] Unhandled error in financial aid route:", error)
    return NextResponse.json(
      { error: "Une erreur est survenue lors du traitement de votre demande" },
      { status: 500 }
    )
  }
}
