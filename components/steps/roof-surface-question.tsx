"use client"

import { Button } from "@/components/ui/button"
import type { SimulatorData } from "../rainwater-simulator"
import { RulerIcon as RulerSquare, Check, HelpCircle } from "lucide-react"
import { STEP_IDS, SUBSTEP_IDS } from "@/constants/steps"

type RoofSurfaceQuestionProps = {
  data: SimulatorData
  updateData: (data: Partial<SimulatorData>) => void
  nextStep: () => void
  prevStep: () => void
  goToStep: (step: number, subStep?: number) => void
}

export default function RoofSurfaceQuestion({
  data,
  updateData,
  nextStep,
  prevStep,
  goToStep,
}: RoofSurfaceQuestionProps) {
  const handleResponse = (knows: boolean) => {
    console.log(`handleResponse called with knows=${knows}`)

    // First update the data
    updateData({ knowsRoofSurface: knows })
    console.log(`Data updated: knowsRoofSurface=${knows}`)

    // Log the constants being used
    console.log(
      `Constants: STEP_IDS.ROOF_SURFACE=${STEP_IDS.ROOF_SURFACE}, SUBSTEP_IDS.MANUAL_SURFACE_INPUT=${SUBSTEP_IDS.MANUAL_SURFACE_INPUT}, SUBSTEP_IDS.ADDRESS_INPUT=${SUBSTEP_IDS.ADDRESS_INPUT}`,
    )

    // Use setTimeout to ensure the state update completes before navigation
    setTimeout(() => {
      if (knows) {
        console.log(`Navigating to: goToStep(${STEP_IDS.ROOF_SURFACE}, ${SUBSTEP_IDS.MANUAL_SURFACE_INPUT})`)
        // Explicitly navigate to substep 2 (Saisie de la surface) of step 2
        goToStep(STEP_IDS.ROOF_SURFACE, SUBSTEP_IDS.MANUAL_SURFACE_INPUT)
      } else {
        console.log(`Navigating to: goToStep(${STEP_IDS.ROOF_SURFACE}, ${SUBSTEP_IDS.ADDRESS_INPUT})`)
        goToStep(STEP_IDS.ROOF_SURFACE, SUBSTEP_IDS.ADDRESS_INPUT)
      }
    }, 0)
  }

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-[#1D40AF] dark:text-blue-300 mb-3">
          Connaissez-vous la surface de votre toit ?
        </h2>
        <p className="text-blue-600 dark:text-blue-400 max-w-2xl mx-auto text-sm md:text-base">
          La surface du toit est un élément important pour calculer la quantité d&apos;eau de pluie que vous pourrez
          récupérer.
        </p>
      </div>

      <div className="p-6 md:p-8 rounded-2xl shadow-md max-w-2xl mx-auto border border-blue-100 dark:border-blue-800 bg-white dark:bg-slate-800">
        <div className="flex items-center justify-center mb-8">
          <div className="bg-blue-100 dark:bg-blue-800/50 p-4 rounded-full">
            <RulerSquare className="h-8 w-8 md:h-10 md:w-10 text-[#1D40AF] dark:text-blue-400" />
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              type="button"
              onClick={() => handleResponse(true)}
              className="bg-white dark:bg-slate-800 rounded-xl p-6 border-2 border-blue-200 dark:border-blue-800 hover:border-[#1D40AF] dark:hover:border-blue-500 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer w-full text-left"
            >
              <div className="flex items-center gap-4">
                <div className="bg-green-100 dark:bg-green-900/50 p-3 rounded-full flex-shrink-0">
                  <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-xl text-[#1D40AF] dark:text-blue-300">Oui</h3>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleResponse(false)}
              className="bg-white dark:bg-slate-800 rounded-xl p-6 border-2 border-blue-200 dark:border-blue-800 hover:border-[#1D40AF] dark:hover:border-blue-500 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer w-full text-left"
            >
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-full flex-shrink-0">
                  <HelpCircle className="h-6 w-6 text-[#1D40AF] dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-xl text-[#1D40AF] dark:text-blue-300">Non</h3>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-start mt-8">
        <Button
          variant="outline"
          onClick={prevStep}
          className="px-6 py-2 md:py-3 rounded-xl border-blue-200 dark:border-blue-800 text-[#1D40AF] dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-all duration-300"
        >
          Précédent
        </Button>
      </div>
    </div>
  )
}
