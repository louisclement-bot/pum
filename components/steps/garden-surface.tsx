"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import StepButtons from "../ui-elements/step-buttons"
import type { SimulatorData } from "../rainwater-simulator"
import { useState } from "react"
import { WateringPlantIcon } from "../icons/watering-plant-icon"

type GardenSurfaceProps = {
  data: SimulatorData
  updateData: (data: Partial<SimulatorData>) => void
  nextStep: () => void
  prevStep: () => void
}

export default function GardenSurface({ data, updateData, nextStep, prevStep }: GardenSurfaceProps) {
  const [surface, setSurface] = useState<number>(data.gardenSurface ? Math.round(data.gardenSurface / 50) * 50 : 150)

  const handleNext = () => {
    updateData({ gardenSurface: surface })
    nextStep()
  }

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-blue-800 dark:text-blue-300 mb-3">
          Quelle est la surface de jardin à arroser ?
        </h2>
        <p className="text-blue-600 dark:text-blue-400 max-w-2xl mx-auto">
          Cette information nous permettra de calculer vos besoins en eau pour l&apos;arrosage.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-2xl shadow-soft max-w-2xl mx-auto border border-blue-100 dark:border-blue-800">
        <div className="flex items-center justify-center mb-6 md:mb-8">
          <div className="bg-blue-100 dark:bg-blue-900/50 p-4 rounded-full">
            <WateringPlantIcon className="text-blue-600 dark:text-blue-400" size={48} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="garden-surface" className="text-lg font-medium text-blue-800 dark:text-blue-300">
              Surface en m²
            </Label>
            <Input
              id="garden-surface"
              type="number"
              min={0}
              max={2000}
              value={surface}
              onChange={(e) => {
                const value = Number(e.target.value)
                // Round to the nearest multiple of 50
                setSurface(Math.max(0, Math.round(value / 50) * 50))
              }}
              className="w-full h-14 text-lg border-blue-200 dark:border-blue-800 focus:border-blue-500 dark:focus:border-blue-500 rounded-xl"
            />
          </div>

          <div className="space-y-3 mt-6">
            <Label className="text-lg font-medium text-blue-800 dark:text-blue-300">Ajustez avec le curseur</Label>
            <Slider
              value={[surface]}
              min={0}
              max={2000}
              step={50}
              onValueChange={(value) => setSurface(value[0])}
              className="py-4"
            />
            <div className="flex justify-between text-sm text-blue-700 dark:text-blue-400 font-medium">
              <span>0 m²</span>
              <span>1000 m²</span>
              <span>2000 m²</span>
            </div>
          </div>
        </div>
      </div>

      <StepButtons onNext={handleNext} onPrev={prevStep} nextDisabled={!surface || surface <= 0} />
    </div>
  )
}
