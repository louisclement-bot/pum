"use client"
import { useEffect, useState } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import type { MonthlyPrecipitationData } from "@/lib/pluvioService"
import { useMediaQuery } from "@/hooks/use-media-query"
import { useTheme } from "next-themes"
import { useChartVisibility } from "@/hooks/use-chart-visibility"

interface CumulativeRainfallChartProps {
  data: MonthlyPrecipitationData[]
  className?: string
}

export default function CumulativeRainfallChart({ data, className = "" }: CumulativeRainfallChartProps) {
  const [chartData, setChartData] = useState<any[]>([])
  const [maxValue, setMaxValue] = useState<number>(0)
  const [mounted, setMounted] = useState(false) // SSR / hydration helper
  // observe visibility & container resize
  const { ref, updateTrigger } = useChartVisibility()
  const isMobile = useMediaQuery("(max-width: 640px)")
  const { theme } = useTheme()
  const isDark = theme === "dark"

  // mark component as mounted (client)
  useEffect(() => {
    setMounted(true)
  }, [])

  // Process data when it changes
  useEffect(() => {
    if (!data || data.length === 0) return

    // Format month names to be shorter for mobile
    const formattedData = data.map((item) => ({
      ...item,
      shortMonth: item.month.substring(0, 3),
      // Ensure cumulativePrecipitation is a number
      cumulativePrecipitation: typeof item.cumulativePrecipitation === "number" ? item.cumulativePrecipitation : 0,
    }))

    // Find the maximum value for better chart scaling
    const max = Math.max(...formattedData.map((item) => item.cumulativePrecipitation))
    setMaxValue(max * 1.1) // Add 10% padding to the top

    setChartData(formattedData)

    console.log("Cumulative rainfall chart data processed:", {
      dataPoints: formattedData.length,
      maxValue: max,
      firstItem: formattedData[0],
    })
  }, [data, updateTrigger]) // re-run when container becomes visible / resizes

  // If no data, don't render
  if (!chartData || chartData.length === 0) {
    return (
      <div className={`w-full h-[300px] flex items-center justify-center ${className}`}>
        <p className="text-slate-500 dark:text-slate-400">Aucune donnée disponible</p>
      </div>
    )
  }

  return (
    {/* attach visibility/resize observer ref */}
    <div ref={ref} className={`w-full h-[300px] ${className}`}>
      {!mounted ? (
        <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
          Initialising chart…
        </div>
      ) : (
        <ResponsiveContainer
          width="100%"
          height="100%"
          /* force remount when container becomes visible or resizes */
          key={updateTrigger}
        >
          <LineChart
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
                      value: "Précipitations cumulées (mm)",
                      angle: -90,
                      position: "insideLeft",
                      style: { textAnchor: "middle", fontSize: 12, fill: isDark ? "#9ca3af" : "#4b5563" },
                    }
                  : undefined
              }
            />
            <Tooltip
              formatter={(value: number) => [`${value.toFixed(1)} mm`, "Précipitations cumulées"]}
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
            <Line
              type="monotone"
              dataKey="cumulativePrecipitation"
              name="Précipitations cumulées"
              stroke={isDark ? "#3b82f6" : "#2563eb"}
              strokeWidth={2}
              dot={{ r: 4, fill: isDark ? "#3b82f6" : "#2563eb", stroke: isDark ? "#3b82f6" : "#2563eb" }}
              activeDot={{ r: 6, fill: isDark ? "#60a5fa" : "#3b82f6", stroke: isDark ? "#93c5fd" : "#60a5fa" }}
              animationDuration={1500}
              isAnimationActive={true}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

    <div ref={ref} className={`w-full h-[300px] ${className}`}>