"use client"

import { useAddressSearch } from "@/contexts/AddressSearchContext"
import BuildingMap from "@/components/map/building-map"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw } from "lucide-react"

export default function BuildingMapSection() {
  const { state, handleBuildingSelect, handleRetryMap, updateState } = useAddressSearch()
  const { buildings, mapCenter, mapError } = state

  const handleMapError = () => {
    updateState({ mapError: true })
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-blue-800 dark:text-blue-300">Votre bâtiment</h3>

      {mapError ? (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertDescription>Impossible de charger la carte. Veuillez réessayer.</AlertDescription>
          <Button onClick={handleRetryMap} variant="outline" size="sm" className="mt-2">
            <RefreshCw className="mr-2 h-4 w-4" />
            Réessayer
          </Button>
        </Alert>
      ) : (
        <BuildingMap
          buildings={buildings}
          center={mapCenter}
          onBuildingSelect={handleBuildingSelect}
          className="mt-4 h-[300px] md:h-[400px]"
          onError={handleMapError}
        />
      )}
    </div>
  )
}
