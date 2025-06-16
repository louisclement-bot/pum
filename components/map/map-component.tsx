"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import type { BuildingMapProps } from "./types"
import {
  initializeTurf,
  prepareMapCenter,
  validateGeoJSON,
  transformGeoJSON,
  validateFrenchCoordinates,
} from "./turf-utils"

// We need to create a client-side only component for the map
// that properly loads Leaflet and its dependencies
export const MapComponent = ({ buildings, center, onBuildingSelect, className = "", onError }: BuildingMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<any>(null)
  const [isMapReady, setIsMapReady] = useState<boolean>(false)
  const geoJsonLayersRef = useRef<Record<string, any>>({})
  const [mapError, setMapError] = useState<string | null>(null)
  const [isTurfLoading, setIsTurfLoading] = useState<boolean>(true)
  const previousCenter = useRef<[number, number] | null>(null)
  const selectedBuildingRef = useRef<string | null>(null)

  // Find the currently selected building ID
  useEffect(() => {
    const selectedBuilding = buildings?.find((b) => b.is_selected)
    if (selectedBuilding?.building_id) {
      selectedBuildingRef.current = selectedBuilding.building_id
    }
  }, [buildings])

  // Initialize Turf.js
  useEffect(() => {
    if (typeof window === "undefined") return

    setIsTurfLoading(true)
    console.log("Initializing Turf.js...")

    try {
      const success = initializeTurf()
      if (success) {
        console.log("Turf.js initialized successfully")
      } else {
        console.warn("Turf.js initialization failed, will use fallback methods")
      }
    } catch (error) {
      console.error("Error initializing Turf.js:", error)
    } finally {
      setIsTurfLoading(false)
    }
  }, [])

  // Load Leaflet CSS
  useEffect(() => {
    if (typeof window === "undefined") return

    // Add Leaflet CSS if not already present
    if (!document.querySelector('link[href*="leaflet.css"]')) {
      const link = document.createElement("link")
      link.rel = "stylesheet"
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
      link.crossOrigin = ""
      document.head.appendChild(link)
    }
  }, [])

  // Handle building selection
  const handleBuildingSelect = useCallback(
    (buildingId: string) => {
      console.log(`Building selected: ${buildingId}`)
      selectedBuildingRef.current = buildingId

      if (onBuildingSelect) {
        onBuildingSelect(buildingId)
      }
    },
    [onBuildingSelect],
  )

  // Initialize the map
  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current || map) return

    // Wait for Turf.js loading to complete (or fail) before initializing the map
    if (isTurfLoading) {
      console.log("Waiting for Turf.js to initialize before creating map...")
      return
    }

    // Import Leaflet dynamically
    import("leaflet").then((L) => {
      // Fix the default icon issue
      delete L.Icon.Default.prototype._getIconUrl
      L.Icon.Default.mergeOptions({
        iconUrl: "/leaflet/marker-icon.png",
        iconRetinaUrl: "/leaflet/marker-icon-2x.png",
        shadowUrl: "/leaflet/marker-shadow.png",
      })

      // Create map with a small delay to ensure the container is ready
      setTimeout(() => {
        try {
          console.log("Initializing map with center:", center)

          // Validate center coordinates
          if (!center || !Array.isArray(center) || center.length !== 2) {
            console.error("Invalid center coordinates:", center)
            setMapError("Invalid map center coordinates")
            if (onError) onError()
            return
          }

          // Validate if coordinates are likely in France
          if (!validateFrenchCoordinates(center)) {
            console.warn("Coordinates may not be in France:", center)
            // Continue anyway, but log the warning
          }

          // Prepare center coordinates for Leaflet
          const mapCenter = prepareMapCenter(center)
          console.log("Prepared center coordinates for Leaflet:", mapCenter)

          // Create the map instance
          const mapInstance = L.map(mapRef.current, {
            center: mapCenter,
            zoom: 18,
          })

          // Add the tile layer
          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
          }).addTo(mapInstance)

          // Add marker for the address point
          const marker = L.marker(mapCenter).addTo(mapInstance)
          marker.bindPopup("Point d'adresse")

          // Add a coordinates display for debugging
          const CoordinatesControl = L.Control.extend({
            options: {
              position: "bottomleft",
            },
            onAdd: function () {
              const container = L.DomUtil.create("div", "leaflet-bar leaflet-control leaflet-control-coordinates")
              container.style.backgroundColor = "white"
              container.style.padding = "5px"
              container.style.fontSize = "12px"
              container.style.border = "2px solid rgba(0,0,0,0.2)"
              container.style.borderRadius = "4px"
              this._container = container
              mapInstance.on("mousemove", this._updateCoordinates, this)
              return container
            },
            onRemove: function () {
              mapInstance.off("mousemove", this._updateCoordinates, this)
            },
            _updateCoordinates: function (e: any) {
              this._container.innerHTML = `Lat: ${e.latlng.lat.toFixed(6)}, Lng: ${e.latlng.lng.toFixed(6)}`
            },
          })

          // Add the coordinates control to the map
          new CoordinatesControl().addTo(mapInstance)

          setMap(mapInstance)
          setIsMapReady(true)
        } catch (error: any) {
          console.error("Error initializing map:", error)
          setMapError(`Error initializing map: ${error.message}`)
          if (onError) onError()
        }
      }, 100)
    })

    return () => {
      if (map) {
        map.remove()
        setMap(null)
        setIsMapReady(false)
      }
    }
  }, [center, map, onError, isTurfLoading])

  // Add GeoJSON layers to the map
  useEffect(() => {
    if (!map || !isMapReady || !buildings || buildings.length === 0) {
      console.log("Map not ready or no buildings to display")
      return
    }

    console.log("Updating buildings on map:", buildings.length)

    // Import Leaflet again to ensure it's available
    import("leaflet").then((L) => {
      // Mettre à jour les styles des couches existantes
      buildings.forEach((building) => {
        if (!building.building_id) return

        const layer = geoJsonLayersRef.current[building.building_id]

        if (layer && map.hasLayer(layer)) {
          // Mettre à jour le style sans supprimer la couche
          layer.setStyle({
            fillColor: building.is_selected ? "#1d40af" : "#3b82f6",
            weight: building.is_selected ? 3 : 1,
            opacity: 1,
            color: building.is_selected ? "#1d40af" : "#3b82f6",
            fillOpacity: building.is_selected ? 0.7 : 0.4,
          })

          // Mettre à jour le popup si nécessaire
          layer.getPopup()?.setContent(`
          <div>
            <strong>${building.label || "Bâtiment"}</strong>
            ${building.roof_surface_m2 ? `<br>Surface: ${building.roof_surface_m2} m²` : ""}
            <br><button class="select-building-btn" data-id="${building.building_id}" 
            style="background-color: #1d40af; color: white; padding: 4px 8px; border-radius: 4px; 
            border: none; margin-top: 8px; cursor: pointer;">
            ${building.is_selected ? "Sélectionné" : "Sélectionner"}</button>
          </div>
        `)

          return // Couche déjà existante, mise à jour terminée
        }

        // Si la couche n'existe pas, l'ajouter
        if (!building.building_geojson) return

        // Valider et transformer le GeoJSON
        if (!validateGeoJSON(building.building_geojson)) {
          console.error(`Invalid GeoJSON for building ${building.building_id}:`, building.building_geojson)
          return
        }

        const processedGeoJSON = transformGeoJSON(building.building_geojson)

        try {
          console.log(`Adding building ${building.building_id} to map`)

          const style = {
            fillColor: building.is_selected ? "#1d40af" : "#3b82f6",
            weight: building.is_selected ? 4 : 1,
            opacity: 1,
            color: building.is_selected ? "#1d40af" : "#3b82f6",
            fillOpacity: building.is_selected ? 0.7 : 0.4,
            dashArray: building.is_selected ? "" : "3",
          }

          const layer = L.geoJSON(processedGeoJSON, { style }).addTo(map)

          // Store the layer reference
          if (building.building_id) {
            geoJsonLayersRef.current[building.building_id] = layer
          }

          // Add popup
          layer.bindPopup(`
  <div style="min-width: 200px;">
    <div style="font-weight: bold; font-size: 14px; margin-bottom: 4px; color: #1d40af;">
      ${building.label || "Bâtiment"}
    </div>
    ${
      building.roof_surface_m2
        ? `<div style="margin-bottom: 8px;">
        <strong>Surface:</strong> ${building.roof_surface_m2.toLocaleString("fr-FR")} m²
      </div>`
        : ""
    }
    ${
      building.building_id_source
        ? `<div style="font-size: 12px; color: #666; margin-bottom: 8px;">
        Source: ${building.building_id_source}
      </div>`
        : ""
    }
    <button class="select-building-btn" data-id="${building.building_id}" 
      style="background-color: ${building.is_selected ? "#10b981" : "#1d40af"}; 
      color: white; padding: 6px 12px; border-radius: 4px; 
      border: none; margin-top: 4px; cursor: pointer; width: 100%;
      display: flex; align-items: center; justify-content: center;">
      ${
        building.is_selected
          ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style="margin-right: 4px;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> Sélectionné'
          : "Sélectionner"
      }
    </button>
  </div>
`)

          // Add click handler
          layer.on("click", () => {
            if (building.building_id) {
              handleBuildingSelect(building.building_id)
            }
          })

          // Handle popup open
          layer.on("popupopen", (e: any) => {
            // Add click handler to the select button
            const popup = e.popup
            const container = popup.getElement()
            if (container) {
              const btn = container.querySelector(".select-building-btn")
              if (btn) {
                btn.addEventListener("click", (e: any) => {
                  e.preventDefault()
                  const id = e.target.getAttribute("data-id")
                  if (id) {
                    handleBuildingSelect(id)
                    popup.close()
                  }
                })
              }
            }
          })
        } catch (error) {
          console.error(`Error adding GeoJSON layer for building ${building.building_id}:`, error)
        }
      })

      // Supprimer les couches qui ne sont plus présentes dans les données
      const currentBuildingIds = new Set(buildings.map((b) => b.building_id).filter(Boolean))
      Object.entries(geoJsonLayersRef.current).forEach(([id, layer]) => {
        if (!currentBuildingIds.has(id) && map.hasLayer(layer)) {
          map.removeLayer(layer)
          delete geoJsonLayersRef.current[id]
        }
      })
    })
  }, [map, isMapReady, buildings, handleBuildingSelect])

  // Update map view when center changes and map is ready
  useEffect(() => {
    if (!map || !isMapReady || !center) return

    // Toujours mettre à jour le centre de la carte lorsqu'il change
    try {
      // Validate if coordinates are likely in France
      if (!validateFrenchCoordinates(center)) {
        console.warn("Coordinates may not be in France:", center)
        // Continue anyway, but log the warning
      }

      // Prepare center coordinates for Leaflet
      const mapCenter = prepareMapCenter(center)

      // Use flyTo instead of setView for smoother transitions and better error handling
      console.log("Updating map view to:", mapCenter)
      map.flyTo(mapCenter, map.getZoom(), {
        animate: true,
        duration: 1,
      })

      // Stocker le centre actuel pour référence
      previousCenter.current = center
    } catch (error) {
      console.error("Error updating map view:", error)
    }
  }, [center, map, isMapReady])

  if (isTurfLoading) {
    return (
      <div
        className={`w-full h-[400px] rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center bg-gray-100 ${className}`}
      >
        <div className="text-gray-500 flex flex-col items-center">
          <svg
            className="animate-spin h-8 w-8 text-blue-500 mb-2"
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
          <div>Initialisation des outils géographiques...</div>
        </div>
      </div>
    )
  }

  if (mapError) {
    return (
      <div
        className={`w-full h-[400px] rounded-lg overflow-hidden border border-red-200 bg-red-50 flex items-center justify-center ${className}`}
      >
        <div className="text-red-500 p-4 text-center">
          <p className="font-bold mb-2">Erreur de carte</p>
          <p>{mapError}</p>
        </div>
      </div>
    )
  }

  return (
    <div ref={mapRef} className={`w-full h-[400px] rounded-lg overflow-hidden border border-gray-200 ${className}`} />
  )
}
