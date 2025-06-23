"use client"
import { useEffect, useState, useRef } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import type { MonthlyPrecipitationData } from "@/lib/pluvioService"
import { useMediaQuery } from "@/hooks/use-media-query"
import { useTheme } from "next-themes"

interface MonthlyRainfallChartProps {
  data: MonthlyPrecipitationData[]
  className?: string
}

export default function MonthlyRainfallChart({ data, className = "" }: MonthlyRainfallChartProps) {
  const [chartData, setChartData] = useState<any[]>([])
  const [maxValue, setMaxValue] = useState<number>(0)
  const [mounted, setMounted] = useState(false) // Helps with SSR / hydration issues
  const chartRef = useRef<HTMLDivElement>(null)
  const isMobile = useMediaQuery("(max-width: 640px)")
  const { theme } = useTheme()
  const isDark = theme === "dark"

  // mark mounted once we hit the client
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
      // Ensure precipitation is a number
      precipitation: typeof item.precipitation === "number" ? item.precipitation : 0,
    }))

    // Find the maximum value for better chart scaling
    const max = Math.max(...formattedData.map((item) => item.precipitation))
    setMaxValue(max * 1.1) // Add 10% padding to the top

    setChartData(formattedData)

    console.log("Monthly rainfall chart data processed:", {
      dataPoints: formattedData.length,
      maxValue: max,
      firstItem: formattedData[0],
    })
  }, [data])

  // If no data, don't render
  if (!chartData || chartData.length === 0) {
    return (
      <div className={`w-full h-[300px] flex items-center justify-center ${className}`}>
        <p className="text-slate-500 dark:text-slate-400">Aucune donnée disponible</p>
      </div>
    )
  }

  return (
    <div ref={chartRef} className={`w-full h-[300px] ${className}`}>
      {!mounted ? (
        // Debug placeholder – lets us know component hydrated
        <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
          Initialising chart…
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
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
      )}
    </div>
  )
}
