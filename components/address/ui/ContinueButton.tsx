"use client"

import { Button } from "@/components/ui/button"
import { useAddressSearch } from "@/contexts/AddressSearchContext"
import { useEffect, useState } from "react"

export default function ContinueButton() {
  const { state, handleContinue, isBusy } = useAddressSearch()
  const { selectedBuildingId, isSearching, error } = state
  const [showError, setShowError] = useState(false)

  // Show error feedback when error state changes
  useEffect(() => {
    if (error && error.includes("sélectionner un bâtiment")) {
      setShowError(true)
      setTimeout(() => setShowError(false), 3000)
    }
  }, [error])

  const handleClick = () => {
    console.log("ContinueButton clicked, selectedBuildingId:", selectedBuildingId)
    handleContinue()
  }

  return (
    <div className="relative">
      <Button
        onClick={handleClick}
        disabled={!selectedBuildingId || isSearching || isBusy()}
        className={`w-full mt-4 py-3 rounded-xl bg-[#1D40AF] hover:bg-blue-700 text-white transition-all duration-300 ${
          showError ? "animate-shake" : ""
        } ${!selectedBuildingId ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        {isSearching ? (
          <span className="flex items-center justify-center">
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Chargement...
          </span>
        ) : (
          "Continuer avec ce bâtiment"
        )}
      </Button>

      {/* Error message */}
      {showError && (
        <div className="absolute -bottom-8 left-0 right-0 text-center">
          <p className="text-sm text-red-600 dark:text-red-400 error-message">{error}</p>
        </div>
      )}
    </div>
  )
}
