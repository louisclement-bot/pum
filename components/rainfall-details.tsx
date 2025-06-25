"use client"
import { useEffect, useState, useCallback } from "react"
import type React from "react"

import { Card, CardContent } from "@/components/ui/card"
import { Droplets, CloudRain, Snowflake } from "lucide-react"
import type { DetailedPluviometryData } from "@/lib/pluvioService"
import { getDetailedPluviometryData } from "@/lib/pluvioService"
import type { SimulatorData } from "../rainwater-simulator"

interface RainfallDetailsProps {
  data: SimulatorData
  className?: string
}

export default function RainfallDetails({ data, className = "" }: RainfallDetailsProps) {
  const [rainfallData, setRainfallData] = useState<DetailedPluviometryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [dataSource, setDataSource] = useState<string>("unknown")

  // Function to fetch rainfall data with retry logic
  const fetchRainfallData = useCallback(async () => {
    // First, check if we already have detailed precipitation data
    if (data.detailedPrecipitationData) {
      console.log("[DATA SOURCE] Using stored detailed precipitation data from previous step")
      setRainfallData({
        dailyData: [], // We don't store daily data in SimulatorData
        monthlyData: data.detailedPrecipitationData.monthlyData,
        totalPrecipitation: data.detailedPrecipitationData.totalPrecipitation,
        totalRain: data.detailedPrecipitationData.totalRain,
        totalSnow: data.detailedPrecipitationData.totalSnow,
        source: data.detailedPrecipitationData.source as any,
        period: data.detailedPrecipitationData.period,
      })
      setDataSource(data.detailedPrecipitationData.source)
      setLoading(false)
      return
    }

    // Skip if we don't have coordinates
    if (!data.latitude || !data.longitude) {
      console.log("[DATA SOURCE] No coordinates available for fetching precipitation data")
      setError("Coordonnées géographiques non disponibles")
      setLoading(false)
      return
    }

    try {
      console.log(
        `[DATA SOURCE] Fetching detailed precipitation data from OpenMeteo API (attempt ${retryCount + 1})...`,
      )
      setLoading(true)

      const detailedData = await getDetailedPluviometryData(data.latitude, data.longitude)

      if (detailedData && detailedData.monthlyData && detailedData.monthlyData.length > 0) {
        console.log("[DATA SOURCE] Successfully retrieved detailed rainfall data from OpenMeteo API:", {
          totalPrecipitation: detailedData.totalPrecipitation,
          monthlyDataCount: detailedData.monthlyData.length,
          source: detailedData.source,
        })
        setRainfallData(detailedData)
        setDataSource(detailedData.source)
        setError(null)
      } else {
        throw new Error("Les données de précipitations sont incomplètes ou invalides")
      }
    } catch (err) {
      console.error("[DATA SOURCE] Error fetching detailed rainfall data from OpenMeteo API:", err)
      setError(
        `Erreur lors de la récupération des données de précipitations: ${err instanceof Error ? err.message : "Erreur inconnue"}`,
      )

      // Retry logic (max 3 attempts)
      if (retryCount < 2) {
        console.log(`[DATA SOURCE] Will retry OpenMeteo API in 2 seconds (attempt ${retryCount + 1}/3)`)
        setTimeout(() => {
          setRetryCount((prev) => prev + 1)
        }, 2000)
      }
    } finally {
      setLoading(false)
    }
  }, [data.latitude, data.longitude, data.detailedPrecipitationData, retryCount])

  // Effect to fetch data when coordinates change or on retry
  useEffect(() => {
    fetchRainfallData()
  }, [fetchRainfallData])

  // Format numbers for display
  const formatNumber = (num: number | undefined, decimals = 0) => {
    if (num === undefined) return "0"
    return num.toLocaleString("fr-FR", {
      maximumFractionDigits: decimals,
      minimumFractionDigits: decimals,
    })
  }

  // If loading, show loading state
  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500"></div>
            <p className="mt-4 text-sm text-slate-500">
              Chargement des données de précipitations{retryCount > 0 ? ` (tentative ${retryCount + 1}/3)` : ""}...
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // If error and no data, don't display anything
  if (error && !rainfallData) {
    console.log("[DATA SOURCE] No rainfall data available to display due to error:", error)
    return null // Don't display the chart if there's an error and no data
  }

  // If no data, don't display anything
  if (!rainfallData || !rainfallData.monthlyData || rainfallData.monthlyData.length === 0) {
    console.log("[DATA SOURCE] No rainfall data available to display")
    return null
  }

  // Find wettest and driest months
  const wettestMonth = [...rainfallData.monthlyData].sort((a, b) => b.precipitation - a.precipitation)[0]
  const driestMonth = [...rainfallData.monthlyData].sort((a, b) => a.precipitation - b.precipitation)[0]

  return (
    <Card className={className}>
      <CardContent className="p-4 md:p-6">
        <h3 className="text-xl font-semibold text-blue-800 dark:text-blue-300 mb-4 md:mb-6">
          Détails des précipitations
        </h3>

        {/* Stat cards - always visible */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatCard
            icon={<Droplets className="h-5 w-5 text-blue-500" />}
            title="Précipitations totales"
            value={`${formatNumber(rainfallData.totalPrecipitation, 1)} mm`}
          />
          <StatCard
            icon={<CloudRain className="h-5 w-5 text-blue-500" />}
            title="Mois le plus pluvieux"
            value={`${wettestMonth.month} (${formatNumber(wettestMonth.precipitation, 1)} mm)`}
          />
          <StatCard
            icon={<Snowflake className="h-5 w-5 text-blue-500" />}
            title="Mois le plus sec"
            value={`${driestMonth.month} (${formatNumber(driestMonth.precipitation, 1)} mm)`}
          />
        </div>
      </CardContent>
    </Card>
  )
}

interface StatCardProps {
  icon: React.ReactNode
  title: string
  value: string
}

function StatCard({ icon, title, value }: StatCardProps) {
  return (
    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 flex items-start gap-3">
      <div className="mt-1 bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">{icon}</div>
      <div>
        <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</h4>
        <p className="text-lg font-semibold text-slate-900 dark:text-slate-100 mt-1">{value}</p>
      </div>
    </div>
  )
}
