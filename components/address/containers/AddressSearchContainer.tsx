"use client"

import type React from "react"

import { MapPin } from "lucide-react"
import { useAddressSearch, AddressSearchProvider } from "@/contexts/AddressSearchContext"
import AddressAutocompleteField from "../fields/AddressAutocompleteField"
import BuildingMapSection from "../building/BuildingMapSection"
import SelectedBuildingDetails from "../building/SelectedBuildingDetails"
import AddressSearchHeader from "../ui/AddressSearchHeader"
import PrivacyNotice from "../ui/PrivacyNotice"
import ContinueButton from "../ui/ContinueButton"
import StepButtons from "@/components/ui-elements/step-buttons"
import type { AddressInputProps } from "@/types/addressTypes"

function AddressSearchContent() {
  const { state, handleSearch, prevStep } = useAddressSearch()
  const { showMap, buildings, address, isSearching } = state

  // Handle Enter key press to trigger search
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && address.trim() && !isSearching && !showMap) {
      e.preventDefault()
      handleSearch()
    }
  }

  return (
    <div className="space-y-8" onKeyPress={handleKeyPress}>
      <AddressSearchHeader />

      <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 p-6 md:p-8 rounded-2xl shadow-soft max-w-2xl mx-auto">
        <div className="flex items-center justify-center mb-6">
          <div className="bg-blue-100 dark:bg-blue-800/50 p-4 rounded-full">
            <MapPin className="h-8 w-8 md:h-10 md:w-10 text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        <div className="space-y-8">
          {/* Enhanced address input section */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-blue-600/10 rounded-2xl blur-xl"></div>
            <div className="relative bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm p-6 md:p-8 rounded-2xl border border-blue-200/50 dark:border-blue-700/50 shadow-lg">
              <AddressAutocompleteField />
            </div>
          </div>

          {/* Enhanced privacy notice - Only show when map is not displayed */}
          {!showMap && (
            <div className="flex items-start gap-3 p-4 bg-blue-50/80 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/50">
              <div className="flex-shrink-0 mt-0.5">
                <svg
                  className="w-5 h-5 text-blue-600 dark:text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                <p className="font-medium mb-1">Protection de vos données</p>
                <p className="text-blue-600 dark:text-blue-400">
                  Nous utiliserons cette adresse uniquement pour calculer la surface de votre toit et la pluviométrie
                  locale. Vos données personnelles ne seront pas conservées.
                </p>
              </div>
            </div>
          )}

          {/* Enhanced map and building selection */}
          {showMap && buildings.length > 0 && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              {/* Map section with improved styling */}
              <div className="relative overflow-hidden rounded-2xl border border-blue-200 dark:border-blue-700 shadow-lg">
                <BuildingMapSection />
              </div>

              {/* Enhanced building details */}
              <div className="transform transition-all duration-300 hover:scale-[1.01]">
                <SelectedBuildingDetails />
              </div>

              {/* Enhanced continue button */}
              <div className="flex justify-center pt-4">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
                  <ContinueButton />
                </div>
              </div>
            </div>
          )}

          <PrivacyNotice />
        </div>
      </div>

      {/* Only show the search button when map is not displayed */}
      {!showMap && (
        <StepButtons
          onPrev={prevStep}
          nextLabel="Rechercher la surface de mon toit"
          onNext={() => handleSearch()}
          nextDisabled={!address.trim() || isSearching}
        />
      )}

      {/* When map is displayed, only show the Previous button */}
      {showMap && buildings.length > 0 && (
        <div className="flex justify-start">
          <button
            onClick={prevStep}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Précédent
          </button>
        </div>
      )}
    </div>
  )
}

export default function AddressSearchContainer({ data, updateData, nextStep, prevStep }: AddressInputProps) {
  const handlePrev = () => {
    if (prevStep) prevStep()
  }

  return (
    <AddressSearchProvider data={data} updateData={updateData} nextStep={nextStep} prevStep={prevStep}>
      <AddressSearchContent />
    </AddressSearchProvider>
  )
}
