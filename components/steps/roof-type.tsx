"use client"

import { Card, CardContent } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import StepButtons from "../ui-elements/step-buttons"
import type { SimulatorData } from "../rainwater-simulator"
import { useState } from "react"

type RoofTypeProps = {
  data: SimulatorData
  updateData: (data: Partial<SimulatorData>) => void
  nextStep: () => void
  prevStep: () => void
}

type RoofTypeOption = {
  id: "tiles" | "slate" | "corrugated" | "green" | "unknown"
  name: string
  icon: string
  coefficient: number
}

export default function RoofType({ data, updateData, nextStep, prevStep }: RoofTypeProps) {
  const [roofType, setRoofType] = useState<RoofTypeOption["id"]>(data.roofType || "unknown")

  const roofTypes: RoofTypeOption[] = [
    { id: "tiles", name: "Tuiles (terre cuite)", icon: "🏠", coefficient: 0.8 },
    { id: "slate", name: "Ardoises", icon: "🏛️", coefficient: 0.8 },
    { id: "corrugated", name: "Tôles ondulées", icon: "🏭", coefficient: 0.9 },
    { id: "green", name: "Toit végétalisé", icon: "🌿", coefficient: 0.5 },
    { id: "unknown", name: "Je ne sais pas", icon: "❓", coefficient: 0.8 },
  ]

  const handleNext = () => {
    const selectedType = roofTypes.find((type) => type.id === roofType)
    updateData({
      roofType,
      roofCoefficient: selectedType?.coefficient,
    })
    nextStep()
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Quel est le type de revêtement de votre toiture ?</h2>

      <RadioGroup
        value={roofType}
        onValueChange={(value) => setRoofType(value as RoofTypeOption["id"])}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {roofTypes.map((type) => (
          <div key={type.id}>
            <RadioGroupItem value={type.id} id={type.id} className="sr-only" />
            <Label htmlFor={type.id} className="cursor-pointer">
              <Card className={`h-full transition-all ${roofType === type.id ? "ring-2 ring-blue-500" : ""}`}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="text-3xl">{type.icon}</div>
                  <div>
                    <div className="font-medium">{type.name}</div>
                    {type.id !== "unknown" && (
                      <div className="text-sm text-gray-500">Coefficient: {type.coefficient}</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Label>
          </div>
        ))}
      </RadioGroup>

      <StepButtons onNext={handleNext} onPrev={prevStep} />
    </div>
  )
}
