"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Building, CheckCircle2, Ruler, Info } from "lucide-react"
import { cn } from "@/lib/utils"

export type BuildingOption = {
  id: string
  label: string | null
  surface: number | null
  source: string | null
  isSelected: boolean
  rnbId?: string | null
}

interface BuildingSelectionCardProps {
  building: BuildingOption
  onSelect: (id: string) => void
  showDetails?: boolean
}

export function BuildingSelectionCard({ building, onSelect, showDetails = false }: BuildingSelectionCardProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <Card
      className={cn(
        "transition-all duration-300 hover:shadow-md border-2",
        building.isSelected
          ? "border-blue-500 dark:border-blue-400 shadow-blue-100 dark:shadow-blue-900/30"
          : "border-gray-200 dark:border-gray-700",
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "p-2 rounded-full flex-shrink-0 mt-1",
              building.isSelected ? "bg-blue-100 dark:bg-blue-900/50" : "bg-gray-100 dark:bg-gray-800",
            )}
          >
            {building.isSelected ? (
              <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            ) : (
              <Building className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            )}
          </div>

          <div className="flex-1">
            <div className="flex justify-between items-start">
              <h3
                className={cn(
                  "font-medium",
                  building.isSelected ? "text-blue-700 dark:text-blue-300" : "text-gray-700 dark:text-gray-300",
                )}
              >
                {building.label || "Bâtiment"}
              </h3>

              {building.isSelected && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                  Sélectionné
                </span>
              )}
            </div>

            {building.surface && (
              <div className="flex items-center mt-1 text-sm text-gray-600 dark:text-gray-400">
                <Ruler className="h-4 w-4 mr-1 flex-shrink-0" />
                <span>
                  Surface: <strong>{building.surface.toLocaleString("fr-FR")} m²</strong>
                </span>
              </div>
            )}

            {building.source && (
              <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-500">
                <Info className="h-3 w-3 mr-1 flex-shrink-0" />
                <span>Source: {building.source}</span>
              </div>
            )}

            {expanded && showDetails && (
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Détails supplémentaires</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Identifiant:</span>
                    <span className="text-gray-700 dark:text-gray-300 font-mono">{building.id}</span>
                  </div>
                  {building.rnbId && (
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">RNB ID:</span>
                      <span className="text-gray-700 dark:text-gray-300 font-mono">{building.rnbId}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="mt-3 flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? "Moins de détails" : "Plus de détails"}
              </Button>

              <Button
                variant={building.isSelected ? "outline" : "default"}
                size="sm"
                onClick={() => onSelect(building.id)}
                className={
                  building.isSelected
                    ? "border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/20"
                    : ""
                }
              >
                {building.isSelected ? "Sélectionné" : "Sélectionner"}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
