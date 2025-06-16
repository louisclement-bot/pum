"use client"
import { useEffect, useState } from "react"
import type { MonthlyPrecipitationData } from "@/lib/pluvioService"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useTheme } from "next-themes"

interface RainfallDataTableProps {
  data: MonthlyPrecipitationData[]
  className?: string
}

export default function RainfallDataTable({ data, className = "" }: RainfallDataTableProps) {
  const [tableData, setTableData] = useState<MonthlyPrecipitationData[]>([])
  const { theme } = useTheme()
  const isDark = theme === "dark"

  // Process data when it changes
  useEffect(() => {
    if (!data || data.length === 0) return

    // Ensure all values are numbers
    const processedData = data.map((item) => ({
      ...item,
      precipitation: typeof item.precipitation === "number" ? item.precipitation : 0,
      rain: typeof item.rain === "number" ? item.rain : 0,
      snow: typeof item.snow === "number" ? item.snow : 0,
      cumulativePrecipitation: typeof item.cumulativePrecipitation === "number" ? item.cumulativePrecipitation : 0,
    }))

    // Sort by month index
    const sortedData = [...processedData].sort((a, b) => a.monthIndex - b.monthIndex)

    setTableData(sortedData)

    console.log("Rainfall data table processed:", {
      dataPoints: sortedData.length,
    })
  }, [data])

  // Format numbers for display
  const formatNumber = (num: number | undefined, decimals = 1) => {
    if (num === undefined) return "0"
    return num.toLocaleString("fr-FR", {
      maximumFractionDigits: decimals,
      minimumFractionDigits: decimals,
    })
  }

  // If no data, don't render
  if (!tableData || tableData.length === 0) {
    return (
      <div className={`w-full flex items-center justify-center py-8 ${className}`}>
        <p className="text-slate-500 dark:text-slate-400">Aucune donnée disponible</p>
      </div>
    )
  }

  return (
    <div className={`w-full overflow-x-auto ${className}`}>
      <Table>
        <TableHeader>
          <TableRow className={isDark ? "bg-slate-800" : "bg-slate-50"}>
            <TableHead className="font-semibold">Mois</TableHead>
            <TableHead className="text-right font-semibold">Précipitations (mm)</TableHead>
            <TableHead className="text-right font-semibold">Pluie (mm)</TableHead>
            <TableHead className="text-right font-semibold">Neige (mm)</TableHead>
            <TableHead className="text-right font-semibold">Cumul (mm)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tableData.map((month) => (
            <TableRow
              key={month.monthIndex}
              className={`
                ${isDark ? "hover:bg-slate-800/50" : "hover:bg-slate-50"}
                ${month.monthIndex % 2 === 0 ? (isDark ? "bg-slate-900/30" : "bg-slate-50/50") : ""}
              `}
            >
              <TableCell className="font-medium">{month.month}</TableCell>
              <TableCell className="text-right">{formatNumber(month.precipitation)}</TableCell>
              <TableCell className="text-right">{formatNumber(month.rain)}</TableCell>
              <TableCell className="text-right">{formatNumber(month.snow)}</TableCell>
              <TableCell className="text-right font-semibold">{formatNumber(month.cumulativePrecipitation)}</TableCell>
            </TableRow>
          ))}
          <TableRow className={isDark ? "bg-slate-800/50" : "bg-blue-50/50 font-semibold"}>
            <TableCell className="font-bold">Total annuel</TableCell>
            <TableCell className="text-right font-bold">
              {formatNumber(tableData.reduce((sum, item) => sum + item.precipitation, 0))}
            </TableCell>
            <TableCell className="text-right font-bold">
              {formatNumber(tableData.reduce((sum, item) => sum + item.rain, 0))}
            </TableCell>
            <TableCell className="text-right font-bold">
              {formatNumber(tableData.reduce((sum, item) => sum + item.snow, 0))}
            </TableCell>
            <TableCell className="text-right font-bold">-</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  )
}
