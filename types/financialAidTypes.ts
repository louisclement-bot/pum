import type React from "react"

/**
 * Commune Lookup API Response Type
 * From /v4/communes/{postcode}
 */
export interface CommuneApiResponse {
  /** Identifiant interne de la commune dans l’API */
  id_commune: number
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
  /** Liste brute des identifiants d’aides renvoyée par l’API */
  liste_id_aides: number[]
  aides: ApiAid[]
}

export interface ApiAid {
  id: number
  libelle: string
  /** Texte long décrivant l’aide */
  description: string
  libelle_programme: string
  description_programme?: string
  montant_calcule: number | null
  montants: ApiAidAmount[]
  /**
   * The API is inconsistent: `groupe_racine` can be a single object **or**
   * an array of objects depending on the commune queried.
   * We therefore model it as a union so that the compiler (and the rest of
   * the codebase) can safely handle both shapes.
   */
  groupe_racine: ApiAidGroup | ApiAidGroup[]
  /** Même structure mais relative au programme (optionnel) */
  groupe_racine_programme?: ApiAidGroup | ApiAidGroup[]

  // Localisation / organisme
  site?: string | null
  ville?: string
  code_postal?: string | number
  adresse?: string
  adresse2?: string
  telephone?: string
  mail?: string

  /**
   * Plafond global déclaré pour l’aide (ex : 3 000 €)
   * Null lorsque non communiqué par l’API.
   */
  plafond_globale?: {
    valeur: number
    type: string
  } | null

  /**
   * Tableau des ressources éventuellement utilisé pour conditionner
   * l’éligibilité (souvent absent → `null` dans la réponse).
   */
  tableau_ressources?: {
    plafonds_par_personnes: Record<string, number>
    plafond_additionnel_par_personne: number
  } | null

  /** Documentation externe éventuelle */
  lien_documentation?: string
  // Additional fields could be added as needed
}

export interface ApiAidAmount {
  valeur: number
  valeur_max?: number
  /** POURCENTAGE ou FORFAITAIRE */
  type: "POURCENTAGE" | "FORFAITAIRE"
  poste: string
  unite?: string | null
  plafond?: {
    valeur: number
    type: string
  }
}

export interface ApiAidGroup {
  /** Type logique du groupe (ET / OU) */
  type?: "ET" | "OU"
  libelle?: string
  conditions: ApiAidCondition[]
  /** Sous-groupes éventuels (récursif) */
  groupes_fils?: ApiAidGroup[]
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

  /** Detailed description of the aid */
  description: string

  /** Long description of the overarching programme (optional) */
  programDescription?: string

  /** Official web page of the aid (optional) */
  website?: string

  /** PDF or external documentation link (optional) */
  documentationLink?: string

  /** Contact & localisation information (all optional) */
  address?: string
  city?: string
  postalCode?: string | number
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
