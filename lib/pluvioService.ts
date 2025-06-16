import { fetchWeatherApi } from "openmeteo"

const MIN_VALID_YEARS_FOR_NORMAL = 25 // Require at least 25 years for 1991-2020 normal

export type PluviometrySource = "Open-Meteo" | "Météo-France" | "USER_INPUT" | "Unknown"
export type PluviometryPrecision = "point" | "city" | "region" | "unavailable"

export interface PluviometryData {
  value: number | null
  period: string | null
  source: PluviometrySource | null
  precision: PluviometryPrecision
}

export interface DailyPrecipitationData {
  date: Date
  precipitation: number
  rain: number
  snow: number
}

export interface MonthlyPrecipitationData {
  month: string
  monthIndex: number
  precipitation: number
  rain: number
  snow: number
  cumulativePrecipitation: number
}

export interface DetailedPluviometryData {
  dailyData: DailyPrecipitationData[]
  monthlyData: MonthlyPrecipitationData[]
  totalPrecipitation: number
  totalRain: number
  totalSnow: number
  source: PluviometrySource
  period: string
}

// Helper function to sum array values
function sum(values: number[]): number {
  return values.reduce((acc, val) => acc + (val || 0), 0)
}

// Helper function to aggregate daily data by month
function aggregateByMonth(dailyData: DailyPrecipitationData[]): MonthlyPrecipitationData[] {
  const monthNames = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
  ]

  // Initialize monthly aggregates
  const monthlyAggregates: { [key: number]: { precipitation: number; rain: number; snow: number } } = {}

  // Aggregate daily data by month
  dailyData.forEach((day) => {
    const month = day.date.getMonth()
    if (!monthlyAggregates[month]) {
      monthlyAggregates[month] = { precipitation: 0, rain: 0, snow: 0 }
    }
    monthlyAggregates[month].precipitation += day.precipitation || 0
    monthlyAggregates[month].rain += day.rain || 0
    monthlyAggregates[month].snow += day.snow || 0
  })

  // Convert to array and calculate cumulative values
  let cumulativePrecipitation = 0
  const monthlyData = Object.entries(monthlyAggregates).map(([monthIndex, data]) => {
    const index = Number.parseInt(monthIndex)
    cumulativePrecipitation += data.precipitation
    return {
      month: monthNames[index],
      monthIndex: index,
      precipitation: Number(data.precipitation.toFixed(1)),
      rain: Number(data.rain.toFixed(1)),
      snow: Number(data.snow.toFixed(1)),
      cumulativePrecipitation: Number(cumulativePrecipitation.toFixed(1)),
    }
  })

  // Sort by month index
  return monthlyData.sort((a, b) => a.monthIndex - b.monthIndex)
}

// --- Enhanced Open-Meteo Data Retrieval ---
export async function fetchDetailedOpenMeteoData(lat: number, lon: number): Promise<DetailedPluviometryData | null> {
  console.log(`[DATA SOURCE] Fetching detailed OpenMeteo API data for coordinates: ${lat}, ${lon}`)

  try {
    const params = {
      latitude: lat,
      longitude: lon,
      start_date: "2024-01-01",
      end_date: "2024-12-31",
      daily: ["precipitation_sum", "rain_sum", "snowfall_sum"],
      timezone: "auto",
    }

    console.log("[DATA SOURCE] OpenMeteo API params:", JSON.stringify(params, null, 2))
    const url = "https://archive-api.open-meteo.com/v1/archive"

    console.log(`[DATA SOURCE] Calling OpenMeteo API: ${url}`)
    const responses = await fetchWeatherApi(url, params)
    console.log("[DATA SOURCE] OpenMeteo API response received")

    // Process first location
    const response = responses[0]
    const utcOffsetSeconds = response.utcOffsetSeconds()
    const daily = response.daily()

    if (!daily) {
      console.warn("[DATA SOURCE] Open-Meteo: Invalid or empty daily data received.")
      return null
    }

    // Extract all precipitation types
    const precipitationSum = daily.variables(0)?.valuesArray()
    const rainSum = daily.variables(1)?.valuesArray()
    const snowfallSum = daily.variables(2)?.valuesArray()

    if (!precipitationSum || !rainSum || !snowfallSum) {
      console.warn("[DATA SOURCE] Open-Meteo: Missing precipitation data variables.")
      return null
    }

    console.log(
      "[DATA SOURCE] OpenMeteo precipitation data sample:",
      Array.from(precipitationSum).slice(0, 5),
      "...",
      "Total days:",
      precipitationSum.length,
    )

    // Create time array
    const timeArray = [...Array((Number(daily.timeEnd()) - Number(daily.time())) / daily.interval())].map(
      (_, i) => new Date((Number(daily.time()) + i * daily.interval() + utcOffsetSeconds) * 1000),
    )

    // Process data into a more usable format
    const dailyData = timeArray.map((date, i) => ({
      date,
      precipitation: precipitationSum[i] || 0,
      rain: rainSum[i] || 0,
      snow: snowfallSum[i] || 0,
    }))

    // Calculate monthly aggregates
    const monthlyData = aggregateByMonth(dailyData)

    // Calculate totals
    const totalPrecipitation = sum(Array.from(precipitationSum))
    const totalRain = sum(Array.from(rainSum))
    const totalSnow = sum(Array.from(snowfallSum))

    console.log("[DATA SOURCE] Successfully processed OpenMeteo API data:", {
      totalPrecipitation: totalPrecipitation.toFixed(1),
      totalRain: totalRain.toFixed(1),
      totalSnow: totalSnow.toFixed(1),
      monthlyDataSample: monthlyData.slice(0, 3),
    })

    return {
      dailyData,
      monthlyData,
      totalPrecipitation: Number(totalPrecipitation.toFixed(1)),
      totalRain: Number(totalRain.toFixed(1)),
      totalSnow: Number(totalSnow.toFixed(1)),
      source: "Open-Meteo",
      period: "2024",
    }
  } catch (error: any) {
    console.error("[DATA SOURCE] Error fetching detailed Open-Meteo data:", error.response?.data || error.message)
    return null
  }
}

// --- Original Open-Meteo Helper (simplified to use the detailed data) ---
async function fetchAndCalculateOpenMeteoNormals(lat: number, lon: number): Promise<PluviometryData | null> {
  console.log(`[DATA SOURCE] Fetching annual rainfall from OpenMeteo API for coordinates: ${lat}, ${lon}`)

  try {
    const detailedData = await fetchDetailedOpenMeteoData(lat, lon)

    if (!detailedData) {
      console.warn("[DATA SOURCE] Failed to retrieve detailed precipitation data from OpenMeteo API")
      return null
    }

    console.log(
      `[DATA SOURCE] Successfully retrieved annual rainfall: ${detailedData.totalPrecipitation} mm from OpenMeteo API`,
    )
    return {
      value: detailedData.totalPrecipitation,
      period: detailedData.period,
      source: detailedData.source,
      precision: "point",
    }
  } catch (error: any) {
    console.error("[DATA SOURCE] Error in OpenMeteo data retrieval:", error)
    return null
  }
}

// --- Orchestrator ---
export async function getAverageAnnualPluviometry(lat: number, lon: number): Promise<PluviometryData | null> {
  console.log(`[DATA SOURCE] Requesting annual pluviometry data for coordinates: ${lat}, ${lon}`)

  // Try Open-Meteo
  try {
    const openMeteoData = await fetchAndCalculateOpenMeteoNormals(lat, lon)
    if (openMeteoData) {
      console.log(`[DATA SOURCE] Using OpenMeteo API data: ${openMeteoData.value} mm/year`)
      return openMeteoData
    }
  } catch (error) {
    console.error("[DATA SOURCE] Error with Open-Meteo data:", error)
  }

  // Return null instead of simulated data
  console.warn("[DATA SOURCE] OpenMeteo API failed. No rainfall data available.")
  return null
}

// New function to get detailed pluviometry data
export async function getDetailedPluviometryData(lat: number, lon: number): Promise<DetailedPluviometryData | null> {
  console.log(`[DATA SOURCE] Requesting detailed pluviometry data for coordinates: ${lat}, ${lon}`)

  try {
    const data = await fetchDetailedOpenMeteoData(lat, lon)
    if (data) {
      console.log(`[DATA SOURCE] Using OpenMeteo API detailed data with ${data.monthlyData.length} monthly records`)
      return data
    }

    console.warn("[DATA SOURCE] Failed to retrieve detailed precipitation data from OpenMeteo API")
    return null
  } catch (error) {
    console.error("[DATA SOURCE] Error getting detailed pluviometry data:", error)
    return null
  }
}
