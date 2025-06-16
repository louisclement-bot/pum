"use client"
import StepButtons from "../ui-elements/step-buttons"
import type { SimulatorData } from "../rainwater-simulator"
import { useState, useEffect } from "react"
import { MapPin, Building, AlertTriangle, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import NumberInput from "../ui-elements/number-input"

type SurfaceConfirmationProps = {
  data: SimulatorData
  updateData: (data: Partial<SimulatorData>) => void
  nextStep: () => void
  prevStep: () => void
}

export default function SurfaceConfirmation({ data, updateData, nextStep, prevStep }: SurfaceConfirmationProps) {
  const [surface, setSurface] = useState<number>(data.roofSurface || 0)
  const [showWarning, setShowWarning] = useState<boolean>(false)
  const [warningMessage, setWarningMessage] = useState<string>("")
  const [manualEntryRequired, setManualEntryRequired] = useState<boolean>(false)

  // Check if manual entry is required (no API-provided surface)
  useEffect(() => {
    if (!data.roofSurface || data.roofSurface === 0) {
      setManualEntryRequired(true)
    }
  }, [data.roofSurface])

  // Validate surface area when it changes
  useEffect(() => {
    validateSurface(surface)
  }, [surface])

  const validateSurface = (value: number) => {
    if (value > 1000) {
      setShowWarning(true)
      setWarningMessage(
        "La surface saisie semble très grande. Veuillez vérifier que la valeur est en mètres carrés (m²).",
      )
    } else if (value < 10 && value > 0) {
      setShowWarning(true)
      setWarningMessage(
        "La surface saisie semble très petite. Veuillez vérifier que la valeur est en mètres carrés (m²).",
      )
    } else {
      setShowWarning(false)
      setWarningMessage("")
    }
  }

  const handleNext = () => {
    updateData({ roofSurface: surface })
    nextStep()
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-[#1d40af] dark:text-blue-300">Surface de toit estimée</h2>

      {manualEntryRequired && (
        <Alert variant="warning" className="bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertDescription className="text-amber-700 dark:text-amber-300">
            La surface de votre toit n'a pas pu être déterminée automatiquement. Veuillez saisir manuellement la surface
            approximative.
          </AlertDescription>
        </Alert>
      )}

      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-blue-100 dark:border-blue-800 shadow-md">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded-full">
            <MapPin className="h-5 w-5 text-[#1D40AF] dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-medium text-[#1D40AF] dark:text-blue-300">Adresse analysée</h3>
            <p className="text-gray-600 dark:text-gray-300">{data.address}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-6">
          <div className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded-full">
            <Building className="h-5 w-5 text-[#1D40AF] dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-medium text-[#1D40AF] dark:text-blue-300">Bâtiment sélectionné</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Surface estimée: <strong className="text-[#1D40AF] dark:text-blue-300 text-lg">{surface} m²</strong>
            </p>
          </div>
        </div>

        <div className="mt-6">
          <p className="text-gray-600 dark:text-gray-400 text-sm italic">
            {manualEntryRequired
              ? "Veuillez saisir la surface approximative de votre toit."
              : "Cette estimation est basée sur les données cadastrales et peut être ajustée si nécessaire."}
          </p>
        </div>
      </div>

      {showWarning && (
        <Alert variant="warning" className="bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertDescription className="text-amber-700 dark:text-amber-300">{warningMessage}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4 max-w-md">
        <NumberInput
          label={manualEntryRequired ? "Saisir la surface (m²)" : "Ajuster la surface si nécessaire (m²)"}
          value={surface}
          onChange={setSurface}
          min={1}
          max={2000}
          step={5}
          className="w-full"
        />
      </div>

      <StepButtons
        onNext={handleNext}
        onPrev={prevStep}
        nextLabel="Confirmer et continuer"
        nextDisabled={!surface || surface <= 0}
      />
    </div>
  )
}
