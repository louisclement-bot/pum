"use client"
import { useEffect, useState, useRef, Component, ErrorInfo } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { useMediaQuery } from "@/hooks/use-media-query"
import { useTheme } from "next-themes"

interface PrecipitationCompositionChartProps {
  rain: number
  snow: number
  className?: string
}

export default function PrecipitationCompositionChart({
  rain,
  snow,
  className = "",
}: PrecipitationCompositionChartProps) {
  // ---------- Debug initial render ----------
  console.log("🔍 PrecipitationCompositionChart rendered with props:", { rain, snow })

  const [chartData, setChartData] = useState<any[]>([])
  const [mounted, setMounted] = useState(false)
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

  // Error Boundary
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
      console.error("🚨 Pie chart error:", error, errorInfo)
    }
    render() {
      if (this.state.hasError) {
        return (
          <div className="border border-red-300 bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
            <p className="text-red-600 dark:text-red-400 font-medium">Chart Error:</p>
            <p className="text-sm text-red-500 dark:text-red-300">{this.state.error?.message}</p>
            {this.props.fallback}
          </div>
        )
      }
      return this.props.children
    }
  }

  // Render counter
  useEffect(() => {
    setDebugInfo((p) => ({ ...p, renderCount: p.renderCount + 1 }))
  }, [])

  // mark as mounted on client to avoid rendering recharts during SSR
  useEffect(() => {
    console.log("🔄 PieChart: set mounted true")
    setMounted(true)
  }, [])

  // Track container dimensions
  useEffect(() => {
    if (!chartRef.current) return
    const updateDims = () => {
      if (chartRef.current) {
        const { width, height } = chartRef.current.getBoundingClientRect()
        setDebugInfo((p) => ({ ...p, containerWidth: width, containerHeight: height }))
        console.log("📏 Pie chart container dims:", { width, height })
      }
    }
    updateDims()
    const ro = new ResizeObserver(updateDims)
    ro.observe(chartRef.current)
    return () => {
      if (chartRef.current) ro.unobserve(chartRef.current)
      ro.disconnect()
    }
  }, [mounted])

  // Process data when it changes
  useEffect(() => {
    try {
      const rainValue = typeof rain === "number" ? rain : 0
      const snowValue = typeof snow === "number" ? snow : 0

      if (rainValue <= 0 && snowValue <= 0) {
        setChartData([])
        setDebugInfo((p) => ({ ...p, dataProcessed: false, lastError: "No data" }))
        return
      }

      const data = [
        { name: "Pluie", value: rainValue },
        { name: "Neige", value: snowValue },
      ]

      setChartData(data)
      setDebugInfo((p) => ({ ...p, dataProcessed: true, lastError: null }))

      console.log("✅ Pie chart data processed:", { rain: rainValue, snow: snowValue })
    } catch (err) {
      console.error("🚨 Error processing pie chart data:", err)
      setDebugInfo((p) => ({
        ...p,
        dataProcessed: false,
        lastError: err instanceof Error ? err.message : "unknown",
      }))
    }
  }, [rain, snow])

  const COLORS = isDark ? ["#3b82f6", "#94a3b8"] : ["#60a5fa", "#cbd5e1"]

  // If no data or all zeros, don't render
  if (!chartData || chartData.length === 0 || (chartData[0].value === 0 && chartData[1].value === 0)) {
    return (
      <div className={`w-full h-[300px] flex items-center justify-center relative ${className}`}>
        <p className="text-slate-500 dark:text-slate-400">Aucune donnée disponible</p>
        {/* Debug overlay to still show diagnostics */}
        <div className="absolute top-0 left-0 right-0 bg-yellow-100 dark:bg-yellow-900/50 p-2 text-xs text-yellow-800 dark:text-yellow-200 z-50">
          No data
        </div>
      </div>
    )
  }

  const DebugOverlay = () => (
    <div className="absolute top-0 left-0 right-0 bg-yellow-100 dark:bg-yellow-900/50 p-2 text-xs text-yellow-800 dark:text-yellow-200 z-50 overflow-auto max-h-[150px]">
      <div className="font-bold">Chart Debug:</div>
      <div>Mounted: {mounted ? "✅" : "❌"}</div>
      <div>Processed: {debugInfo.dataProcessed ? "✅" : "❌"}</div>
      <div>
        Container: {debugInfo.containerWidth}x{debugInfo.containerHeight}
      </div>
      <div>Points: {chartData.length}</div>
      <div>Render #{debugInfo.renderCount}</div>
      {debugInfo.lastError && <div className="text-red-600">Error: {debugInfo.lastError}</div>}
    </div>
  )

  return (
    <div ref={chartRef} className={`w-full h-[300px] relative ${className}`}>
      <DebugOverlay />
      {!mounted ? (
        <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
          Initialising chart…
        </div>
      ) : (
        <ChartErrorBoundary
          fallback={<div className="p-4 text-center text-red-600">Pie chart failed</div>}
        >
          <ResponsiveContainer width="100%" height="100%" debounce={50}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={!isMobile}
            outerRadius={isMobile ? 60 : 80}
            fill="#8884d8"
            dataKey="value"
            label={!isMobile ? ({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%` : undefined}
            animationDuration={1000}
            isAnimationActive={true}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
                stroke={isDark ? "#1f2937" : "#ffffff"}
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => `${value.toFixed(1)} mm`}
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
            formatter={(value, entry, index) => {
              const item = chartData[index]
              const percent = (item.value / (chartData[0].value + chartData[1].value)) * 100
              return (
                <span style={{ color: isDark ? "#9ca3af" : "#4b5563" }}>
                  {value}: {item.value.toFixed(1)} mm ({percent.toFixed(0)}%)
                </span>
              )
            }}
          />
        </PieChart>
      </ResponsiveContainer>
        </ChartErrorBoundary>
      )}
    </div>
  )
}
