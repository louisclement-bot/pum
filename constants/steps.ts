// Step IDs
export const STEP_IDS = {
  USAGE_SELECTION: 1,
  ROOF_SURFACE: 2,
  RAINFALL: 3,
  RESULTS: 4,
  FINANCIAL_AID: 5,
  PRODUCTS: 6,
} as const

// Substep IDs for each step
export const SUBSTEP_IDS = {
  // Usage Selection substeps
  USAGE_SELECTION: 1,
  GARDEN_SURFACE: 2,

  // Roof Surface substeps
  ROOF_SURFACE_QUESTION: 1,
  MANUAL_SURFACE_INPUT: 2,
  ADDRESS_INPUT: 3,
  SURFACE_CONFIRMATION: 4,

  // Rainfall substeps
  RAINFALL_INPUT: 1,
  AUTONOMY_SELECTION: 2,

  // Results, Financial Aid, and Products each have only one substep
  RESULTS: 1,
  FINANCIAL_AID: 1,
  PRODUCTS: 1,
} as const

// Step names for display
export const STEP_NAMES = {
  [STEP_IDS.USAGE_SELECTION]: "Besoins et usages",
  [STEP_IDS.ROOF_SURFACE]: "Surface",
  [STEP_IDS.RAINFALL]: "Pluie",
  [STEP_IDS.RESULTS]: "Résultats",
  [STEP_IDS.FINANCIAL_AID]: "Aides",
  [STEP_IDS.PRODUCTS]: "Produits",
} as const
