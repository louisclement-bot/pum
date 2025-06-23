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
  const [chartData, setChartData] = useState<any[]>([])
  const [mounted, setMounted] = useState(false)
  const chartRef = useRef<HTMLDivElement>(null)
  const isMobile = useMediaQuery("(max-width: 640px)")
  const { theme } = useTheme()
  const isDark = theme === "dark"

  // mark as mounted on client to avoid rendering recharts during SSR
  useEffect(() => {
    setMounted(true)
  }, [])

  // Process data when it changes
  useEffect(() => {
    const rainValue = typeof rain === "number" ? rain : 0
    const snowValue = typeof snow === "number" ? snow : 0

    if (rainValue <= 0 && snowValue <= 0) {
      setChartData([])
      return
    }

    setChartData([
      { name: "Pluie", value: rainValue },
      { name: "Neige", value: snowValue },
    ])
  }, [rain, snow])

  const COLORS = isDark ? ["#3b82f6", "#94a3b8"] : ["#60a5fa", "#cbd5e1"]

  // If no data or all zeros, don't render
  if (!chartData || chartData.length === 0 || (chartData[0].value === 0 && chartData[1].value === 0)) {
    return (
      <div className={`w-full h-[300px] flex items-center justify-center relative ${className}`}>
        <p className="text-slate-500 dark:text-slate-400">Aucune donnée disponible</p>
      </div>
    )
  }

  return (
    <div ref={chartRef} className={`w-full h-[300px] relative ${className}`}>
      {!mounted ? (
        <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
          Initialising chart…
        </div>
      ) : (
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
      )}
    </div>
  )
}
