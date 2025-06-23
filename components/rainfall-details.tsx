"use client"
import { useEffect, useState, useCallback } from "react"
import type React from "react"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Droplets, CloudRain, Snowflake, BarChart2, TableIcon, ChevronDown, ChevronUp } from "lucide-react"
import MonthlyRainfallChart from "./rainfall-charts/monthly-rainfall-chart"
import CumulativeRainfallChart from "./rainfall-charts/cumulative-rainfall-chart"
import PrecipitationCompositionChart from "./rainfall-charts/precipitation-composition-chart"
import RainfallDataTable from "./rainfall-charts/rainfall-data-table"
import type { DetailedPluviometryData } from "@/lib/pluvioService"
import { getDetailedPluviometryData } from "@/lib/pluvioService"
import type { SimulatorData } from "./rainwater-simulator"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

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
  const [isExpanded, setIsExpanded] = useState(true)

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

  const toggleExpand = () => {
    setIsExpanded(!isExpanded)
  }

  return (
    <Card className={className}>
      <CardContent className="p-4 md:p-6">
        <div className="flex justify-between items-center mb-4 md:mb-6">
          <h3 className="text-xl font-semibold text-blue-800 dark:text-blue-300">Détails des précipitations</h3>
          <Button variant="ghost" size="sm" onClick={toggleExpand} className="text-blue-600 dark:text-blue-400">
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Masquer les détails</span>
                <span className="sm:hidden">Réduire</span>
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Voir les détails</span>
                <span className="sm:hidden">Voir plus</span>
              </>
            )}
          </Button>
        </div>

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

        {/* Tabs - always visible */}
        <Tabs defaultValue="monthly" className="w-full">
          <TabsList className="w-full justify-start mb-4 bg-slate-100 dark:bg-slate-800 overflow-x-auto">
            <TabsTrigger value="monthly" className="flex items-center gap-2">
              <BarChart2 className="h-4 w-4" />
              <span className="hidden sm:inline">Précipitations</span> mensuelles
            </TabsTrigger>
            <TabsTrigger value="cumulative" className="flex items-center gap-2">
              <Droplets className="h-4 w-4" />
              <span className="hidden sm:inline">Précipitations</span> cumulées
            </TabsTrigger>
            <TabsTrigger value="composition" className="flex items-center gap-2">
              <CloudRain className="h-4 w-4" />
              Composition
            </TabsTrigger>
            <TabsTrigger value="table" className="flex items-center gap-2">
              <TableIcon className="h-4 w-4" />
              Tableau
            </TabsTrigger>
          </TabsList>

          {/* Create a grid container for stacking all TabsContent components */}
          <div className="grid grid-cols-1 grid-rows-1 w-full">
            <TabsContent value="monthly" className="mt-4" forceMount>
              <MonthlyRainfallChart data={rainfallData.monthlyData} />
            </TabsContent>

            <TabsContent value="cumulative" className="mt-4" forceMount>
              <CumulativeRainfallChart data={rainfallData.monthlyData} />
            </TabsContent>

            <TabsContent value="composition" className="mt-4" forceMount>
              <PrecipitationCompositionChart rain={rainfallData.totalRain} snow={rainfallData.totalSnow} />
            </TabsContent>

            <TabsContent value="table" className="mt-4" forceMount>
              <RainfallDataTable data={rainfallData.monthlyData} />
            </TabsContent>
          </div>
        </Tabs>

        {/* Source information - collapsible */}
        <motion.div
          initial={false}
          animate={{
            height: isExpanded ? "auto" : "0px",
            opacity: isExpanded ? 1 : 0,
            marginBottom: isExpanded ? "1rem" : "0",
          }}
          transition={{
            height: { duration: 0.3, ease: "easeInOut" },
            opacity: { duration: 0.2, ease: "easeInOut" },
          }}
          className="overflow-hidden mt-4"
        >
          <div className="text-xs text-slate-500 dark:text-slate-400 italic">
            Source:{" "}
            {dataSource === "USER_INPUT"
              ? "Données saisies manuellement."
              : "Open-Meteo API. Les données sont basées sur des prévisions et peuvent varier."}
          </div>
        </motion.div>
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
