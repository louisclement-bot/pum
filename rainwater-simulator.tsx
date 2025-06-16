"use client"

import { useState } from "react"
import { ProgressBar } from "./progress-bar"
import { MobileProgressBar } from "./mobile-progress-bar"
import UsageSelection from "./steps/usage-selection"
import GardenSurface from "./steps/garden-surface"
import RoofSurfaceQuestion from "./steps/roof-surface-question"
import RoofSurfaceInput from "./steps/roof-surface-input"
import AddressInput from "./steps/address-input"
import SurfaceConfirmation from "./steps/surface-confirmation"
import Rainfall from "./steps/rainfall"
import AutonomySelection from "./steps/autonomy-selection"
import Results from "./steps/results"
import FinancialAid from "./steps/financial-aid"
import RecommendedProducts from "./steps/recommended-products"
import { ThemeToggle } from "./ui-elements/theme-toggle"
import { useMediaQuery } from "@/hooks/use-media-query"
import { PumLogo } from "./ui-elements/pum-logo"
import type { JSX } from "react/jsx-runtime"
import { STEP_IDS, STEP_NAMES, SUBSTEP_IDS } from "@/constants/steps"
import { BREAKPOINTS } from "@/constants/ui"

export type UsageType = "garden" | "toilet" | "washing"

export type SimulatorData = {
  // Step 1: Needs and usage
  usages: UsageType[]
  gardenSurface?: number // in m²
  householdSize?: number

  // Step 2: Building information
  knowsRoofSurface?: boolean
  roofSurface?: number // in m²
  address?: string
  postalCode?: string
  city?: string

  // Step 3: Rainfall
  annualRainfall?: number // in mm/year
  autonomyWeeks?: number // 1-4 weeks

  // Calculated results
  annualWaterCollectable?: number // in liters
  annualWaterNeeds?: number // in liters
  recommendedTankSize?: number // in liters
  potentialSavings?: number // in m³
  potentialSavingsEuros?: number // in euros
  coverageRate?: number // percentage
}

// Define step structure for clarity
export type Step = {
  id: number
  name: string
  subSteps: SubStep[]
}

export type SubStep = {
  id: number
  name: string
  component: (props: any) => JSX.Element
  condition?: (data: SimulatorData) => boolean
}

export default function RainwaterSimulator() {
  const [currentStep, setCurrentStep] = useState(STEP_IDS.USAGE_SELECTION)
  const [currentSubStep, setCurrentSubStep] = useState(SUBSTEP_IDS.USAGE_SELECTION)
  const [data, setData] = useState<SimulatorData>({
    usages: [],
  })
  const [navigationHistory, setNavigationHistory] = useState<{ step: number; subStep: number }[]>([])

  const isMobile = useMediaQuery(BREAKPOINTS.MOBILE)

  // Define the steps structure using constants
  const steps: Step[] = [
    {
      id: STEP_IDS.USAGE_SELECTION,
      name: STEP_NAMES[STEP_IDS.USAGE_SELECTION],
      subSteps: [
        {
          id: SUBSTEP_IDS.USAGE_SELECTION,
          name: "Sélection des usages",
          component: UsageSelection,
        },
        {
          id: SUBSTEP_IDS.GARDEN_SURFACE,
          name: "Surface du jardin",
          component: GardenSurface,
          condition: (data) => data.usages.includes("garden"),
        },
      ],
    },
    {
      id: STEP_IDS.ROOF_SURFACE,
      name: STEP_NAMES[STEP_IDS.ROOF_SURFACE],
      subSteps: [
        {
          id: SUBSTEP_IDS.ROOF_SURFACE_QUESTION,
          name: "Connaissez-vous la surface",
          component: RoofSurfaceQuestion,
        },
        {
          id: SUBSTEP_IDS.MANUAL_SURFACE_INPUT,
          name: "Saisie de la surface",
          component: RoofSurfaceInput,
          condition: (data) => data.knowsRoofSurface === true,
        },
        {
          id: SUBSTEP_IDS.ADDRESS_INPUT,
          name: "Saisie de l'adresse",
          component: AddressInput,
          condition: (data) => data.knowsRoofSurface === false,
        },
        {
          id: SUBSTEP_IDS.SURFACE_CONFIRMATION,
          name: "Confirmation de la surface",
          component: SurfaceConfirmation,
          condition: (data) => data.knowsRoofSurface === false,
        },
      ],
    },
    {
      id: STEP_IDS.RAINFALL,
      name: STEP_NAMES[STEP_IDS.RAINFALL],
      subSteps: [
        {
          id: SUBSTEP_IDS.RAINFALL_INPUT,
          name: "Pluviométrie annuelle",
          component: Rainfall,
        },
        {
          id: SUBSTEP_IDS.AUTONOMY_SELECTION,
          name: "Autonomie souhaitée",
          component: AutonomySelection,
        },
      ],
    },
    {
      id: STEP_IDS.RESULTS,
      name: STEP_NAMES[STEP_IDS.RESULTS],
      subSteps: [
        {
          id: SUBSTEP_IDS.RESULTS,
          name: "Résultats de la simulation",
          component: Results,
        },
      ],
    },
    {
      id: STEP_IDS.FINANCIAL_AID,
      name: STEP_NAMES[STEP_IDS.FINANCIAL_AID],
      subSteps: [
        {
          id: SUBSTEP_IDS.FINANCIAL_AID,
          name: "Aides disponibles",
          component: FinancialAid,
        },
      ],
    },
    {
      id: STEP_IDS.PRODUCTS,
      name: STEP_NAMES[STEP_IDS.PRODUCTS],
      subSteps: [
        {
          id: SUBSTEP_IDS.PRODUCTS,
          name: "Produits recommandés",
          component: RecommendedProducts,
        },
      ],
    },
  ]

  // Helper function to update data
  const updateData = (newData: Partial<SimulatorData>) => {
    setData((prev) => ({ ...prev, ...newData }))
  }

  // Helper function to get the current step definition
  const getCurrentStepDef = () => {
    return steps.find((s) => s.id === currentStep)
  }

  // Helper function to get the current substep definition
  const getCurrentSubStepDef = () => {
    const stepDef = getCurrentStepDef()
    if (!stepDef) return null

    // Find the applicable substep based on conditions
    return stepDef.subSteps.find((ss) => {
      if (ss.id !== currentSubStep) return false
      if (ss.condition) return ss.condition(data)
      return true
    })
  }

  // Helper function to find the next valid substep
  const findNextValidSubStep = (step: number, subStep: number) => {
    console.log(`findNextValidSubStep called with step=${step}, subStep=${subStep}`)

    const stepDef = steps.find((s) => s.id === step)
    if (!stepDef) {
      console.log(`No step definition found for step=${step}`)
      return null
    }

    console.log(`Step definition found: ${JSON.stringify(stepDef.name)}`)
    console.log(`Looking for substep with id=${subStep}`)

    // Find the next valid substep
    for (let i = subStep; i <= Math.max(...stepDef.subSteps.map((ss) => ss.id)); i++) {
      const subStepDef = stepDef.subSteps.find((ss) => ss.id === i)
      console.log(`Checking substep with id=${i}: ${subStepDef ? "found" : "not found"}`)

      if (subStepDef) {
        if (subStepDef.condition) {
          const conditionResult = subStepDef.condition(data)
          console.log(`Substep has condition, result: ${conditionResult}`)
          if (conditionResult) {
            return i
          }
        } else {
          console.log(`Substep has no condition, returning id=${i}`)
          return i
        }
      }
    }

    console.log(`No valid substep found`)
    return null
  }

  // Helper function to find the previous valid substep
  const findPrevValidSubStep = (step: number, subStep: number) => {
    const stepDef = steps.find((s) => s.id === step)
    if (!stepDef) return null

    // Find the previous valid substep
    for (let i = subStep; i >= 1; i--) {
      const subStepDef = stepDef.subSteps.find((ss) => ss.id === i)
      if (subStepDef && (!subStepDef.condition || subStepDef.condition(data))) {
        return i
      }
    }
    return null
  }

  // Helper function to go to next step
  const nextStep = () => {
    // Add current position to history for back navigation
    setNavigationHistory((prev) => [...prev, { step: currentStep, subStep: currentSubStep }])

    const currentStepDef = getCurrentStepDef()
    if (!currentStepDef) return

    // Find the maximum valid substep ID for the current step
    const maxSubStepId = Math.max(...currentStepDef.subSteps.map((ss) => ss.id))

    // If we're not at the last substep, go to the next valid substep
    if (currentSubStep < maxSubStepId) {
      const nextSubStep = findNextValidSubStep(currentStep, currentSubStep + 1)
      if (nextSubStep) {
        setCurrentSubStep(nextSubStep)
        window.scrollTo({ top: 0, behavior: "smooth" })
        return
      }
    }

    // If we're at the last substep or there are no more valid substeps, go to the next step
    if (currentStep < STEP_IDS.PRODUCTS) {
      const nextStep = currentStep + 1
      const nextStepDef = steps.find((s) => s.id === nextStep)
      if (nextStepDef) {
        const nextSubStep = findNextValidSubStep(nextStep, 1)
        if (nextSubStep) {
          setCurrentStep(nextStep)
          setCurrentSubStep(nextSubStep)
          window.scrollTo({ top: 0, behavior: "smooth" })
        }
      }
    }
  }

  // Helper function to go to previous step
  const prevStep = () => {
    // If we have navigation history, use it
    if (navigationHistory.length > 0) {
      const prevPosition = navigationHistory[navigationHistory.length - 1]
      setCurrentStep(prevPosition.step)
      setCurrentSubStep(prevPosition.subStep)
      setNavigationHistory((prev) => prev.slice(0, -1))
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }

    // Fallback navigation if history is empty
    if (currentSubStep > 1) {
      const prevSubStep = findPrevValidSubStep(currentStep, currentSubStep - 1)
      if (prevSubStep) {
        setCurrentSubStep(prevSubStep)
        window.scrollTo({ top: 0, behavior: "smooth" })
      }
    } else if (currentStep > STEP_IDS.USAGE_SELECTION) {
      const prevStep = currentStep - 1
      const prevStepDef = steps.find((s) => s.id === prevStep)
      if (prevStepDef) {
        const maxSubStepId = Math.max(...prevStepDef.subSteps.map((ss) => ss.id))
        const prevSubStep = findPrevValidSubStep(prevStep, maxSubStepId)
        if (prevSubStep) {
          setCurrentStep(prevStep)
          setCurrentSubStep(prevSubStep)
          window.scrollTo({ top: 0, behavior: "smooth" })
        }
      }
    }
  }

  // Helper function to go to a specific step
  const goToStep = (step: number, subStep = 1) => {
    console.log(`goToStep called with step=${step}, subStep=${subStep}`)

    const targetSubStep = findNextValidSubStep(step, subStep)
    console.log(`findNextValidSubStep returned: ${targetSubStep}`)

    if (targetSubStep) {
      setCurrentStep(step)
      setCurrentSubStep(targetSubStep)
      window.scrollTo({ top: 0, behavior: "smooth" })
      console.log(`Navigation successful: currentStep=${step}, currentSubStep=${targetSubStep}`)
    } else {
      console.log(`Navigation failed: No valid substep found for step=${step}, subStep=${subStep}`)
    }
  }

  // Restart the simulator
  const restart = () => {
    setCurrentStep(STEP_IDS.USAGE_SELECTION)
    setCurrentSubStep(SUBSTEP_IDS.USAGE_SELECTION)
    setData({ usages: [] })
    setNavigationHistory([])
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // Render the current step
  const renderCurrentStep = () => {
    const subStepDef = getCurrentSubStepDef()
    if (!subStepDef) return null

    const Component = subStepDef.component
    const props = {
      data,
      updateData,
      nextStep,
      prevStep,
      goToStep,
      restart,
    }

    return <Component {...props} />
  }

  // Get the total number of steps for the progress bar
  const totalSteps = steps.length

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gradient-to-b from-sky-50 to-white dark:from-slate-950 dark:to-slate-900 transition-colors duration-300">
      {/* Vertical progress bar (desktop only) */}
      {!isMobile && <ProgressBar currentStep={currentStep} totalSteps={totalSteps} steps={steps} />}

      {/* Main content */}
      <div className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 relative z-10">
        <header className="mb-6 md:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="flex items-center justify-center">
              <PumLogo width={96} height={48} />
            </div>
            <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-400 dark:from-blue-400 dark:to-blue-300 leading-tight">
              Configurez votre cuve de récupération d&apos;eau de pluie
            </h1>
          </div>

          {/* Theme toggle */}
          <ThemeToggle />
        </header>

        {/* Mobile progress bar */}
        {isMobile && (
          <MobileProgressBar currentStep={currentStep} totalSteps={totalSteps} className="mb-6" steps={steps} />
        )}

        <main className="max-w-4xl mx-auto">{renderCurrentStep()}</main>

        <footer className="mt-8 md:mt-12 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex flex-wrap gap-4">
            <a href="#" className="hover:underline">
              Mentions légales
            </a>
            <a href="#" className="hover:underline">
              Politique de confidentialité
            </a>
          </div>
        </footer>
      </div>
    </div>
  )
}
