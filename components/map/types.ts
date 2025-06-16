import type { Feature, Polygon, MultiPolygon } from "geojson"

// Define types for better type safety
export type BuildingData = {
  building_id: string | null
  building_id_source: string | null
  roof_surface_m2: number | null
  roof_surface_calculation_method: string | null
  building_geojson: Feature<Polygon | MultiPolygon> | null
  label: string | null
  is_selected: boolean
  rnb_id?: string | null // Ajout du champ rnb_id
}

export type BuildingMapProps = {
  buildings: BuildingData[]
  center: [number, number] // [longitude, latitude]
  onBuildingSelect: (buildingId: string) => void
  className?: string
  onError?: () => void
}
