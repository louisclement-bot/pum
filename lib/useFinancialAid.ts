import type { Aid } from "@/types/financialAidTypes"

/**
 * Fetches financial aids from the API based on postal code or INSEE code
 * @param postalCode - The postal code to lookup
 * The Financial-Aid public service **requires** a two-step flow:
 *   1.  GET /v4/communes/{postcode}  → authoritative INSEE code
 *   2.  GET /v4/redp/{insee}         → actual aids
 *
 * Our `/api/financial-aid` proxy performs those two calls server-side, so the
 * front-end only needs to supply the postal code.  The INSEE code (even if we
 * obtained it earlier from BAN) must **not** be sent directly.
 *
 * @returns Promise resolving to an array of Aid objects for UI display
 */
export async function fetchFinancialAids(postalCode?: string): Promise<Aid[]> {
  const trimmedPostcode = postalCode?.trim() ?? ""

  // Guard clause: postal code is mandatory
  if (trimmedPostcode.length === 0) {
    console.log("[AID_FETCH] No postal code provided, returning empty array")
    return []
  }

  const startTime = performance.now()
  const params = new URLSearchParams()
  
  // Always forward the postal code – backend will resolve INSEE then aids
  params.append("postcode", trimmedPostcode)
  console.log(`[AID_FETCH] Starting fetch with postal code: ${trimmedPostcode}`)

  try {
    // Use AbortController for 8-second timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)
    
    const res = await fetch(`/api/financial-aid?${params.toString()}`, { 
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    // Clear timeout as we got a response
    clearTimeout(timeoutId)
    
    // Check for error responses
    if (!res.ok) {
      // Try to parse error message from response
      let errorMessage = "API error"
      try {
        const errorData = await res.json()
        errorMessage = errorData.error || errorMessage
      } catch (e) {
        // If we can't parse JSON, use status text
        errorMessage = res.statusText || errorMessage
      }
      
      throw new Error(errorMessage)
    }
    
    // Parse and return the aids array
    const data = await res.json()
    const aids = data.aids || []
    
    const duration = Math.round(performance.now() - startTime)
    console.log(`[AID_FETCH] Success: Retrieved ${aids.length} aids in ${duration}ms`)
    
    return aids
  } catch (error) {
    // Handle AbortError (timeout)
    if (error instanceof DOMException && error.name === "AbortError") {
      console.error(`[AID_FETCH] Timeout after 8 seconds`)
      throw new Error("La requête a expiré après 8 secondes")
    }
    
    // Log and rethrow other errors
    console.error("[AID_FETCH] Error:", error)
    throw error
  }
}
