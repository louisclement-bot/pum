"use client"

import { ArrowLeft, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

type StepButtonsProps = {
  onNext?: () => void
  onPrev?: () => void
  nextLabel?: string
  prevLabel?: string
  nextDisabled?: boolean
  busy?: boolean
}

export default function StepButtons({
  onNext,
  onPrev,
  nextLabel = "Suivant",
  prevLabel = "Précédent",
  nextDisabled = false,
  busy = false,
}: StepButtonsProps) {
  return (
    <div className="flex justify-between mt-8 md:mt-10">
      {onPrev ? (
        <Button
          variant="outline"
          onClick={onPrev}
          className="px-4 py-2 md:px-6 md:py-3 rounded-xl border-blue-200 text-[#1D40AF] hover:bg-blue-50 transition-all duration-300 text-sm md:text-base"
        >
          <ArrowLeft className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
          {prevLabel}
        </Button>
      ) : (
        <div></div>
      )}

      {onNext && (
        <Button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            console.log("Next button clicked", { nextDisabled })
            if (!nextDisabled && onNext) {
              onNext()
            }
          }}
          disabled={nextDisabled || busy}
          type="button"
          className="px-4 py-2 md:px-6 md:py-3 rounded-xl bg-[#1D40AF] hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 disabled:hover:scale-100 text-sm md:text-base"
        >
          {busy ? "…" : nextLabel}
          {!busy && nextLabel === "Suivant" && <ArrowRight className="ml-1 md:ml-2 h-3 w-3 md:h-4 md:w-4" />}
        </Button>
      )}
    </div>
  )
}
