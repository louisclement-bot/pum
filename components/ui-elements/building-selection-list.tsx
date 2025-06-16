"use client"

import { useState } from "react"
import { BuildingSelectionCard, type BuildingOption } from "./building-selection-card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"

interface BuildingSelectionListProps {
  buildings: BuildingOption[]
  onSelectBuilding: (id: string) => void
  showDetails?: boolean
}

export function BuildingSelectionList({
  buildings,
  onSelectBuilding,
  showDetails = false,
}: BuildingSelectionListProps) {
  const [showWarning, setShowWarning] = useState<boolean>(false)

  // Check if any building has an unrealistic surface area
  const hasUnrealisticSurface = buildings.some(
    (building) => (building.surface && building.surface > 1000) || (building.surface && building.surface < 10),
  )

  return (
    <div className="space-y-4">
      {hasUnrealisticSurface && (
        <Alert variant="warning" className="bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertDescription className="text-amber-700 dark:text-amber-300">
            Certaines surfaces de toit semblent inhabituelles. Veuillez vérifier et ajuster si nécessaire.
          </AlertDescription>
        </Alert>
      )}

      {buildings.length === 0 ? (
        <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">Aucun bâtiment disponible</p>
        </div>
      ) : (
        <div className="space-y-3">
          {buildings.map((building) => (
            <BuildingSelectionCard
              key={building.id}
              building={building}
              onSelect={onSelectBuilding}
              showDetails={showDetails}
            />
          ))}
        </div>
      )}
    </div>
  )
}
