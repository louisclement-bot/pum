"use client"

import type React from "react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import StepButtons from "../ui-elements/step-buttons"
import type { SimulatorData } from "../rainwater-simulator"
import { useState, useEffect } from "react"
import { RulerIcon } from "lucide-react"

type RoofSurfaceInputProps = {
  data: SimulatorData
  updateData: (data: Partial<SimulatorData>) => void
  nextStep: () => void
  prevStep: () => void
  goToStep: (step: number, subStep?: number) => void
}

export default function RoofSurfaceInput({ data, updateData, nextStep, prevStep, goToStep }: RoofSurfaceInputProps) {
  const [surface, setSurface] = useState<number>(data.roofSurface || 0)

  // Debug logging
  useEffect(() => {
    console.log("RoofSurfaceInput mounted, current data:", data)
    console.log("Current surface value:", surface)
  }, [data, surface])

  const handleNext = () => {
    console.log("handleNext called with surface:", surface)

    // Preserve existing coordinates if available
    const updateObj: Partial<SimulatorData> = { roofSurface: surface }

    // Preserve coordinates if they exist
    if (data.latitude !== undefined && data.longitude !== undefined) {
      updateObj.latitude = data.latitude
      updateObj.longitude = data.longitude
    }

    updateData(updateObj)

    // Skip to step 3 (Pluie) since we don't need the address input or confirmation
    console.log("Navigating to step 3 (Rainfall)")
    goToStep(3, 1)
  }

  const handleSurfaceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const numValue = value === "" ? 0 : Number(value)
    console.log("Surface input changed:", value, "->", numValue)
    setSurface(numValue)
  }

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-[#1D40AF] dark:text-blue-300 mb-3">
          Saisie de la surface du toit
        </h2>
        <p className="text-blue-600 dark:text-blue-400 max-w-2xl mx-auto text-sm md:text-base">
          Vous avez indiqué connaître la surface de votre toit. Veuillez la saisir ci-dessous.
        </p>
      </div>

      <div className="p-6 md:p-8 rounded-2xl shadow-md max-w-2xl mx-auto border border-blue-100 dark:border-blue-800 bg-white dark:bg-slate-800">
        <div className="flex items-center justify-center mb-8">
          <div className="bg-blue-100 dark:bg-blue-800/50 p-4 rounded-full">
            <RulerIcon className="h-8 w-8 md:h-10 md:w-10 text-[#1D40AF] dark:text-blue-400" />
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <Label htmlFor="roof-surface" className="text-lg font-medium text-[#1D40AF] dark:text-blue-300 block">
              Surface de votre toit en m²
            </Label>
            <Input
              id="roof-surface"
              type="number"
              min={1}
              max={2000}
              step={1}
              value={surface || ""}
              onChange={handleSurfaceChange}
              className="w-full h-12 text-lg border-2 border-blue-200 dark:border-blue-800 focus:border-[#1D40AF] dark:focus:border-blue-500 rounded-xl"
              placeholder="Exemple: 120"
              required
            />
            <p className="text-sm text-blue-600 dark:text-blue-400">
              Entrez la surface totale de votre toit en mètres carrés
            </p>
          </div>
        </div>
      </div>

      <StepButtons
        onNext={handleNext}
        onPrev={prevStep}
        nextDisabled={!surface || surface <= 0}
        nextLabel="Continuer"
      />
    </div>
  )
}
