import type { Step } from "./rainwater-simulator"

type ProgressBarProps = {
  currentStep: number
  totalSteps: number
  steps: Step[]
}

export function ProgressBar({ currentStep, totalSteps, steps }: ProgressBarProps) {
  return (
    <div className="hidden md:flex flex-col items-center pt-10 pb-10 px-6 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 min-w-[200px]">
      <div className="flex flex-col items-center space-y-6 w-full">
        {steps.map((step, index) => {
          const isActive = step.id === currentStep
          const isCompleted = step.id < currentStep
          const isLast = index === totalSteps - 1

          return (
            <div key={step.id} className="flex flex-col items-center w-full">
              <div className="flex items-center justify-center w-full">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex items-center justify-center w-12 h-12 rounded-full ${
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
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className="text-lg font-semibold">{step.id}</span>
                    )}
                  </div>
                  <span
                    className={`mt-2 text-sm font-medium ${
                      isActive ? "text-blue-500" : isCompleted ? "text-green-500" : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {step.name}
                  </span>
                </div>
              </div>

              {!isLast && (
                <div
                  className={`h-12 w-0.5 mt-2 ${isCompleted ? "bg-green-500" : "bg-gray-200 dark:bg-slate-700"}`}
                ></div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
