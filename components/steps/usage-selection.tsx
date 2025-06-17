"use client"

import type React from "react"

import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import StepButtons from "../ui-elements/step-buttons"
import NumberInput from "../ui-elements/number-input"
import type { SimulatorData, UsageType } from "../rainwater-simulator"
import { useState, useEffect } from "react"
import { Users } from "lucide-react"
import { WateringPlantIcon } from "../icons/watering-plant-icon"
import { ToiletIcon } from "../icons/toilet-icon"
import { WashingMachineIcon } from "../icons/washing-machine-icon"
import { useSingleFlight } from "@/lib/useSingleFlight"

type UsageSelectionProps = {
  data: SimulatorData
  updateData: (data: Partial<SimulatorData>) => void
  nextStep: () => void
  goToStep: (step: number, subStep?: number) => void
}

export default function UsageSelection({ data, updateData, nextStep, goToStep }: UsageSelectionProps) {
  const [selectedUsages, setSelectedUsages] = useState<UsageType[]>(data.usages || [])
  const [householdSize, setHouseholdSize] = useState<number>(data.householdSize || 2)

  // Check if we need to show the household size input
  const showHouseholdSize = selectedUsages.includes("toilet") || selectedUsages.includes("washing")

  // Update household size when data changes
  useEffect(() => {
    if (data.householdSize) {
      setHouseholdSize(data.householdSize)
    }
  }, [data.householdSize])

  const handleUsageToggle = (usage: UsageType) => {
    if (selectedUsages.includes(usage)) {
      setSelectedUsages(selectedUsages.filter((u) => u !== usage))
    } else {
      setSelectedUsages([...selectedUsages, usage])
    }
  }

  // `safeNext` executes a fresh callback each time – ensures it sees the latest state
  const [safeNext, isBusy] = useSingleFlight(async () => {
    const updatedData: Partial<SimulatorData> = {
      usages: selectedUsages,
    }

    // Include household size only if relevant
    if (showHouseholdSize) {
      updatedData.householdSize = householdSize
    }

    updateData(updatedData)

    // Navigate based on current selections
    if (selectedUsages.includes("garden")) {
      // Delay navigation so that `data.usages` is up-to-date when
      // the router evaluates `condition: (data) => data.usages.includes("garden")`.
      setTimeout(() => goToStep(1, 2), 0) // Garden surface sub-step
      // Delay navigation to ensure `updateData` state is committed
      setTimeout(() => goToStep(1, 2), 0)
    } else {
      nextStep()
    }
  })

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="text-center mb-6 md:mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-blue-800 mb-2 md:mb-3">
          Pour quels usages souhaitez-vous récupérer l&apos;eau de pluie ?
        </h2>
        <p className="text-blue-600 max-w-2xl mx-auto text-sm md:text-base">
          Sélectionnez les différentes utilisations que vous envisagez pour votre système de récupération d&apos;eau de
          pluie.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <UsageCard
          id="garden"
          title="Arrosage du jardin"
          description="Économisez l'eau potable pour vos plantes et votre pelouse"
          icon={<WateringPlantIcon className="text-green-500" />}
          checked={selectedUsages.includes("garden")}
          onToggle={() => handleUsageToggle("garden")}
        />

        <UsageCard
          id="toilet"
          title="Alimentation des toilettes"
          description="Réduisez votre consommation d'eau potable au quotidien"
          icon={<ToiletIcon className="text-blue-500" />}
          checked={selectedUsages.includes("toilet")}
          onToggle={() => handleUsageToggle("toilet")}
        />

        <UsageCard
          id="washing"
          title="Machine à laver"
          description="Utilisez l'eau de pluie pour votre linge"
          icon={<WashingMachineIcon className="h-12 w-12 text-purple-500" />}
          checked={selectedUsages.includes("washing")}
          onToggle={() => handleUsageToggle("washing")}
        />
      </div>

      {/* Household size input - only shown when toilet or washing is selected */}
      {showHouseholdSize && (
        <div className="mt-8 p-4 md:p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
          <div className="flex items-center gap-3 mb-4">
            <Users className="h-5 w-5 md:h-6 md:w-6 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg md:text-xl font-medium text-blue-800 dark:text-blue-300">
              Nombre de personnes vivant dans le foyer
            </h3>
          </div>

          <div className="flex items-center gap-4">
            <NumberInput value={householdSize} onChange={setHouseholdSize} min={1} max={10} className="w-40" />
            <p className="text-sm text-blue-700 dark:text-blue-400">
              Cette information nous permettra d&apos;estimer votre consommation d&apos;eau.
            </p>
          </div>
        </div>
      )}

      <StepButtons onNext={safeNext} busy={isBusy()} nextDisabled={selectedUsages.length === 0} />
    </div>
  )
}

type UsageCardProps = {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  checked: boolean
  onToggle: () => void
}

function UsageCard({ id, title, description, icon, checked, onToggle }: UsageCardProps) {
  return (
    <Card
      className={`overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg ${
        checked ? "ring-2 ring-blue-500 shadow-glow" : "hover:border-blue-200"
      }`}
      onClick={onToggle}
    >
      <CardContent className="p-4 md:p-6 flex flex-col h-full">
        <div className="flex items-start space-x-3 md:space-x-4">
          <Checkbox
            id={id}
            checked={checked}
            onCheckedChange={onToggle}
            className="mt-1 h-4 w-4 md:h-5 md:w-5 border-2 border-gray-300 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
          />
          <div className="flex-1">
            <Label htmlFor={id} className="text-base md:text-lg font-medium cursor-pointer">
              {title}
            </Label>
            <p className="text-gray-500 mt-1 text-xs md:text-sm">{description}</p>
          </div>
        </div>

        {/* Fixed height icon container with consistent vertical spacing and alignment */}
        <div className="mt-auto pt-6 h-24 flex items-end justify-center pb-2">
          <div className="transform scale-100 transition-transform duration-300 hover:scale-110">{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}
