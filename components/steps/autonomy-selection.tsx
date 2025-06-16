"use client"

import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import StepButtons from "../ui-elements/step-buttons"
import type { SimulatorData } from "../rainwater-simulator"
import { useState } from "react"

type AutonomySelectionProps = {
  data: SimulatorData
  updateData: (data: Partial<SimulatorData>) => void
  nextStep: () => void
  prevStep: () => void
}

export default function AutonomySelection({ data, updateData, nextStep, prevStep }: AutonomySelectionProps) {
  const [autonomy, setAutonomy] = useState<number>(data.autonomyWeeks || 2)

  const handleNext = () => {
    // Calculate results before moving to the next step
    const results = calculateResults({
      ...data,
      autonomyWeeks: autonomy,
    })

    updateData({
      autonomyWeeks: autonomy,
      ...results,
    })

    nextStep()
  }

  // Remplacer la fonction calculateResults par cette version mise à jour

  const calculateResults = (data: SimulatorData) => {
    // Calculate annual water collectable in m³
    const roofSurface = data.roofSurface || 0 // m²
    const annualRainfall = data.annualRainfall || 0 // mm/year
    const standardCoefficient = 0.7 // coefficient de perte standard de 0.7

    // Calcul direct en m³ (pluviométrie en mm/1000 = m)
    const annualWaterCollectableM3 = roofSurface * (annualRainfall / 1000) * standardCoefficient
    // Conversion en litres pour la compatibilité avec le reste de l'application
    const annualWaterCollectable = annualWaterCollectableM3 * 1000

    // Calculate annual water needs in m³
    const householdSize = data.householdSize || 0
    const gardenSurface = data.gardenSurface || 0

    let annualWaterNeedsM3 = 0

    if (data.usages.includes("toilet")) {
      annualWaterNeedsM3 += householdSize * 8.8 // 8.8 m³/personne/an pour les toilettes
    }

    if (data.usages.includes("washing")) {
      annualWaterNeedsM3 += householdSize * 3.7 // 3.7 m³/personne/an pour la machine à laver
    }

    if (data.usages.includes("garden")) {
      annualWaterNeedsM3 += gardenSurface * 0.06 // 0.06 m³/m²/an (60L) pour le jardin
    }

    // Conversion en litres pour la compatibilité
    const annualWaterNeeds = annualWaterNeedsM3 * 1000

    // Calculate recommended tank size based on water needs
    const autonomyWeeks = data.autonomyWeeks || 2

    // Utiliser le minimum entre l'eau récupérable et les besoins pour un dimensionnement optimal
    const effectiveAnnualWaterM3 = Math.min(annualWaterCollectableM3, annualWaterNeedsM3)
    const recommendedTankSizeM3 = (effectiveAnnualWaterM3 / 52) * autonomyWeeks
    // Conversion en litres et arrondi au litre supérieur
    const recommendedTankSize = Math.ceil(recommendedTankSizeM3 * 1000)

    // Calculate potential savings
    const potentialSavings = Math.min(annualWaterCollectableM3, annualWaterNeedsM3) // en m³
    const potentialSavingsEuros = potentialSavings * 4 // 4€/m³ prix moyen de l'eau

    // Calculate coverage rate
    const coverageRate =
      annualWaterNeedsM3 > 0 ? Math.min(100, (annualWaterCollectableM3 / annualWaterNeedsM3) * 100) : 0

    return {
      annualWaterCollectable, // en litres pour compatibilité
      annualWaterNeeds, // en litres pour compatibilité
      recommendedTankSize, // en litres pour compatibilité
      potentialSavings, // en m³
      potentialSavingsEuros, // en euros
      coverageRate, // en pourcentage
    }
  }

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-[#1D40AF] dark:text-blue-300 mb-3">
          Quelle autonomie souhaitez-vous pour votre installation ?
        </h2>
        <p className="text-[#1D40AF] dark:text-blue-400 max-w-2xl mx-auto text-sm md:text-base">
          L&apos;autonomie correspond à la période pendant laquelle vous souhaitez pouvoir utiliser l&apos;eau stockée
          en cas d&apos;absence de précipitations.
        </p>
      </div>

      <div className="p-8 rounded-2xl shadow-md max-w-2xl mx-auto border border-blue-100 dark:border-blue-800 bg-white dark:bg-slate-800">
        <div className="text-center mb-8">
          <div className="text-4xl font-bold text-[#1D40AF] dark:text-blue-400 mb-2">
            {autonomy} {autonomy === 1 ? "semaine" : "semaines"}
          </div>
          <p className="text-[#1D40AF] dark:text-blue-400">d&apos;autonomie</p>
        </div>

        <div className="space-y-6 max-w-md mx-auto">
          <Label className="text-[#1D40AF] dark:text-blue-300 font-medium text-base text-center block">
            Ajustez avec le curseur
          </Label>
          <Slider
            value={[autonomy]}
            min={1}
            max={6}
            step={1}
            onValueChange={(value) => setAutonomy(value[0])}
            className="py-4"
          />
          <div className="grid grid-cols-6 text-sm text-[#1D40AF] dark:text-blue-400 font-medium">
            <div className="text-center">1</div>
            <div className="text-center">2</div>
            <div className="text-center">3</div>
            <div className="text-center">4</div>
            <div className="text-center">5</div>
            <div className="text-center">6</div>
          </div>
        </div>

        <p className="text-sm text-[#1D40AF] dark:text-blue-400 italic mt-8 text-center">
          Plus l&apos;autonomie est grande, plus la cuve devra être volumineuse.
        </p>
      </div>

      <StepButtons onNext={handleNext} onPrev={prevStep} nextLabel="Calculer mes résultats" prevLabel="Précédent" />
    </div>
  )
}
