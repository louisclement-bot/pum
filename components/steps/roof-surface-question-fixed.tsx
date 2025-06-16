"use client"

import { Button } from "@/components/ui/button"
import type { SimulatorData } from "../rainwater-simulator"
import { Check, HelpCircle, ChevronLeft } from "lucide-react"
import { RulerIcon } from "lucide-react" // Declaring the RulerIcon variable

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
    // Update the parent state
    updateData({ knowsRoofSurface: knows })

    // Navigate directly without useEffect
    if (knows) {
      goToStep(2, 2) // Redirect to roof surface input step (step 2, substep 2)
    } else {
      goToStep(2, 3) // Redirect to address input step (step 2, substep 3)
    }
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
            <RulerIcon className="h-8 w-8 md:h-10 md:w-10 text-[#1D40AF] dark:text-blue-400" />
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
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                    Je vais saisir la surface manuellement
                  </p>
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
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">Rechercher à partir de mon adresse</p>
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
          <ChevronLeft className="h-4 w-4 mr-2" />
          Précédent
        </Button>
      </div>
    </div>
  )
}
