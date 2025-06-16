import type { Feature, Polygon, MultiPolygon } from "geojson"

export type BuildingDataSource = "BDNB" | "OSM" | "SIMULATED"

export interface BuildingAttributes {
  id?: string | null // Building ID from source
  source_id?: string | null // Specific ID like BDNB ID
  emprise_sol_aire?: number | null // 2D footprint area from source (m²)
  fiabilite_emprise_sol?: string | null // Reliability of the footprint area
  label?: string | null // A label to display on the map
  rnb_id?: string | null // RNB ID from batiment_construction table
}

export interface BuildingDataResponse {
  source: BuildingDataSource
  footprint: Feature<Polygon | MultiPolygon>
  attributes: BuildingAttributes
  isSelected?: boolean // Flag to indicate if this building is selected
}
