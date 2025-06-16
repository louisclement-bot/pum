import { useAddressSearch } from "@/contexts/AddressSearchContext"
import { Card, CardContent } from "@/components/ui/card"
import { Home, MapPin, Ruler, Info } from "lucide-react"

export default function SelectedBuildingDetails() {
  const { state } = useAddressSearch()
  const { buildings, selectedBuildingId, address, roofDetails } = state

  if (!selectedBuildingId) return null

  const selectedBuilding = buildings.find((b) => b.building_id === selectedBuildingId)
  if (!selectedBuilding) return null

  // Format the surface area with thousand separators
  const formatSurface = (surface: number) => {
    return new Intl.NumberFormat("fr-FR").format(surface)
  }

  return (
    <div className="mt-6">
      <Card className="building-detail-card bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 overflow-hidden">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-start gap-4">
            <div className="bg-blue-100 dark:bg-blue-800/50 p-2 rounded-full flex-shrink-0 mt-1">
              <Home className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>

            <div className="space-y-3 w-full">
              <div>
                <h4 className="font-medium text-blue-800 dark:text-blue-300 text-lg">Bâtiment sélectionné</h4>
                <div className="flex items-start gap-1 mt-1">
                  <MapPin className="h-4 w-4 text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-700 dark:text-gray-300">{selectedBuilding.label || address}</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Ruler className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="font-medium text-blue-700 dark:text-blue-300">
                  Surface: {formatSurface(selectedBuilding.roof_surface_m2 || 0)} m²
                </span>
              </div>

              {selectedBuilding.building_id_source && (
                <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                  <Info className="h-3 w-3" />
                  <span>Source: {selectedBuilding.building_id_source}</span>
                </div>
              )}
            </div>
          </div>

          {/* Render roof details if available */}
          {roofDetails && (
            <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800/50">
              <h5 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Détails du toit</h5>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {roofDetails.orientation && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Orientation:</span>
                    <span className="font-medium text-blue-700 dark:text-blue-300">{roofDetails.orientation}</span>
                  </div>
                )}

                {roofDetails.slope !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Pente:</span>
                    <span className="font-medium text-blue-700 dark:text-blue-300">{roofDetails.slope}°</span>
                  </div>
                )}

                {roofDetails.material && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Matériau:</span>
                    <span className="font-medium text-blue-700 dark:text-blue-300">{roofDetails.material}</span>
                  </div>
                )}

                {roofDetails.age && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Âge estimé:</span>
                    <span className="font-medium text-blue-700 dark:text-blue-300">{roofDetails.age} ans</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
