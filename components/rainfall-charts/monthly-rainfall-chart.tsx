"use client"
import { useEffect, useState, useRef, ErrorInfo, Component } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import type { MonthlyPrecipitationData } from "@/lib/pluvioService"
import { useMediaQuery } from "@/hooks/use-media-query"
import { useTheme } from "next-themes"

// Error boundary to catch Recharts errors
class ChartErrorBoundary extends Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("🚨 Chart Error Boundary caught error:", error)
    console.error("Error details:", errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="border border-red-300 bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
          <p className="text-red-600 dark:text-red-400 font-medium">Chart Error:</p>
          <p className="text-sm text-red-500 dark:text-red-300">{this.state.error?.message || "Unknown error"}</p>
          {this.props.fallback}
        </div>
      )
    }
    return this.props.children
  }
}

interface MonthlyRainfallChartProps {
  data: MonthlyPrecipitationData[]
  className?: string
}

export default function MonthlyRainfallChart({ data, className = "" }: MonthlyRainfallChartProps) {
  console.log("🔍 MonthlyRainfallChart rendered with data:", {
    dataLength: data?.length || 0,
    firstItem: data?.[0] || "no data",
    allKeys: data?.[0] ? Object.keys(data[0]) : "no keys",
  })

  const [chartData, setChartData] = useState<any[]>([])
  const [maxValue, setMaxValue] = useState<number>(0)
  const [mounted, setMounted] = useState(false) // Helps with SSR / hydration issues
  const [debugInfo, setDebugInfo] = useState({
    containerWidth: 0,
    containerHeight: 0,
    dataProcessed: false,
    renderCount: 0,
    lastError: null as string | null,
  })
  const chartRef = useRef<HTMLDivElement>(null)
  const isMobile = useMediaQuery("(max-width: 640px)")
  const { theme } = useTheme()
  const isDark = theme === "dark"

  // Track render count for debugging
  useEffect(() => {
    setDebugInfo(prev => ({
      ...prev,
      renderCount: prev.renderCount + 1
    }))
  }, [])

  // mark mounted once we hit the client
  useEffect(() => {
    console.log("🔄 MonthlyRainfallChart: Setting mounted state to true")
    setMounted(true)
  }, [])

  // Track container dimensions
  useEffect(() => {
    if (!chartRef.current) return

    const updateDimensions = () => {
      if (chartRef.current) {
        const { width, height } = chartRef.current.getBoundingClientRect()
        console.log("📏 Chart container dimensions:", { width, height })
        setDebugInfo(prev => ({
          ...prev,
          containerWidth: width,
          containerHeight: height
        }))
      }
    }

    // Initial measurement
    updateDimensions()

    // Setup resize observer
    const resizeObserver = new ResizeObserver(() => {
      updateDimensions()
    })

    resizeObserver.observe(chartRef.current)

    return () => {
      if (chartRef.current) {
        resizeObserver.unobserve(chartRef.current)
      }
      resizeObserver.disconnect()
    }
  }, [mounted]) // Only run when mounted changes to avoid SSR issues

  // Process data when it changes
  useEffect(() => {
    try {
      if (!data || data.length === 0) {
        console.log("⚠️ MonthlyRainfallChart: No data to process")
        setDebugInfo(prev => ({
          ...prev,
          dataProcessed: false,
          lastError: "No data available"
        }))
        return
      }

      console.log("🔄 MonthlyRainfallChart: Processing data", { dataLength: data.length })

      // Format month names to be shorter for mobile
      const formattedData = data.map((item) => {
        const result = {
          ...item,
          shortMonth: item.month.substring(0, 3),
          // Ensure precipitation is a number
          precipitation: typeof item.precipitation === "number" ? item.precipitation : 0,
        }
        return result
      })

      // Find the maximum value for better chart scaling
      const max = Math.max(...formattedData.map((item) => item.precipitation))
      setMaxValue(max * 1.1) // Add 10% padding to the top

      setChartData(formattedData)
      setDebugInfo(prev => ({
        ...prev,
        dataProcessed: true,
        lastError: null
      }))

      console.log("✅ Monthly rainfall chart data processed:", {
        dataPoints: formattedData.length,
        maxValue: max,
        firstItem: formattedData[0],
        allProcessedData: formattedData,
      })
    } catch (error) {
      console.error("🚨 Error processing chart data:", error)
      setDebugInfo(prev => ({
        ...prev,
        dataProcessed: false,
        lastError: error instanceof Error ? error.message : "Unknown error processing data"
      }))
    }
  }, [data])

  // Debug overlay component
  const DebugOverlay = () => (
    <div className="absolute top-0 left-0 right-0 bg-yellow-100 dark:bg-yellow-900/50 p-2 text-xs text-yellow-800 dark:text-yellow-200 z-50 overflow-auto max-h-[150px]">
      <div className="font-bold">Chart Debug:</div>
      <div>Mounted: {mounted ? "✅" : "❌"}</div>
      <div>Data Processed: {debugInfo.dataProcessed ? "✅" : "❌"}</div>
      <div>Container: {debugInfo.containerWidth}x{debugInfo.containerHeight}px</div>
      <div>Data Points: {chartData.length}</div>
      <div>Render Count: {debugInfo.renderCount}</div>
      {debugInfo.lastError && <div className="text-red-600">Error: {debugInfo.lastError}</div>}
    </div>
  )

  // If no data, don't render
  if (!chartData || chartData.length === 0) {
    return (
      <div className={`w-full h-[300px] flex items-center justify-center ${className}`}>
        <p className="text-slate-500 dark:text-slate-400">Aucune donnée disponible</p>
        <DebugOverlay />
      </div>
    )
  }

  console.log("🎨 MonthlyRainfallChart: About to render chart", { 
    mounted, 
    chartDataLength: chartData.length,
    containerSize: { 
      width: debugInfo.containerWidth, 
      height: debugInfo.containerHeight 
    } 
  })

  return (
    <div ref={chartRef} className={`w-full h-[300px] relative ${className}`}>
      <DebugOverlay />
      
      {!mounted ? (
        // Debug placeholder – lets us know component hydrated
        <div className="w-full h-full flex items-center justify-center text-xs text-slate-400 border border-dashed border-slate-300 dark:border-slate-700">
          Initialising chart… (not mounted yet)
        </div>
      ) : (
        <ChartErrorBoundary fallback={
          <div className="p-4 text-center">
            <button 
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </button>
          </div>
        }>
          <div className="w-full h-full" style={{ minHeight: "250px" }}>
            <ResponsiveContainer width="100%" height="100%" debounce={50}>
              <BarChart
                data={chartData}
                margin={{
                  top: 5,
                  right: 30,
                  left: isMobile ? 0 : 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#e5e7eb"} />
                <XAxis
                  dataKey={isMobile ? "shortMonth" : "month"}
                  tick={{ fontSize: isMobile ? 10 : 12, fill: isDark ? "#9ca3af" : "#4b5563" }}
                  interval={isMobile ? 1 : 0}
                  angle={isMobile ? -45 : 0}
                  textAnchor={isMobile ? "end" : "middle"}
                  height={isMobile ? 60 : 30}
                  axisLine={{ stroke: isDark ? "#4b5563" : "#d1d5db" }}
                  tickLine={{ stroke: isDark ? "#4b5563" : "#d1d5db" }}
                />
                <YAxis
                  tick={{ fontSize: isMobile ? 10 : 12, fill: isDark ? "#9ca3af" : "#4b5563" }}
                  domain={[0, maxValue]}
                  axisLine={{ stroke: isDark ? "#4b5563" : "#d1d5db" }}
                  tickLine={{ stroke: isDark ? "#4b5563" : "#d1d5db" }}
                  label={
                    !isMobile
                      ? {
                          value: "Précipitations (mm)",
                          angle: -90,
                          position: "insideLeft",
                          style: { textAnchor: "middle", fontSize: 12, fill: isDark ? "#9ca3af" : "#4b5563" },
                        }
                      : undefined
                  }
                />
                <Tooltip
                  formatter={(value: number) => [`${value.toFixed(1)} mm`, "Précipitations"]}
                  labelFormatter={(label) => {
                    const monthData = chartData.find((item) => (isMobile ? item.shortMonth : item.month) === label)
                    return monthData?.month || label
                  }}
                  contentStyle={{
                    backgroundColor: isDark ? "#1f2937" : "#ffffff",
                    borderColor: isDark ? "#374151" : "#e5e7eb",
                    color: isDark ? "#e5e7eb" : "#1f2937",
                    borderRadius: "0.375rem",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: isMobile ? 10 : 12 }}
                  formatter={(value) => <span style={{ color: isDark ? "#9ca3af" : "#4b5563" }}>{value}</span>}
                />
                <Bar
                  dataKey="precipitation"
                  name="Précipitations mensuelles"
                  fill={isDark ? "#3b82f6" : "#60a5fa"}
                  radius={[4, 4, 0, 0]}
                  animationDuration={1000}
                  isAnimationActive={true}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartErrorBoundary>
      )}
    </div>
  )
}
