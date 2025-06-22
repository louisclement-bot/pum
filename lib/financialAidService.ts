import { Euro, Building, MapPin } from "lucide-react"
import { createElement } from "react"
import type {
  ApiAid,
  ApiAidAmount,
  ApiAidGroup,
  Aid,
  CommuneApiResponse,
  FinancialAidApiResponse,
} from "@/types/financialAidTypes"

/**
 * Base URL and authentication constants
 */
const BASE_URL = "https://apiaidesfi.pia-production.fr/v4"
const AUTH_TOKEN = process.env.NEXT_PUBLIC_AIDESFI_TOKEN || "ZEc5clpXNWZjSEp2WkY5d2RXMWZZbUZqYTJWdVpFRlFTUT09"

/**
 * Headers for API requests
 */
const getHeaders = () => ({
  "X-AUTH-TOKEN": AUTH_TOKEN,
  "Content-Type": "application/json",
})

/**
 * Get INSEE code by postal code
 * @param postcode - The postal code to lookup
 * @returns The INSEE code of the first commune found
 */
export async function getInseeByPostcode(postcode: string): Promise<string> {
  console.log(`[financialAidService] Looking up INSEE code for postal code: ${postcode}`)
  
  try {
    const response = await fetch(`${BASE_URL}/communes/${postcode}`, {
      headers: getHeaders(),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error")
      console.error(`[financialAidService] Commune lookup failed (${response.status}): ${errorText}`)
      
      if (response.status === 401) {
        throw new Error("Erreur d'authentification API")
      } else if (response.status === 404) {
        throw new Error(`Aucune commune trouvée pour le code postal ${postcode}`)
      } else {
        throw new Error(`Erreur lors de la recherche de commune (${response.status})`)
      }
    }

    const data = await response.json() as CommuneApiResponse[]
    
    if (!data || data.length === 0) {
      console.warn(`[financialAidService] No communes found for postal code: ${postcode}`)
      throw new Error(`Aucune commune trouvée pour le code postal ${postcode}`)
    }
    
    console.log(`[financialAidService] Found commune: ${data[0].nom} with INSEE code: ${data[0].code_insee}`)
    return data[0].code_insee
  } catch (error) {
    console.error("[financialAidService] Error in getInseeByPostcode:", error)
    throw error instanceof Error ? error : new Error("Erreur lors de la recherche de commune")
  }
}

/**
 * Get financial aids by INSEE code
 * @param codeInsee - The INSEE code to lookup
 * @returns The financial aid API response
 */
export async function getFinancialAids(codeInsee: string): Promise<FinancialAidApiResponse> {
  console.log(`[financialAidService] Looking up financial aids for INSEE code: ${codeInsee}`)
  
  try {
    const response = await fetch(`${BASE_URL}/redp/${codeInsee}`, {
      headers: getHeaders(),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error")
      console.error(`[financialAidService] Financial aid lookup failed (${response.status}): ${errorText}`)
      
      if (response.status === 401) {
        throw new Error("Erreur d'authentification API")
      } else if (response.status === 404) {
        throw new Error("Aucune aide financière disponible pour cette commune")
      } else {
        throw new Error(`Erreur lors de la recherche d'aides financières (${response.status})`)
      }
    }

    const data = await response.json() as FinancialAidApiResponse
    console.log(`[financialAidService] Found ${data.nb_aides} financial aids`)
    return data
  } catch (error) {
    console.error("[financialAidService] Error in getFinancialAids:", error)
    throw error instanceof Error ? error : new Error("Erreur lors de la recherche d'aides financières")
  }
}

/**
 * Format the amount string based on API data
 * @param montantCalcule - The calculated amount if available
 * @param montants - The amounts array from the API
 * @returns Formatted amount string
 */
export function formatAmount(montantCalcule: number | null, montants: ApiAidAmount[]): string {
  if (montantCalcule !== null && montantCalcule > 0) {
    return `Jusqu'à ${montantCalcule.toLocaleString()}€`
  }
  
  if (montants && montants.length > 0) {
    const highestAmount = montants.reduce((max, current) => {
      const value = current.valeur_max || current.valeur
      return value > max ? value : max
    }, 0)
    
    if (highestAmount > 0) {
      return `Jusqu'à ${highestAmount.toLocaleString()}€`
    }
  }
  
  return "Montant variable"
}

/**
 * Format the conditions string based on API data
 * @param groupeRacine - The groupe_racine array from the API
 * @returns Formatted conditions string
 */
export function formatConditions(
  groupeRacine: ApiAidGroup | ApiAidGroup[] | null | undefined,
): string {
  /* ------------------------------------------------------------------
   * 1. Normalise input                                                *
   * ------------------------------------------------------------------ */
  if (!groupeRacine) {
    return "Conditions non spécifiées"
  }

  // Convert to array safely
  const groups: ApiAidGroup[] = Array.isArray(groupeRacine)
    ? groupeRacine.filter(Boolean)
    : [groupeRacine]

  if (groups.length === 0) {
    return "Conditions non spécifiées"
  }

  /* ------------------------------------------------------------------
   * 2. Extract all condition labels and join them                      *
   * ------------------------------------------------------------------ */
  const conditions = groups
    .flatMap(group => group.conditions || [])
    .map(condition => condition.libelle)
    .filter(Boolean)
  
  if (conditions.length === 0) {
    return "Conditions non spécifiées"
  }
  
  return conditions.join("; ")
}

/**
 * Determine the appropriate icon based on the aid information
 * @param aid - The API aid object
 * @returns React node with the appropriate icon
 */
export function determineIcon(aid: ApiAid): JSX.Element {
  const lowerLibelle = aid.libelle.toLowerCase()
  const lowerProgramme = aid.libelle_programme.toLowerCase()
  
  // Check for keywords to determine the appropriate icon
  if (
    lowerLibelle.includes("eau") || 
    lowerLibelle.includes("pluie") || 
    lowerLibelle.includes("pluvial")
  ) {
    return createElement(Euro, { className: "h-5 w-5 text-[#1D40AF] dark:text-blue-400" })
  } else if (
    lowerProgramme.includes("ville") || 
    lowerProgramme.includes("commune") || 
    lowerProgramme.includes("municipal")
  ) {
    return createElement(Building, { className: "h-5 w-5 text-[#1D40AF] dark:text-blue-400" })
  } else if (
    lowerProgramme.includes("région") || 
    lowerProgramme.includes("département")
  ) {
    return createElement(MapPin, { className: "h-5 w-5 text-[#1D40AF] dark:text-blue-400" })
  }
  
  // Default icon
  return createElement(Euro, { className: "h-5 w-5 text-[#1D40AF] dark:text-blue-400" })
}

/**
 * Map API aids to UI aids format
 * @param apiResponse - The API response from getFinancialAids
 * @returns Array of Aid objects for UI display
 */
export function mapApiAidsToUiAids(apiResponse: FinancialAidApiResponse): Aid[] {
  if (!apiResponse || !apiResponse.aides || apiResponse.aides.length === 0) {
    console.warn("[financialAidService] No aids to map in API response")
    return []
  }
  
  console.log(`[financialAidService] Mapping ${apiResponse.aides.length} API aids to UI format`)
  
  return apiResponse.aides.map((apiAid): Aid => {
    const aid: Aid = {
      id: String(apiAid.id),
      name: apiAid.libelle,
      organization: apiAid.libelle_programme,
      amount: formatAmount(apiAid.montant_calcule, apiAid.montants),
      // Conditions (formatConditions now internally normalises object/array)
      conditions: formatConditions(apiAid.groupe_racine),
      icon: determineIcon(apiAid),

      // ────────────────────────────────────────────────────────────
      // NEW FIELDS (displayed in the detailed UI card)
      // ────────────────────────────────────────────────────────────
      description: apiAid.description,
      programDescription: apiAid.description_programme ?? undefined,
      website: apiAid.site ?? undefined,
      documentationLink: apiAid.lien_documentation ?? undefined,
      address: apiAid.adresse ?? apiAid.adresse2 ?? undefined,
      city: apiAid.ville ?? undefined,
      postalCode: apiAid.code_postal ?? undefined,
      phone: apiAid.telephone ?? undefined,
      email: apiAid.mail ?? undefined,
    }
    
    return aid
  })
}

/**
 * Complete service function to get financial aids ready for UI
 * @param postalCode - The postal code to lookup
 * @param codeInsee - Optional INSEE code (if already known)
 * @returns Array of Aid objects for UI display
 */
export async function getFinancialAidsForDisplay(postalCode?: string, codeInsee?: string): Promise<Aid[]> {
  try {
    // If INSEE code is not provided, get it from postal code
    const insee = codeInsee || (postalCode ? await getInseeByPostcode(postalCode) : null)
    
    if (!insee) {
      throw new Error("Code postal ou code INSEE requis")
    }
    
    // Get financial aids from API
    const apiResponse = await getFinancialAids(insee)
    
    // Map API response to UI format
    return mapApiAidsToUiAids(apiResponse)
  } catch (error) {
    console.error("[financialAidService] Error in getFinancialAidsForDisplay:", error)
    throw error
  }
}
