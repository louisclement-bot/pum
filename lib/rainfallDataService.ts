import { fetchWeatherApi } from "openmeteo"

export interface MonthlyRainfallData {
  month: string
  precipitationSum: number
  cumulativeSum: number
}

export interface RainfallData {
  totalAnnualRainfall: number
  monthlyData: MonthlyRainfallData[]
  wettest: { month: string; value: number }
  driest: { month: string; value: number }
}

/**
 * Fetches detailed rainfall data for a specific location for the year 2024
 * @param latitude The latitude of the location
 * @param longitude The longitude of the location
 * @returns Promise with rainfall data or null if data couldn't be fetched
 */
export async function fetchDetailedRainfallData(latitude: number, longitude: number): Promise<RainfallData | null> {
  try {
    const params = {
      latitude: latitude,
      longitude: longitude,
      start_date: "2024-01-01",
      end_date: "2024-12-31",
      daily: ["precipitation_sum"],
      timezone: "Europe/Paris",
    }

    const url = "https://archive-api.open-meteo.com/v1/archive"
    const responses = await fetchWeatherApi(url, params)

    // Process first location
    const response = responses[0]

    // Attributes for timezone and location
    const utcOffsetSeconds = response.utcOffsetSeconds()

    const daily = response.daily()

    if (!daily) {
      console.error("No daily data returned from API")
      return null
    }

    // Extract precipitation data
    const times = [...Array((Number(daily.timeEnd()) - Number(daily.time())) / daily.interval())].map(
      (_, i) => new Date((Number(daily.time()) + i * daily.interval() + utcOffsetSeconds) * 1000),
    )

    const precipitationSum = daily.variables(0)?.valuesArray()

    if (!precipitationSum) {
      console.error("No precipitation data returned from API")
      return null
    }

    // Aggregate data by month
    const monthlyData: { [key: string]: number } = {}
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

    // Initialize all months with 0
    monthNames.forEach((month, index) => {
      monthlyData[month] = 0
    })

    // Sum precipitation by month
    for (let i = 0; i < times.length; i++) {
      const date = times[i]
      const month = monthNames[date.getMonth()]
      const precipitation = precipitationSum[i] || 0

      monthlyData[month] += precipitation
    }

    // Calculate total annual rainfall
    const totalAnnualRainfall = Object.values(monthlyData).reduce((sum, value) => sum + value, 0)

    // Format monthly data with cumulative sums
    let cumulativeSum = 0
    const formattedMonthlyData: MonthlyRainfallData[] = monthNames.map((month) => {
      const value = monthlyData[month]
      cumulativeSum += value
      return {
        month,
        precipitationSum: Number.parseFloat(value.toFixed(1)),
        cumulativeSum: Number.parseFloat(cumulativeSum.toFixed(1)),
      }
    })

    // Find wettest and driest months
    let wettest = { month: "", value: Number.NEGATIVE_INFINITY }
    let driest = { month: "", value: Number.POSITIVE_INFINITY }

    Object.entries(monthlyData).forEach(([month, value]) => {
      if (value > wettest.value) {
        wettest = { month, value: Number.parseFloat(value.toFixed(1)) }
      }
      if (value < driest.value) {
        driest = { month, value: Number.parseFloat(value.toFixed(1)) }
      }
    })

    return {
      totalAnnualRainfall: Number.parseFloat(totalAnnualRainfall.toFixed(1)),
      monthlyData: formattedMonthlyData,
      wettest,
      driest,
    }
  } catch (error) {
    console.error("Error fetching detailed rainfall data:", error)
    return null
  }
}
