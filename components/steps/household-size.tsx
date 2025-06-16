"use client"

import { Card, CardContent } from "@/components/ui/card"
import StepButtons from "../ui-elements/step-buttons"
import type { SimulatorData } from "../rainwater-simulator"
import { useState } from "react"

type HouseholdSizeProps = {
  data: SimulatorData
  updateData: (data: Partial<SimulatorData>) => void
  nextStep: () => void
  prevStep: () => void
}

export default function HouseholdSize({ data, updateData, nextStep, prevStep }: HouseholdSizeProps) {
  const [size, setSize] = useState<number>(data.householdSize || 0)

  const handleNext = () => {
    updateData({ householdSize: size })
    nextStep()
  }

  const options = [1, 2, 3, 4, 5, 6, 7, 8]

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Combien de personnes vivent dans votre foyer ?</h2>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {options.map((number) => (
          <Card
            key={number}
            className={`cursor-pointer transition-all ${size === number ? "ring-2 ring-blue-500" : ""}`}
            onClick={() => setSize(number)}
          >
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <div className="flex mb-2">
                {Array.from({ length: number <= 4 ? number : 4 }).map((_, i) => (
                  <div key={i} className="text-2xl">
                    👤
                  </div>
                ))}
                {number > 4 && <span className="text-xl font-bold">+{number - 4}</span>}
              </div>
              <span className="font-medium">
                {number} {number === 1 ? "personne" : "personnes"}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      <StepButtons onNext={handleNext} onPrev={prevStep} nextDisabled={size === 0} />
    </div>
  )
}
