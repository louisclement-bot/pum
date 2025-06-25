import type { Step } from "./rainwater-simulator"

type MobileProgressBarProps = {
  currentStep: number
  totalSteps: number
  className?: string
  steps: Step[]
}

export function MobileProgressBar({ currentStep, totalSteps, className = "", steps }: MobileProgressBarProps) {
  return (
    <div
      className={`w-full overflow-x-auto sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur ${className}`}
    >
      <div className="flex items-center min-w-max">
        {steps.map((step, index) => {
          const isActive = step.id === currentStep
          const isCompleted = step.id < currentStep
          const isLast = index === totalSteps - 1

          return (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    isActive
                      ? "bg-blue-500 text-white"
                      : isCompleted
                        ? "bg-green-500 text-white"
                        : "bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {isCompleted ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="text-sm font-semibold">{step.id}</span>
                  )}
                </div>
                <span
                  className={`mt-1 text-xs font-medium ${
                    isActive ? "text-blue-500" : isCompleted ? "text-green-500" : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {step.name}
                </span>
              </div>

              {!isLast && (
                <div
                  className={`h-0.5 w-8 mx-1 ${isCompleted ? "bg-green-500" : "bg-gray-200 dark:bg-slate-700"}`}
                ></div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
