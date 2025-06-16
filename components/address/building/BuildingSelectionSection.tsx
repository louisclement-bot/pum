import { useAddressSearch } from "@/contexts/AddressSearchContext"
import { BuildingSelectionList } from "@/components/ui-elements/building-selection-list"

export default function BuildingSelectionSection() {
  const { state, handleBuildingSelect } = useAddressSearch()
  const { buildings, selectedBuildingId } = state

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-blue-800 dark:text-blue-300">Bâtiments disponibles</h3>

      <BuildingSelectionList
        buildings={buildings.map((b) => ({
          id: b.building_id || "",
          label: b.label,
          surface: b.roof_surface_m2,
          source: b.building_id_source,
          isSelected: b.building_id === selectedBuildingId,
          rnbId: b.rnb_id,
        }))}
        onSelectBuilding={handleBuildingSelect}
      />
    </div>
  )
}
