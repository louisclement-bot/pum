// Conversion factors
export const CONVERSION = {
  MM_TO_M: 0.001,
  M2_TO_LITERS: 1000,
  LITERS_TO_M3: 0.001,
} as const

// Default values
export const DEFAULTS = {
  ROOF_RUNOFF_COEFFICIENT: 0.8,
  WATER_PRICE_PER_M3: 4.14,
  MIN_TANK_SIZE: 1000,
  MAX_TANK_SIZE: 10000,
  DEFAULT_AUTONOMY_WEEKS: 2,
} as const

// Calculation formulas as functions
export const FORMULAS = {
  calculateCollectableWater: (roofSurface: number, annualRainfall: number) => {
    return (
      roofSurface * annualRainfall * DEFAULTS.ROOF_RUNOFF_COEFFICIENT * CONVERSION.MM_TO_M * CONVERSION.M2_TO_LITERS
    )
  },

  calculateWaterNeeds: (gardenSurface: number, householdSize: number, usages: string[]) => {
    let needs = 0

    // Garden water needs (if applicable)
    if (usages.includes("garden") && gardenSurface) {
      needs += gardenSurface * 450 // Approximate annual water need per m² of garden
    }

    // Toilet water needs (if applicable)
    if (usages.includes("toilet") && householdSize) {
      needs += householdSize * 8000 // Approximate annual water need for toilets per person
    }

    // Washing machine water needs (if applicable)
    if (usages.includes("washing") && householdSize) {
      needs += householdSize * 5000 // Approximate annual water need for washing machine per person
    }

    return needs
  },

  calculateTankSize: (collectableWater: number, waterNeeds: number, autonomyWeeks: number) => {
    // Calculate optimal tank size based on collectable water, needs, and desired autonomy
    const weeklyNeeds = waterNeeds / 52
    const requiredCapacity = weeklyNeeds * autonomyWeeks

    // Tank size should be between min and max values
    return Math.max(DEFAULTS.MIN_TANK_SIZE, Math.min(DEFAULTS.MAX_TANK_SIZE, Math.round(requiredCapacity / 100) * 100))
  },

  calculateSavings: (waterUsage: number) => {
    // Convert liters to m³ and calculate financial savings
    const waterUsageM3 = waterUsage * CONVERSION.LITERS_TO_M3
    return waterUsageM3 * DEFAULTS.WATER_PRICE_PER_M3
  },

  calculateCoverageRate: (collectableWater: number, waterNeeds: number) => {
    if (waterNeeds === 0) return 0
    return Math.min(100, (collectableWater / waterNeeds) * 100)
  },
} as const
