"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Building, MapPin, Ruler, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { BuildingOption } from "./building-selection-card"

interface SelectedBuildingSummaryProps {
  building: BuildingOption
  address: string
}

export function SelectedBuildingSummary({ building, address }: SelectedBuildingSummaryProps) {
  // Check if surface area is unrealistic
  const isUnrealisticSurface =
    (building.surface && building.surface > 1000) || (building.surface && building.surface < 10)

  return (
    <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
      <CardContent className="p-4">
        <h3 className="text-lg font-medium text-blue-800 dark:text-blue-300 mb-3">Bâtiment sélectionné</h3>

        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 dark:bg-blue-800/50 p-2 rounded-full flex-shrink-0 mt-1">
              <Building className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h4 className="font-medium text-blue-700 dark:text-blue-300">{building.label || "Bâtiment"}</h4>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="bg-blue-100 dark:bg-blue-800/50 p-2 rounded-full flex-shrink-0 mt-1">
              <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h4 className="font-medium text-blue-700 dark:text-blue-300">Adresse</h4>
              <p className="text-blue-600 dark:text-blue-400 text-sm">{address}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="bg-blue-100 dark:bg-blue-800/50 p-2 rounded-full flex-shrink-0 mt-1">
              <Ruler className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h4 className="font-medium text-blue-700 dark:text-blue-300">Surface de toit</h4>
              <p className="text-blue-600 dark:text-blue-400 text-lg font-bold">
                {building.surface?.toLocaleString("fr-FR") || 0} m²
              </p>
            </div>
          </div>
        </div>

        {isUnrealisticSurface && (
          <Alert
            variant="warning"
            className="mt-3 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800"
          >
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="text-amber-700 dark:text-amber-300 text-sm">
              Cette surface semble {building.surface && building.surface > 1000 ? "très grande" : "très petite"}. Vous
              pourrez l'ajuster à l'étape suivante.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
