export type SimulatorData = {
  // Existing fields
  householdSize: number
  roofType: string
  roofSurface: number
  roofShape: string
  gardenSurface: number
  annualRainfall: number
  postalCode: string
  city: string
  address: string
  autonomyWeeks: number
  usageSelections: {
    toilets: boolean
    garden: boolean
    washing: boolean
  }
  annualWaterNeeds: number
  annualWaterCollectable: number
  recommendedTankSize: number
  potentialSavings: number
  potentialSavingsEuros: number
  coverageRate: number

  // Origin of the rainfall value (e.g. "OpenMeteo API", "USER_INPUT", …)
  rainfallDataSource?: string

  // New fields for coordinates and detailed precipitation data
  latitude?: number
  longitude?: number
  detailedPrecipitationData?: {
    monthlyData: Array<{
      month: string
      monthIndex: number
      precipitation: number
      rain: number
      snow: number
      cumulativePrecipitation: number
    }>
    totalPrecipitation: number
    totalRain: number
    totalSnow: number
    source: string
    period: string
  }
}
