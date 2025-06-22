"use client"

import type React from "react"
import { createContext, useContext, useState, useRef, useCallback, useMemo } from "react"
import type { AddressSearchState, AddressSuggestion, AddressInputProps } from "../types/addressTypes"
import { searchAddressByText, selectBuilding } from "../services/addressSearchService"
import { fetchRoofDetails } from "../services/roofDetailsService"
import { useSingleFlight } from "@/lib/useSingleFlight"

// Create the context
const AddressSearchContext = createContext<AddressSearchContextType | undefined>(undefined)

// Initial state
const initialState: AddressSearchState = {
  address: "",
  selectedSuggestion: null,
  isSearching: false,
  error: null,
  buildings: [],
  mapCenter: null,
  selectedBuildingId: null,
  showMap: false,
  mapError: false,
  apiResponse: null,
  roofDetails: null,
}

export type AddressSearchContextType = {
  state: AddressSearchState
  updateState: (updates: Partial<AddressSearchState>) => void
  handleSearch: (suggestionOverride?: AddressSuggestion) => Promise<void>
  handleBuildingSelect: (buildingId: string) => Promise<void>
  handleRetryMap: () => void
  handleContinue: () => void
  handleAddressSelect: (suggestion: AddressSuggestion) => void
  prevStep: () => void
  isBusy: () => boolean
}

// Provider component
export function AddressSearchProvider({
  children,
  data,
  updateData,
  nextStep,
  prevStep,
}: {
  children: React.ReactNode
  data: AddressInputProps["data"]
  updateData: AddressInputProps["updateData"]
  nextStep: AddressInputProps["nextStep"]
  prevStep: AddressInputProps["prevStep"]
}) {
  const [state, setState] = useState<AddressSearchState>({
    ...initialState,
    address: data.address || "",
  })

  // Reference to store the current processing address
  const processingAddressRef = useRef<AddressSuggestion | null>(null)

  // Update state function
  const updateState = useCallback((updates: Partial<AddressSearchState>) => {
    setState((prevState) => ({ ...prevState, ...updates }))
  }, [])

  // Handle address search
  const handleSearch = useCallback(
    async (suggestionOverride?: AddressSuggestion) => {
      // Use either the provided suggestion or the one in state
      const suggestionToUse = suggestionOverride || state.selectedSuggestion

      // If no suggestion is available but we have an address, proceed with manual search
      if (!suggestionToUse && state.address.trim()) {
        console.log("Performing search with manually entered address:", state.address)
      }

      if (!state.address.trim()) {
        updateState({ error: "Veuillez saisir une adresse valide" })
        return
      }

      // Reset state for new search
      updateState({
        error: null,
        isSearching: true,
        showMap: false,
        buildings: [],
        mapCenter: null,
        mapError: false,
        apiResponse: null,
        roofDetails: null,
        selectedBuildingId: null, // Reset selected building
      })

      // Store the suggestion being processed
      processingAddressRef.current = suggestionToUse

      try {
        // Prepare options for the API call
        const options: any = {}
        if (suggestionToUse) {
          options.coordinates = suggestionToUse.coordinates
          options.banId = suggestionToUse.id
          options.city = suggestionToUse.city
          options.postcode = suggestionToUse.postcode
          options.citycode = suggestionToUse.citycode
          options.useExactAddress = true
        }

        // Call the API
        const apiData = await searchAddressByText(state.address, options)

        // Check if the address changed during processing
        if (processingAddressRef.current !== suggestionToUse) {
          console.log("Address changed during processing, discarding results")
          updateState({ isSearching: false })
          return
        }

        // Process the API response
        if (apiData.buildings && apiData.buildings.length > 0) {
          // Update state with the API response
          updateState({
            buildings: apiData.buildings,
            selectedBuildingId: apiData.selected_building_id,
            apiResponse: apiData,
            isSearching: false,
          })

          // Set map center if available
          if (apiData.map_center) {
            updateState({
              mapCenter: apiData.map_center,
              showMap: true,
            })
          } else {
            updateState({
              error: "Impossible d'afficher la carte: coordonnées manquantes",
            })
          }

          // Fetch roof details if available
          const selectedBuilding = apiData.buildings.find((b: any) => b.is_selected)
          if (selectedBuilding && selectedBuilding.rnb_id) {
            const roofDetails = await fetchRoofDetails(selectedBuilding.rnb_id)
            updateState({ roofDetails })
          }
        } else {
          updateState({
            error: "Aucun bâtiment trouvé à cette adresse",
            isSearching: false,
          })
        }
      } catch (error) {
        console.error("Error fetching address data:", error)
        updateState({
          error: error instanceof Error ? error.message : "Une erreur est survenue lors de la recherche",
          isSearching: false,
        })
      }
    },
    [state.address, state.selectedSuggestion, updateState],
  )

  // Handle building selection - FIXED LOGIC
  const handleBuildingSelect = useCallback(
    async (buildingId: string) => {
      console.log("Building selected:", buildingId)
      updateState({ isSearching: true })

      try {
        // Update buildings locally first for better UX
        const updatedBuildings = state.buildings.map((building) => ({
          ...building,
          is_selected: building.building_id === buildingId,
        }))

        // Make sure to update both the selectedBuildingId and is_selected property
        updateState({
          buildings: updatedBuildings,
          selectedBuildingId: buildingId,
          error: null, // Clear any previous errors
        })

        console.log("Updated state with selected building:", buildingId)

        // Fetch roof details for the selected building
        const selectedBuilding = updatedBuildings.find((b) => b.building_id === buildingId)
        if (selectedBuilding && selectedBuilding.rnb_id) {
          const roofDetails = await fetchRoofDetails(selectedBuilding.rnb_id)
          updateState({ roofDetails })
        } else {
          updateState({ roofDetails: null })
        }

        // Update the API in the background
        const options: any = {}
        if (processingAddressRef.current) {
          options.banId = processingAddressRef.current.id
          options.city = processingAddressRef.current.city
          options.postcode = processingAddressRef.current.postcode
          options.citycode = processingAddressRef.current.citycode
          options.useExactAddress = true
        }
        if (state.mapCenter) {
          options.coordinates = state.mapCenter
        }

        // Call the API to update the selection
        await selectBuilding(state.address, buildingId, options)

        updateState({ isSearching: false })
      } catch (error) {
        console.error("Error selecting building:", error)
        updateState({
          error: error instanceof Error ? error.message : "Une erreur est survenue lors de la sélection du bâtiment",
          isSearching: false,
        })
      }
    },
    [state.buildings, state.address, state.mapCenter, updateState],
  )

  // Handle map retry
  const handleRetryMap = useCallback(() => {
    updateState({ mapError: false })
    // Force re-render of the map by toggling showMap
    updateState({ showMap: false })
    setTimeout(() => updateState({ showMap: true }), 100)
  }, [updateState])

  // Handle continue button - ENHANCED WITH DEBUGGING AND PROTECTED WITH SINGELFLIGHT
  const _handleContinueImpl = useCallback(() => {
    console.log("Continue button clicked")
    console.log("Current state:", {
      selectedBuildingId: state.selectedBuildingId,
      buildings: state.buildings,
      hasSelectedBuilding: state.buildings.some((b) => b.is_selected),
    })

    if (!state.selectedBuildingId || state.buildings.length === 0) {
      console.log("No building selected or no buildings available")
      updateState({ error: "Veuillez sélectionner un bâtiment" })

      // Add visual feedback
      const errorMessage = document.querySelector(".error-message")
      if (errorMessage) {
        errorMessage.classList.add("shake")
        setTimeout(() => errorMessage.classList.remove("shake"), 500)
      }
      return
    }

    // Find the selected building
    const selectedBuilding = state.buildings.find((b) => b.is_selected)
    if (!selectedBuilding) {
      console.log("Selected building not found in buildings array")
      updateState({ error: "Bâtiment sélectionné introuvable" })
      return
    }

    console.log("Selected building found:", selectedBuilding)

    // Get the geocoded address from the API response
    const geocodedAddress = state.apiResponse?.geocoded_address || {}

    // Get coordinates from the map center or the geocoded address
    const latitude = state.mapCenter ? state.mapCenter[1] : geocodedAddress.latitude || null
    const longitude = state.mapCenter ? state.mapCenter[0] : geocodedAddress.longitude || null

    console.log("Storing coordinates in SimulatorData:", { latitude, longitude })

    // Update the data with the retrieved information
    updateData({
      address: state.address,
      roofSurface: selectedBuilding.roof_surface_m2 || 0,
      postalCode: geocodedAddress.postcode || processingAddressRef.current?.postcode || "",
      city: geocodedAddress.city || processingAddressRef.current?.city || state.address.split(",").pop()?.trim(),
      citycode: geocodedAddress.citycode || processingAddressRef.current?.citycode,
      annualRainfall: state.apiResponse?.average_annual_pluviometry_mm_per_year || null,
      latitude: latitude,
      longitude: longitude,
    })

    console.log("Data updated, navigating to next step")
    nextStep()
  }, [state.selectedBuildingId, state.buildings, state.apiResponse, state.mapCenter, state.address, updateState, updateData, nextStep])

  // Create a protected version with useSingleFlight
  const [handleContinue, isBusy] = useSingleFlight(_handleContinueImpl)

  // Handle address selection from autocomplete - PROTECTED WITH SINGELFLIGHT
  const handleAddressSelectImpl = useCallback(
    (suggestion: AddressSuggestion) => {
      console.log("Address selected from autocomplete:", suggestion)

      // Update the address and selected suggestion
      updateState({
        address: suggestion.label,
        selectedSuggestion: suggestion,
      })

      // Trigger search with the selected suggestion directly (no setTimeout)
      handleSearch(suggestion)
    },
    [updateState, handleSearch],
  )

  // Protect with useSingleFlight
  const [handleAddressSelect, isAddressSelectBusy] = useSingleFlight(handleAddressSelectImpl)

  // Context value - ENSURE STABILITY WITH USEMEMO
  const contextValue: AddressSearchContextType = useMemo(
    () => ({
      state,
      updateState,
      handleSearch,
      handleBuildingSelect,
      handleRetryMap,
      handleContinue,
      handleAddressSelect,
      prevStep,
      isBusy,
    }),
    [
      state,
      updateState,
      handleSearch,
      handleBuildingSelect,
      handleRetryMap,
      handleContinue,
      handleAddressSelect,
      prevStep,
      isBusy,
    ],
  )

  return <AddressSearchContext.Provider value={contextValue}>{children}</AddressSearchContext.Provider>
}

// Custom hook to use the context
export function useAddressSearch() {
  const context = useContext(AddressSearchContext)
  if (context === undefined) {
    throw new Error("useAddressSearch must be used within an AddressSearchProvider")
  }
  return context
}
