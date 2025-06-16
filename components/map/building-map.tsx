"use client"

import { useEffect, useState } from "react"
import { MapComponent } from "./map-component"
import type { BuildingMapProps } from "./types"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

// Export the component
export default function BuildingMap(props: BuildingMapProps) {
  // Only render the map component on the client side
  const [isMounted, setIsMounted] = useState(false)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    return () => setIsMounted(false)
  }, [])

  const handleError = () => {
    console.error("Map error occurred")
    setHasError(true)
    if (props.onError) {
      props.onError()
    }
  }

  const handleRetry = () => {
    setHasError(false)
  }

  if (!isMounted) {
    return (
      <div
        className={`w-full h-[400px] rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center bg-gray-100 ${props.className}`}
      >
        <div className="text-gray-500">Chargement de la carte...</div>
      </div>
    )
  }

  if (hasError) {
    return (
      <div className={`w-full h-[400px] rounded-lg overflow-hidden border border-red-200 ${props.className}`}>
        <Alert variant="destructive" className="h-full flex flex-col justify-center">
          <AlertCircle className="h-6 w-6" />
          <AlertTitle>Erreur de carte</AlertTitle>
          <AlertDescription>
            Impossible de charger la carte. Veuillez vérifier votre connexion et réessayer.
          </AlertDescription>
          <Button onClick={handleRetry} variant="outline" className="mt-4 mx-auto">
            <RefreshCw className="mr-2 h-4 w-4" />
            Réessayer
          </Button>
        </Alert>
      </div>
    )
  }

  return <MapComponent {...props} onError={handleError} />
}
