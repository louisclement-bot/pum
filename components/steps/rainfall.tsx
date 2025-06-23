"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import StepButtons from "../ui-elements/step-buttons"
import type { SimulatorData } from "../rainwater-simulator"
import { useState, useEffect } from "react"
import { CloudRain, MapPin, Search, Loader2, AlertCircle, Edit3 } from "lucide-react"
import { geocodeAddressViaBAN } from "@/lib/geocodeService"
import { getAverageAnnualPluviometry, getDetailedPluviometryData } from "@/lib/pluvioService"
import { fetchFinancialAids } from "@/lib/useFinancialAid"

type RainfallProps = {
  data: SimulatorData
  updateData: (data: Partial<SimulatorData>) => void
  nextStep: () => void
  prevStep: () => void
}

export default function Rainfall({ data, updateData, nextStep, prevStep }: RainfallProps) {
  const [rainfall, setRainfall] = useState<number>(data.annualRainfall || 0)
  const [postalCode, setPostalCode] = useState<string>(data.postalCode || "")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [manualInput, setManualInput] = useState<boolean>(false)
  const [manualRainfall, setManualRainfall] = useState<string>("")
  const [dataSource, setDataSource] = useState<string>("none")
  const [fetchingAids, setFetchingAids] = useState<boolean>(false)
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(
    data.latitude && data.longitude ? { latitude: data.latitude, longitude: data.longitude } : null,
  )

  // If we already have address data, fetch rainfall on component mount
  useEffect(() => {
    if (data.annualRainfall) {
      console.log("[DATA SOURCE] Using existing rainfall data:", data.annualRainfall)
      setRainfall(data.annualRainfall)
      setDataSource(data.rainfallDataSource || "existing")
    } else if ((data.postalCode || postalCode) && !data.annualRainfall) {
      fetchRainfall(data.postalCode || postalCode)
    }
  }, [data.postalCode, data.annualRainfall, data.rainfallDataSource])

  /**
   * Allow the user to reset postcode-related data so they can enter a new one.
   * Clears both the parent simulator state and this component's local state.
   */
  const handleModifyZipcode = () => {
    // 1. Reset data in parent
    updateData({
      city: undefined,
      postalCode: undefined,
      annualRainfall: undefined,
      latitude: undefined,
      longitude: undefined,
      rainfallDataSource: undefined,
      detailedPrecipitationData: undefined,
    })

    // 2. Reset local UI state
    setPostalCode("")
    setRainfall(0)
    setCoordinates(null)
    setDataSource("none")
    setError(null)
    setIsLoading(false)
    setManualInput(false)
  }

  const fetchRainfall = async (code: string) => {
    setIsLoading(true)
    setError(null)
    setManualInput(false)

    try {
      console.log("[DATA SOURCE] Attempting to fetch rainfall data for postal code:", code)

      // First, try to use existing coordinates if available
      if (data.latitude && data.longitude) {
        console.log("[DATA SOURCE] Using existing coordinates:", data.latitude, data.longitude)
        const pluviometryData = await getAverageAnnualPluviometry(data.latitude, data.longitude)
        const detailedData = await getDetailedPluviometryData(data.latitude, data.longitude)

        if (pluviometryData && pluviometryData.value) {
          console.log("[DATA SOURCE] Successfully retrieved pluviometry data from OpenMeteo API:", pluviometryData)
          setRainfall(Math.round(pluviometryData.value))
          setCoordinates({ latitude: data.latitude, longitude: data.longitude })
          setDataSource("OpenMeteo API")

          // Store detailed data if available
          if (detailedData) {
            console.log("[DATA SOURCE] Successfully retrieved detailed precipitation data from OpenMeteo API")
          }

          setIsLoading(false)
          return
        }
      }

      // If we have address data but no coordinates, try to geocode it
      if (data.address && data.city) {
        console.log("[DATA SOURCE] Using existing address data:", `${data.address}, ${data.postalCode} ${data.city}`)
        const geocodeResult = await geocodeAddressViaBAN(`${data.address}, ${data.postalCode} ${data.city}`)

        if (geocodeResult) {
          console.log("[DATA SOURCE] Successfully geocoded address:", geocodeResult)
          const { latitude, longitude } = geocodeResult
          setCoordinates({ latitude, longitude })

          const pluviometryData = await getAverageAnnualPluviometry(latitude, longitude)
          const detailedData = await getDetailedPluviometryData(latitude, longitude)

          if (pluviometryData && pluviometryData.value) {
            console.log("[DATA SOURCE] Successfully retrieved pluviometry data from OpenMeteo API:", pluviometryData)
            setRainfall(Math.round(pluviometryData.value))
            setDataSource("OpenMeteo API")

            // Store detailed data if available
            if (detailedData) {
              console.log("[DATA SOURCE] Successfully retrieved detailed precipitation data from OpenMeteo API")
            }

            setIsLoading(false)
            return
          }
        }
      }

      // If we only have postal code, try to geocode it
      console.log("[DATA SOURCE] Attempting to geocode postal code:", code)
      const geocodeResult = await geocodeAddressViaBAN(code)

      if (geocodeResult) {
        console.log("[DATA SOURCE] Successfully geocoded postal code:", geocodeResult)
        const { latitude, longitude, city } = geocodeResult
        setCoordinates({ latitude, longitude })

        // Update city if we got it from geocoding
        if (city && !data.city) {
          updateData({ city })
        }

        const pluviometryData = await getAverageAnnualPluviometry(latitude, longitude)
        const detailedData = await getDetailedPluviometryData(latitude, longitude)

        if (pluviometryData && pluviometryData.value) {
          console.log("[DATA SOURCE] Successfully retrieved pluviometry data from OpenMeteo API:", pluviometryData)
          setRainfall(Math.round(pluviometryData.value))
          setDataSource("OpenMeteo API")

          // Store detailed data if available
          if (detailedData) {
            console.log("[DATA SOURCE] Successfully retrieved detailed precipitation data from OpenMeteo API")
          }

          setIsLoading(false)
          return
        }
      }

      // If we couldn't get data, show manual input
      console.warn("[DATA SOURCE] Failed to retrieve rainfall data from OpenMeteo API. Showing manual input form.")
      setError("Nous n'avons pas pu récupérer les données de pluviométrie pour votre localisation.")
      setManualInput(true)
    } catch (error) {
      console.error("[DATA SOURCE] Error fetching rainfall data:", error)
      setError("Une erreur s'est produite lors de la récupération des données de pluviométrie.")
      setManualInput(true)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePostalCodeSearch = () => {
    if (postalCode) {
      fetchRainfall(postalCode)
    }
  }

  const handleManualInputSubmit = () => {
    const value = Number.parseFloat(manualRainfall)
    if (!isNaN(value) && value > 0) {
      console.log("[DATA SOURCE] Using manually entered rainfall data:", value)
      setRainfall(value)
      setDataSource("USER_INPUT")
      setError(null)
    } else {
      setError("Veuillez entrer une valeur numérique valide supérieure à 0.")
    }
  }

  const handleNext = async () => {
    // Prepare data update object
    const dataUpdate: Partial<SimulatorData> = {
      // If the local state has a value (> 0) use it, otherwise keep the one
      // already stored in the parent simulator state.
      annualRainfall: rainfall || data.annualRainfall,
      postalCode: postalCode || data.postalCode,
      rainfallDataSource: dataSource,
    }

    // Add coordinates if available
    if (coordinates) {
      dataUpdate.latitude = coordinates.latitude
      dataUpdate.longitude = coordinates.longitude

      // Try to fetch detailed precipitation data before proceeding
      try {
        const detailedData = await getDetailedPluviometryData(coordinates.latitude, coordinates.longitude)
        if (detailedData) {
          console.log("[DATA SOURCE] Storing detailed precipitation data from OpenMeteo API")
          dataUpdate.detailedPrecipitationData = {
            monthlyData: detailedData.monthlyData,
            totalPrecipitation: detailedData.totalPrecipitation,
            totalRain: detailedData.totalRain,
            totalSnow: detailedData.totalSnow,
            source: detailedData.source,
            period: detailedData.period,
          }
        }
      } catch (error) {
        console.error("[DATA SOURCE] Error fetching detailed precipitation data:", error)
      }
    }

    console.log("[DATA SOURCE] Updating SimulatorData with rainfall data source:", dataSource)
    
    /* ────────────────────────────────
     * Early-fetch financial aids
     * ──────────────────────────────── */
    try {
      setFetchingAids(true)
      // Always start with the postal code (Financial-Aid API will resolve INSEE internally)
      const aids = await fetchFinancialAids(dataUpdate.postalCode || data.postalCode)
      dataUpdate.financialAids = aids
      console.log("[AID_FETCH] Stored", aids.length, "financial aids into SimulatorData")
    } catch (e) {
      console.error("[AID_FETCH] Error while fetching financial aids:", e)
      dataUpdate.financialAids = [] // Store empty array on error
    } finally {
      setFetchingAids(false)
      updateData(dataUpdate)
      nextStep()
    }
  }

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-[#1D40AF] dark:text-blue-300 mb-3">
          Pluviométrie annuelle dans votre région
        </h2>
        <p className="text-blue-600 dark:text-blue-400 max-w-2xl mx-auto text-sm md:text-base">
          Cette information est essentielle pour calculer la quantité d&apos;eau de pluie que vous pourrez récupérer.
        </p>
      </div>

      <div className="p-6 md:p-8 rounded-2xl shadow-md max-w-2xl mx-auto border border-blue-100 dark:border-blue-800 bg-white dark:bg-slate-800">
        <div className="flex items-center justify-center mb-8">
          <div className="bg-blue-100 dark:bg-blue-800/50 p-4 rounded-full">
            <CloudRain className="h-8 w-8 md:h-10 md:w-10 text-[#1D40AF] dark:text-blue-400" />
          </div>
        </div>

        {!manualInput && data.city && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 md:p-6 rounded-xl border border-blue-100 dark:border-blue-800 flex items-center justify-between mb-8">
            <div className="bg-blue-100 dark:bg-blue-800/50 p-2 rounded-full mr-3">
              <MapPin className="h-5 w-5 text-[#1D40AF] dark:text-blue-400" />
            </div>
            <div className="flex-grow">
              <p className="text-[#1D40AF] dark:text-blue-300 font-medium">
                Basé sur votre adresse à <span className="font-bold">{data.city}</span>
              </p>
              {/* Button to allow user to change the postcode */}
              <Button
                variant="link"
                onClick={handleModifyZipcode}
                className="mt-2 text-blue-600 dark:text-blue-400 text-sm p-0 h-auto"
              >
                Modifier votre code postal
              </Button>
            </div>
          </div>
        )}

        {!manualInput && !data.city && (
          <div className="space-y-4 max-w-md mx-auto mb-8">
            <div className="space-y-2">
              <Label htmlFor="postal-code" className="text-[#1D40AF] dark:text-blue-300 font-medium">
                Veuillez saisir votre code postal
              </Label>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Input
                    id="postal-code"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="75001"
                    className="h-12 text-base border-blue-200 dark:border-blue-800 focus:border-[#1D40AF] dark:focus:border-blue-500 rounded-xl pr-10"
                    disabled={isLoading}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && postalCode.trim()) {
                        handlePostalCodeSearch()
                      }
                    }}
                  />
                </div>
                <Button
                  onClick={handlePostalCodeSearch}
                  disabled={!postalCode || isLoading}
                  className="h-12 px-5 rounded-xl bg-[#1D40AF] hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white shadow-md hover:shadow-lg transition-all duration-300"
                >
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
                </Button>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-amber-50 dark:bg-amber-900/20 p-4 md:p-6 rounded-xl border border-amber-200 dark:border-amber-800 flex items-start mb-8">
            <div className="bg-amber-100 dark:bg-amber-800/50 p-2 rounded-full mr-3 shrink-0">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-amber-700 dark:text-amber-300 font-medium">{error}</p>
              {manualInput && (
                <p className="text-amber-600 dark:text-amber-400 text-sm mt-1">
                  Vous pouvez saisir manuellement la pluviométrie moyenne annuelle de votre région.
                </p>
              )}
            </div>
          </div>
        )}

        {manualInput && (
          <>
            <div className="text-center mb-4">
              <Button
                variant="link"
                onClick={() => {
                  setManualInput(false)
                  setError(null)
                  // If postalCode or data.city exists, useEffect will trigger refetch
                }}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                {data.city || postalCode ? "Utiliser la recherche automatique" : "Rechercher par code postal"}
              </Button>
            </div>
            <div className="space-y-4 max-w-md mx-auto mb-8">
              <div className="space-y-2">
                <Label htmlFor="manual-rainfall" className="text-[#1D40AF] dark:text-blue-300 font-medium">
                  Pluviométrie moyenne annuelle (mm/an)
                </Label>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Input
                      id="manual-rainfall"
                      value={manualRainfall}
                      onChange={(e) => setManualRainfall(e.target.value)}
                      placeholder="800"
                      type="number"
                      min="0"
                      className="h-12 text-base border-blue-200 dark:border-blue-800 focus:border-[#1D40AF] dark:focus:border-blue-500 rounded-xl pr-10"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleManualInputSubmit()
                        }
                      }}
                    />
                  </div>
                  <Button
                    onClick={handleManualInputSubmit}
                    className="h-12 px-5 rounded-xl bg-[#1D40AF] hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    <Edit3 className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}

        {!manualInput && (
          <div className="text-center p-6 md:p-8 bg-gradient-to-b from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl border border-blue-100 dark:border-blue-800">
            {isLoading ? (
              <div className="py-8">
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-[#1D40AF] dark:text-blue-400 mb-4" />
                <p className="text-[#1D40AF] dark:text-blue-300 font-medium">Récupération des données...</p>
              </div>
            ) : rainfall > 0 ? (
              <>
                <div className="text-5xl md:text-6xl font-bold text-[#1D40AF] dark:text-blue-400 mb-3">
                  {rainfall} <span className="text-3xl md:text-4xl">mm/an</span>
                </div>
                <p className="text-blue-600 dark:text-blue-400 font-medium">Pluviométrie moyenne annuelle</p>
                {dataSource === "USER_INPUT" && (
                  <div className="mt-2 text-xs text-amber-600 dark:text-amber-400">Données saisies manuellement</div>
                )}
                {dataSource === "OpenMeteo API" && (
                  <div className="mt-2 text-xs text-green-600 dark:text-green-400">
                    Données météo réelles (Open-Meteo)
                  </div>
                )}
                <Button
                  onClick={() => {
                    setManualInput(true)
                    if (rainfall > 0 && dataSource !== "USER_INPUT") {
                      setManualRainfall(rainfall.toString())
                    } else {
                      setManualRainfall("")
                    }
                    setError(null)
                  }}
                  variant="link"
                  className="mt-4 text-blue-600 dark:text-blue-400"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Modifier manuellement
                </Button>
              </>
            ) : (
              <div className="py-8">
                <p className="text-[#1D40AF] dark:text-blue-300 font-medium">
                  Veuillez saisir votre code postal pour obtenir les données de pluviométrie.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-sm text-blue-600 dark:text-blue-400 italic">
            {dataSource === "USER_INPUT"
              ? "Ces données ont été saisies manuellement."
              : dataSource === "OpenMeteo API"
                ? "Ces données sont basées sur les prévisions météorologiques d'Open-Meteo."
                : "Ces données sont basées sur les moyennes historiques de précipitations dans votre région."}
          </p>
        </div>
      </div>

      <StepButtons
        onNext={handleNext}
        onPrev={prevStep}
        /* Disable only if neither local nor parent rainfall is valid */
        nextDisabled={
          ((!rainfall || rainfall <= 0) && (!data.annualRainfall || data.annualRainfall <= 0))
          || fetchingAids
        }
        nextLabel={fetchingAids ? "Recherche des aides…" : "Continuer"}
      />
    </div>
  )
}
