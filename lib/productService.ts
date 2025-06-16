// Product types
export interface Product {
  id: string
  name: string
  type: "aerial" | "buried" | "pump"
  volume: number | null
  usage: string | null
  compatibleWithBuriedVolumes: number[] | null
  productUrl: string
  imageUrl: string
}

// Cache for products to avoid multiple fetches
let productsCache: Product[] | null = null

/**
 * Fetches all products from the JSON file
 */
export async function fetchProducts(): Promise<Product[]> {
  // Return cached products if available
  if (productsCache) {
    return productsCache
  }

  try {
    const response = await fetch("/data/products.json")
    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.status}`)
    }
    const products: Product[] = await response.json()
    productsCache = products
    return products
  } catch (error) {
    console.error("Error fetching products:", error)
    return []
  }
}

/**
 * Gets recommended tanks based on the calculated size and usage
 * Provides a mix of aerial and buried tanks
 * @param recommendedSize The recommended tank size in liters
 * @param usages Array of usage types (garden, toilet, washing)
 * @param limit Maximum number of tanks to return
 */
export async function getRecommendedTanks(recommendedSize: number, usages: string[], limit = 3): Promise<Product[]> {
  const products = await fetchProducts()
  const needsInteriorUsage = usages.includes("toilet") || usages.includes("washing")

  // Filter tanks by type
  const buriedTanks = products.filter((product) => product.type === "buried" && product.volume !== null)
  const aerialTanks = products.filter((product) => product.type === "aerial" && product.volume !== null)

  // Define size ranges
  const idealMaxSize = recommendedSize * 1.5
  const acceptableMaxSize = recommendedSize * 3

  // Filter and sort tanks by size ranges
  const getFilteredTanksByRange = (tanks: Product[], minSize: number, maxSize: number | null) => {
    return tanks
      .filter((tank) => {
        const volume = tank.volume || 0
        return volume >= minSize && (maxSize === null || volume <= maxSize)
      })
      .sort((a, b) => (a.volume || 0) - (b.volume || 0)) // Sort by ascending volume
  }

  // Get tanks in different size ranges
  const idealBuriedTanks = getFilteredTanksByRange(buriedTanks, recommendedSize, idealMaxSize)
  const acceptableBuriedTanks = getFilteredTanksByRange(buriedTanks, recommendedSize, acceptableMaxSize)
  const fallbackBuriedTanks = getFilteredTanksByRange(buriedTanks, recommendedSize, null)

  const idealAerialTanks = getFilteredTanksByRange(aerialTanks, recommendedSize, idealMaxSize)
  const acceptableAerialTanks = getFilteredTanksByRange(aerialTanks, recommendedSize, acceptableMaxSize)
  const fallbackAerialTanks = getFilteredTanksByRange(aerialTanks, recommendedSize, null)

  // Select tanks based on usage and availability
  let selectedTanks: Product[] = []

  // Determine how many of each type to include
  const buriedCount = needsInteriorUsage ? 2 : 1
  const aerialCount = needsInteriorUsage ? 1 : 2

  // Select buried tanks progressively from ideal to fallback
  let selectedBuriedTanks: Product[] = []
  if (idealBuriedTanks.length >= buriedCount) {
    selectedBuriedTanks = idealBuriedTanks.slice(0, buriedCount)
  } else if (acceptableBuriedTanks.length >= buriedCount) {
    selectedBuriedTanks = acceptableBuriedTanks.slice(0, buriedCount)
  } else {
    selectedBuriedTanks = fallbackBuriedTanks.slice(0, buriedCount)
  }

  // Select aerial tanks progressively from ideal to fallback
  let selectedAerialTanks: Product[] = []
  if (idealAerialTanks.length >= aerialCount) {
    selectedAerialTanks = idealAerialTanks.slice(0, aerialCount)
  } else if (acceptableAerialTanks.length >= aerialCount) {
    selectedAerialTanks = acceptableAerialTanks.slice(0, aerialCount)
  } else {
    selectedAerialTanks = fallbackAerialTanks.slice(0, aerialCount)
  }

  // Combine the selected tanks
  selectedTanks = [...selectedBuriedTanks, ...selectedAerialTanks]

  // If we don't have enough tanks, try to fill with any available tanks that meet the minimum size
  if (selectedTanks.length < limit) {
    const allValidTanks = [...fallbackBuriedTanks, ...fallbackAerialTanks]
      .filter((tank) => !selectedTanks.includes(tank))
      .sort((a, b) => (a.volume || 0) - (b.volume || 0))

    selectedTanks = [...selectedTanks, ...allValidTanks.slice(0, limit - selectedTanks.length)]
  }

  // Limit to requested number of tanks
  return selectedTanks.slice(0, limit)
}

/**
 * Gets all tanks for the "View More" functionality
 * @param recommendedSize The recommended tank size in liters
 */
export async function getAllTanks(recommendedSize: number): Promise<Product[]> {
  const products = await fetchProducts()

  // Get all tanks that are at least the recommended size
  const tanks = products
    .filter(
      (product) => (product.type === "aerial" || product.type === "buried") && (product.volume || 0) >= recommendedSize,
    )
    .sort((a, b) => (a.volume || 0) - (b.volume || 0)) // Sort by ascending volume

  return tanks
}

/**
 * Gets compatible pumps based on usage
 * @param usages Array of usage types (garden, toilet, washing)
 */
export async function getCompatiblePumps(usages: string[]): Promise<Product[]> {
  const products = await fetchProducts()
  const pumps = products.filter((product) => product.type === "pump")
  const result: Product[] = []

  // For garden usage, add KIT'O JARDIN
  if (usages.includes("garden")) {
    const gardenPump = pumps.find((pump) => pump.id === "78290") // KIT'O JARDIN
    if (gardenPump) result.push(gardenPump)
  }

  // For toilet or washing usage, add KIT'O HABITAT
  if (usages.includes("toilet") || usages.includes("washing")) {
    const interiorPump = pumps.find((pump) => pump.id === "78291") // KIT'O HABITAT
    if (interiorPump) result.push(interiorPump)
  }

  // If no specific usages or no pumps found, add a default pump
  if (result.length === 0 && pumps.length > 0) {
    result.push(pumps[0])
  }

  // Limit to 2 pumps maximum
  return result.slice(0, 2)
}

/**
 * Determines if a product should be marked as a bestseller
 * @param product The product to check
 * @param recommendedSize The recommended tank size
 * @param usages Array of usage types
 */
export function isBestsellerProduct(product: Product, recommendedSize: number, usages: string[]): boolean {
  // For tanks, check if it's close to but not less than the recommended size
  if (product.type === "aerial" || product.type === "buried") {
    if (product.volume) {
      // Tank must be at least the recommended size
      if (product.volume < recommendedSize) {
        return false
      }

      // If the tank is within 20% above the recommended size, mark as bestseller
      const sizeRatio = product.volume / recommendedSize
      if (sizeRatio >= 1 && sizeRatio <= 1.2) {
        return true
      }
    }
  }

  // For pumps, check if it matches the primary usage
  if (product.type === "pump") {
    // KIT'O HABITAT is bestseller for toilet/washing
    if (product.id === "78291" && (usages.includes("toilet") || usages.includes("washing"))) {
      return true
    }
    // KIT'O JARDIN is bestseller for garden-only usage
    if (
      product.id === "78290" &&
      usages.includes("garden") &&
      !usages.includes("toilet") &&
      !usages.includes("washing")
    ) {
      return true
    }
  }

  return false
}

/**
 * Gets product features based on product properties
 * @param product The product
 */
export function getProductFeatures(product: Product): string[] {
  const features: string[] = []

  if (product.type === "aerial") {
    features.push("Installation facile")

    if (product.volume && product.volume <= 1000) {
      features.push("Idéal pour petit jardin")
      features.push("Livraison rapide")
    } else if (product.volume && product.volume > 1000) {
      features.push("Grande capacité")
    }

    if (product.name.includes("SOUPLE")) {
      features.push("Stockage flexible")
    }
  }

  if (product.type === "buried") {
    features.push("Installation professionnelle")

    if (product.volume && product.volume >= 5000) {
      features.push("Grande capacité")
    }

    if (product.volume && product.volume >= 8000) {
      features.push("Idéal pour usage intensif")
    }

    features.push(`Garantie ${product.volume && product.volume > 5000 ? "15" : "10"} ans`)
  }

  if (product.type === "pump") {
    if (product.id === "78291") {
      features.push("Pour WC et lave-linge")
      features.push("Installation intérieure")
      features.push("Silencieux")
    }

    if (product.id === "78290") {
      features.push("Idéal pour l'arrosage")
      features.push("Facile à installer")
      features.push("Basse consommation")
    }
  }

  return features
}
