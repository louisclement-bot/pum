import type { Aid } from "@/types/financialAidTypes"

/**
 * Fetches financial aids from the API based on postal code or INSEE code
 * @param postalCode - The postal code to lookup
 * @param insee - The INSEE code (if already known)
 * @returns Array of Aid objects for UI display
 */
export async function fetchFinancialAids(postalCode?: string, insee?: string): Promise<Aid[]> {
  // If no parameters provided, return empty array
  if (!postalCode && !insee) {
    console.log("[AID_FETCH] No postal code or INSEE code provided, returning empty array")
    return []
  }

  const startTime = performance.now()
  const params = new URLSearchParams()
  
  // Prioritize INSEE code if available
  if (insee) {
    params.append("codeInsee", insee)
    console.log(`[AID_FETCH] Starting fetch with INSEE code: ${insee}`)
  } else if (postalCode) {
    params.append("postcode", postalCode)
    console.log(`[AID_FETCH] Starting fetch with postal code: ${postalCode}`)
  }

  try {
    // Use AbortSignal.timeout for 8-second timeout
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
