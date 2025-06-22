"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { ProgressBar } from "./progress-bar"
import { MobileProgressBar } from "./mobile-progress-bar"
import UsageSelection from "./steps/usage-selection"
import GardenSurface from "./steps/garden-surface"
import RoofSurfaceQuestion from "./steps/roof-surface-question-fixed"
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
  /** Code INSEE de la commune (citycode) */
  citycode?: string
  latitude?: number
  longitude?: number

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
  const [currentStep, setCurrentStep] = useState(1)
  const [currentSubStep, setCurrentSubStep] = useState(1)
  const [data, setData] = useState<SimulatorData>({
    usages: [],
  })

  // ────────────────────────────────
  // Keep a ref pointing to the latest `data`
  // Helpful for debugging timing issues with stale closures.
  // ────────────────────────────────
  const dataRef = useRef<SimulatorData>(data)

  // Update the ref whenever the state changes and log the event
  useEffect(() => {
    dataRef.current = data
    console.log("[dataRef] updated:", dataRef.current)
  }, [data])
  const [navigationHistory, setNavigationHistory] = useState<{ step: number; subStep: number }[]>([])

  const isMobile = useMediaQuery("(max-width: 768px)")

  // Define the steps structure
  const steps: Step[] = [
    {
      id: 1,
      name: "Besoins et usages",
      subSteps: [
        {
          id: 1,
          name: "Sélection des usages",
          component: UsageSelection,
        },
        {
          id: 2,
          name: "Surface du jardin",
          component: GardenSurface,
          condition: (data) => data.usages.includes("garden"),
        },
      ],
    },
    {
      id: 2,
      name: "Surface",
      subSteps: [
        {
          id: 1,
          name: "Connaissez-vous la surface",
          component: RoofSurfaceQuestion,
        },
        {
          id: 2,
          name: "Saisie manuelle de la surface",
          component: RoofSurfaceInput,
          condition: (data) => data.knowsRoofSurface === true,
        },
        {
          id: 3,
          name: "Recherche par adresse",
          component: AddressInput,
          condition: (data) => data.knowsRoofSurface === false,
        },
        {
          id: 4,
          name: "Confirmation de la surface",
          condition: (data) => data.knowsRoofSurface === false,
          component: SurfaceConfirmation,
        },
      ],
    },
    {
      id: 3,
      name: "Pluie",
      subSteps: [
        {
          id: 1,
          name: "Pluviométrie annuelle",
          component: Rainfall,
        },
        {
          id: 2,
          name: "Autonomie souhaitée",
          component: AutonomySelection,
        },
      ],
    },
    {
      id: 4,
      name: "Résultats",
      subSteps: [
        {
          id: 1,
          name: "Résultats de la simulation",
          component: Results,
        },
      ],
    },
    {
      id: 5,
      name: "Aides",
      subSteps: [
        {
          id: 1,
          name: "Aides disponibles",
          component: FinancialAid,
        },
      ],
    },
    {
      id: 6,
      name: "Produits",
      subSteps: [
        {
          id: 1,
          name: "Produits recommandés",
          component: RecommendedProducts,
        },
      ],
    },
  ]

  // Helper function to update data
  const updateData = useCallback((newData: Partial<SimulatorData>) => {
    console.log("[updateData] called with:", newData)

    /* ------------------------------------------------------------------
     * Merge the incoming partial update with the latest known simulator
     * state (always available via `dataRef.current`).  We **must** update
     * the ref synchronously here so that any navigation function executed
     * immediately after this call can rely on `dataRef.current` containing
     * the brand-new values.  The subsequent `setData` call will trigger
     * the normal React render cycle so that `data` stays consistent.
     * ------------------------------------------------------------------ */
    const newCompleteData: SimulatorData = {
      ...dataRef.current,
      ...newData,
    }

    // 1.  Synchronously update the ref (makes the change visible *now*)
    dataRef.current = newCompleteData
    console.log("[updateData] dataRef.current synchronously updated to:", dataRef.current)

    // 2.  Schedule state update so the component re-renders with latest data
    setData(newCompleteData)
  }, [])

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
      if (ss.condition) return ss.condition(dataRef.current)
      return true
    })
  }

  // Helper function to find the next valid substep
  const findNextValidSubStep = (stepId: number, subStepId: number) => {
    const stepDef = steps.find((s) => s.id === stepId)
    console.log(`Finding next valid substep for step ${stepId}, starting from substep ${subStepId}`)
    console.log(`Current data.knowsRoofSurface:`, dataRef.current.knowsRoofSurface)
    if (!stepDef) {
      console.error(`[findNextValidSubStep] ERROR: No step definition found for stepId: ${stepId}. Available step IDs: ${steps.map(s => s.id).join(', ')}.`)
      return null
    }

    // Find the next valid substep
    for (let i = subStepId; i <= Math.max(...stepDef.subSteps.map((ss) => ss.id)); i++) {
      const subStepDef = stepDef.subSteps.find((ss) => ss.id === i)

      // ────────────────────────────────
      // Debug logging for garden surface (step 1 ‑ sub-step 2)
      // Helps diagnose the "garden-only navigation" issue.
      // ────────────────────────────────
      if (stepId === 1 && i === 2) {
        console.log(
          `[DEBUG] Garden surface check – data.usages:`,
          dataRef.current.usages,
          "| dataRef.usages:",
          dataRef.current.usages,
          `| condition result (from state):`,
          dataRef.current.usages.includes("garden"),
          `| condition result (from ref):`,
          dataRef.current.usages.includes("garden"),
        )
      }

      // Use the up-to-date reference to ensure conditions are evaluated
      // against the latest simulator state.
      if (subStepDef && (!subStepDef.condition || subStepDef.condition(dataRef.current))) {
        return i
      }
    }
    return null
  }

  // Helper function to find the previous valid substep
  const findPrevValidSubStep = (stepId: number, subStepId: number) => {
    const stepDef = steps.find((s) => s.id === stepId)
    if (!stepDef) return null

    // Find the previous valid substep
    for (let i = subStepId; i >= 1; i--) {
      const subStepDef = stepDef.subSteps.find((ss) => ss.id === i)
      if (subStepDef && (!subStepDef.condition || subStepDef.condition(dataRef.current))) {
        return i
      }
    }
    return null
  }

  // Helper function to go to next step
  const nextStep = useCallback(() => {
    // Add current position to history for back navigation
    setNavigationHistory((prev) => [...prev, { step: currentStep, subStep: currentSubStep }])

    const currentStepDef = getCurrentStepDef()
    if (!currentStepDef) return

    // Special case for step 2: If we're at sub-step 2 (manual input) and knowsRoofSurface is true,
    // skip directly to step 3 (Pluie)
    if (currentStep === 2 && currentSubStep === 2 && dataRef.current.knowsRoofSurface === true) {
      setCurrentStep(3)
      setCurrentSubStep(1)
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }

    // Find the maximum valid substep ID for the current step
    const maxSubStepId = Math.max(...currentStepDef.subSteps.map((ss) => ss.id))

    // If we're not at the last substep, go to the next valid substep
    if (currentSubStep < maxSubStepId) {
      const nextSubStepId = findNextValidSubStep(currentStep, currentSubStep + 1)
      if (nextSubStepId) {
        setCurrentSubStep(nextSubStepId)
        window.scrollTo({ top: 0, behavior: "smooth" })
        return
      }
    }

    // If we're at the last substep or there are no more valid substeps, go to the next step
    if (currentStep < steps.length) {
      // Special case: When moving from step 1, always go to step 2 (Surface)
      // but skip the garden surface substep if garden is not selected
      if (currentStep === 1) {
        const nextStepId = 2
        const nextSubStepId = findNextValidSubStep(nextStepId, 1)
        if (nextSubStepId) {
          setCurrentStep(nextStepId)
          setCurrentSubStep(nextSubStepId)
          window.scrollTo({ top: 0, behavior: "smooth" })
          return
        }
      }

      // Normal case: go to the next step
      const nextStepId = currentStep + 1
      const nextSubStepId = findNextValidSubStep(nextStepId, 1)
      if (nextSubStepId) {
        setCurrentStep(nextStepId)
        setCurrentSubStep(nextSubStepId)
        window.scrollTo({ top: 0, behavior: "smooth" })
      }
    }
  }, [currentStep, currentSubStep])

  // Helper function to go to previous step
  const prevStep = useCallback(() => {
    // If we have navigation history, use it
    if (navigationHistory.length > 0) {
      const prevPosition = navigationHistory[navigationHistory.length - 1]
      setCurrentStep(prevPosition.step)
      setCurrentSubStep(prevPosition.subStep)
      setNavigationHistory((prev) => prev.slice(0, -1))
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }

    // Special case for step 3: When going back from any sub-step in step 3, go back to the question
    if (currentStep === 2 && currentSubStep > 1) {
      setCurrentSubStep(1)
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }

    // Fallback navigation if history is empty
    if (currentSubStep > 1) {
      const prevSubStepId = findPrevValidSubStep(currentStep, currentSubStep - 1)
      if (prevSubStepId) {
        setCurrentSubStep(prevSubStepId)
        window.scrollTo({ top: 0, behavior: "smooth" })
      }
    } else if (currentStep > 1) {
      // Special case: Skip garden surface step if garden is not selected
      if (currentStep === 2 && !dataRef.current.usages.includes("garden")) {
        // Skip back to step 1 (Besoins et usages)
        const prevStepId = 1
        const prevSubStepId = findPrevValidSubStep(prevStepId, 1)
        if (prevSubStepId) {
          setCurrentStep(prevStepId)
          setCurrentSubStep(prevSubStepId)
          window.scrollTo({ top: 0, behavior: "smooth" })
          return
        }
      }

      // Normal case: go to the previous step
      const prevStepId = currentStep - 1
      const prevStepDef = steps.find((s) => s.id === prevStepId)
      if (prevStepDef) {
        const maxSubStepId = Math.max(...prevStepDef.subSteps.map((ss) => ss.id))
        const prevSubStepId = findPrevValidSubStep(prevStepId, maxSubStepId)
        if (prevSubStepId) {
          setCurrentStep(prevStepId)
          setCurrentSubStep(prevSubStepId)
          window.scrollTo({ top: 0, behavior: "smooth" })
        }
      }
    }
  }, [currentStep, currentSubStep, navigationHistory])

  // Helper function to go to a specific step
  const goToStep = useCallback(
    (stepId: number, subStepId = 1) => {
      // ────────────────────────────────
      // Debug: track every explicit navigation request
      // ────────────────────────────────
      console.log(
        `[goToStep] INVOKED with stepId: ${stepId}, subStepId: ${subStepId}. ` +
          `Current parent step: ${currentStep}, subStep: ${currentSubStep}`,
      )

      // Validate stepId to ensure it's a number and exists in the steps array
      if (typeof stepId !== 'number' || !steps.find(s => s.id === stepId)) {
        console.error(`[goToStep] ERROR: Invalid stepId received: ${stepId}. Navigation halted.`);
        return;
      }
      
      // Add current position to history for back navigation
      setNavigationHistory((prev) => [...prev, { step: currentStep, subStep: currentSubStep }])

      const targetSubStepId = findNextValidSubStep(stepId, subStepId)
      if (targetSubStepId) {
        setCurrentStep(stepId)
        setCurrentSubStep(targetSubStepId)
        window.scrollTo({ top: 0, behavior: "smooth" })
      }
    },
    [currentStep, currentSubStep],
  )

  // Restart the simulator
  const restart = useCallback(() => {
    setCurrentStep(1)
    setCurrentSubStep(1)
    setData({ usages: [] })
    setNavigationHistory([])
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [])

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
