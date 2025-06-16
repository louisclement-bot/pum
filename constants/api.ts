// API endpoints
export const API_ENDPOINTS = {
  GEOCODE: "/api/geocode",
  ROOF_SURFACE: "/api/roof-surface",
  ROOF_DETAILS: "/api/roof-details",
  RAINFALL_DATA: "/api/rainfall-data",
} as const

// API response keys
export const API_KEYS = {
  BUILDING_ID: "batiment_groupe_id",
  SURFACE: "s_geom_groupe",
  RAINFALL: "precipitation",
  ADDRESS: "address",
  POSTAL_CODE: "postal_code",
  CITY: "city",
  COORDINATES: "coordinates",
} as const

// API request parameters
export const API_PARAMS = {
  ADDRESS: "address",
  POSTAL_CODE: "postalCode",
  CITY: "city",
  LATITUDE: "lat",
  LONGITUDE: "lng",
  BUILDING_ID: "buildingId",
} as const

// Error messages
export const API_ERRORS = {
  GEOCODE_FAILED: "Impossible de géocoder cette adresse",
  ROOF_SURFACE_FAILED: "Impossible de récupérer la surface du toit",
  RAINFALL_DATA_FAILED: "Impossible de récupérer les données de pluviométrie",
  NETWORK_ERROR: "Erreur de connexion au serveur",
} as const
