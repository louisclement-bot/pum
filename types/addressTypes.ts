import type { SimulatorData } from "../components/rainwater-simulator"
import type { Feature, Polygon, MultiPolygon } from "geojson"

export interface AddressSuggestion {
  label: string
  coordinates: [number, number] // [longitude, latitude]
  id: string // BAN ID
  city?: string
  postcode?: string
  citycode?: string
}

export interface Building {
  id: string | null
  label: string | null
  surface: number | null
  source: string | null
  isSelected: boolean
  rnbId?: string | null
  geojson?: Feature<Polygon | MultiPolygon> | null
}

export interface RoofDetails {
  orientation?: string
  slope?: number
  material?: string
  age?: number
}

export interface AddressSearchState {
  address: string
  selectedSuggestion: AddressSuggestion | null
  isSearching: boolean
  error: string | null
  buildings: Building[]
  mapCenter: [number, number] | null
  selectedBuildingId: string | null
  showMap: boolean
  mapError: boolean
  apiResponse: any | null
  roofDetails: RoofDetails | null
}

export interface AddressSearchContextType {
  state: AddressSearchState
  updateState: (updates: Partial<AddressSearchState>) => void
  handleSearch: (suggestionOverride?: AddressSuggestion) => Promise<void>
  handleBuildingSelect: (buildingId: string) => Promise<void>
  handleRetryMap: () => void
  handleContinue: () => void
  handleAddressSelect: (suggestion: AddressSuggestion) => void
}

export interface AddressInputProps {
  data: SimulatorData
  updateData: (data: Partial<SimulatorData>) => void
  nextStep: () => void
  prevStep: () => void
  goToStep: (step: number, subStep?: number) => void
}
