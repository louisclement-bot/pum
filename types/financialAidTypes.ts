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
  /**
   * Array of aid identifiers returned by the API.
   * Useful for analytics / debugging but not directly displayed.
   */
  liste_id_aides: number[]
  aides: ApiAid[]
}

export interface ApiAid {
  id: number
  libelle: string
  description?: string
  libelle_programme: string
  description_programme?: string
  montant_calcule: number | null
  montants: ApiAidAmount[]
  tableau_ressources?: unknown
  groupe_racine: ApiAidGroup | ApiAidGroup[] | null
  plafond_globale?: unknown
  site?: string
  groupe_racine_programme?: ApiAidGroup | ApiAidGroup[] | null
  lien_documentation?: string
  ville?: string
  code_postal?: string
  adresse?: string
  adresse2?: string
  telephone?: string
  mail?: string
  // Additional fields could be added as needed
}

export interface ApiAidAmount {
  plafond: Plafond
  unite: string | null
  /**
   * Fixed list of possible amount types returned by the API
   * (ex: "POURCENTAGE", "FORFAIT", etc.)
   */
  type: string
  poste: string | null
  valeur: number
  valeur_max: number
}

export interface ApiAidGroup {
  type: string
  libelle: string
  groupes_fils: ApiAidGroup[]
  conditions: ApiAidCondition[]
}

export interface ApiAidCondition {
  libelle: string
}

/**
 * Plafond sub-structure used inside ApiAidAmount
 */
export interface Plafond {
  valeur: number
  type: string
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

  // ─────────── Additional optional display fields ───────────
  description?: string
  programDescription?: string
  website?: string
  documentationLink?: string
  address?: string
  city?: string
  postalCode?: string
  phone?: string
  email?: string
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
