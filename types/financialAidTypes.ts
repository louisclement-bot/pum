import type React from "react"

/**
 * Commune Lookup API Response Type
 * From /v4/communes/{postcode}
 */
export interface CommuneApiResponse {
  nom: string
  code_postal: string
  code_insee: string
}

/**
 * Financial Aid API Response Types
 * From /v4/redp/{code_insee}
 */
export interface FinancialAidApiResponse {
  nb_aides: number
  aides: ApiAid[]
}

export interface ApiAid {
  id: number
  libelle: string
  libelle_programme: string
  montant_calcule: number | null
  montants: ApiAidAmount[]
  groupe_racine: ApiAidGroup[]
  ville?: string
  // Additional fields could be added as needed
}

export interface ApiAidAmount {
  valeur: number
  valeur_max?: number
}

export interface ApiAidGroup {
  conditions: ApiAidCondition[]
}

export interface ApiAidCondition {
  libelle: string
}

/**
 * UI Aid Structure
 * Used for display in the financial-aid component
 */
export interface Aid {
  id: string
  name: string
  organization: string
  amount: string
  conditions: string
  icon: React.ReactNode
}

/**
 * Service Response Types
 * Used for internal service communication
 */
export interface FinancialAidServiceResponse {
  aids: Aid[]
  error?: string
}

/**
 * Error Types
 */
export interface FinancialAidError {
  message: string
  code?: number
  details?: string
}

/**
 * Request Types
 */
export interface FinancialAidRequest {
  postalCode?: string
  codeInsee?: string
}
