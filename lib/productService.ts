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

  /**
   * Priority for display in recommendation lists
   * Lower number = higher priority (e.g. 1 shows first)
   */
  display_priority?: number

  /**
   * Marketing / technical advantages displayed in UI
   */
  advantages?: string[]

  /**
   * Volumes (in L) of aerial tanks this product is compatible with.
   * Mainly used for pumps. `null` or empty array means "all".
   */
  compatibleWithAerialVolumes?: number[] | null
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
    /**
     * 1️⃣  Primary source : JSON served by Next API route.
     * This prevents "HTML instead of JSON" errors caused by static-file
     * routing issues in some deployments.
     */
    const primaryResponse = await fetch("/api/products")

    // Ensure we received a successful status *and* JSON content
    if (!primaryResponse.ok) {
      throw new Error(`Failed to fetch products from API: ${primaryResponse.status}`)
    }
    const contentType = primaryResponse.headers.get("content-type") || ""
    if (!contentType.includes("application/json")) {
      throw new Error(`Invalid content-type for products API: ${contentType}`)
    }

    const products: Product[] = await primaryResponse.json()
    productsCache = products
    return products
  } catch (error) {
    // Log and attempt fallback to legacy static file, then to empty list
    console.error("[productService] Primary fetch failed:", error)
    try {
      const fallbackResponse = await fetch("/data/products.json")
      if (!fallbackResponse.ok) {
        throw new Error(`Fallback fetch failed: ${fallbackResponse.status}`)
      }
      const products: Product[] = await fallbackResponse.json()
      productsCache = products
      return products
    } catch (fallbackError) {
      console.error("[productService] Fallback fetch failed:", fallbackError)
      return [] // final graceful degradation
    }
  }
}

/**
 * Sort products by display_priority (lower number = higher priority)
 * If display_priority is not available or equal, sort by volume
 */
function sortByPriority(products: Product[]): Product[] {
  return [...products].sort((a, b) => {
    // First sort by display_priority if available
    if (a.display_priority !== undefined && b.display_priority !== undefined) {
      return a.display_priority - b.display_priority;
    }
    // If only one has display_priority, prioritize it
    if (a.display_priority !== undefined) return -1;
    if (b.display_priority !== undefined) return 1;
    
    // Otherwise sort by volume (for tanks)
    return (a.volume || 0) - (b.volume || 0);
  });
}

/**
 * Gets recommended tanks based on the calculated size and usage
 * Provides a mix of aerial and buried tanks sorted by priority
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

  // Filter tanks by size ranges and sort by priority
  const getFilteredTanksByRange = (tanks: Product[], minSize: number, maxSize: number | null) => {
    const filteredTanks = tanks.filter((tank) => {
      const volume = tank.volume || 0
      return volume >= minSize && (maxSize === null || volume <= maxSize)
    });
    
    // Sort by display_priority first, then by volume
    return sortByPriority(filteredTanks);
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
    const allValidTanks = sortByPriority([...fallbackBuriedTanks, ...fallbackAerialTanks]
      .filter((tank) => !selectedTanks.includes(tank)));

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
    );
    
  // Sort by display_priority first, then by volume
  return sortByPriority(tanks);
}

/**
 * Gets up to 9 **additional** tanks (after the Top-3) following business rules.
 * Ensures no duplication with the supplied `topProducts`.
 *
 * Rules (9 products max):
 *  • Mixed usage (interior + garden)   → 6 buried + 3 aerial
 *  • Interior only                    → 9 buried
 *  • Garden only                      → 5 aerial + 4 buried
 *
 * Products are first sorted by `display_priority`, then by volume proximity.
 */
export async function getAdditionalRecommendedTanks(
  recommendedSize: number,
  usages: string[],
  topProducts: Product[],
): Promise<Product[]> {
  const products = await fetchProducts();
  const excludeIds = new Set(topProducts.map((p) => p.id));

  const needsInteriorUsage = usages.includes("toilet") || usages.includes("washing");
  const hasGardenUsage = usages.includes("garden");
  const isMixedUsage = needsInteriorUsage && hasGardenUsage;

  // Helper: common filter for eligibility
  const isEligibleTank = (p: Product) =>
    (p.type === "aerial" || p.type === "buried") &&
    !excludeIds.has(p.id) &&
    p.volume !== null &&
    p.volume >= recommendedSize &&
    p.volume <= recommendedSize * 5;

  const buriedTanks = sortByPriority(
    products.filter((p) => p.type === "buried" && isEligibleTank(p)),
  );
  const aerialTanks = sortByPriority(
    products.filter((p) => p.type === "aerial" && isEligibleTank(p)),
  );

  const additional: Product[] = [];

  // Helper to pull from a list up to n items.
  const take = (source: Product[], n: number) => {
    const taken = source.splice(0, n);
    additional.push(...taken);
  };

  if (isMixedUsage) {
    take(buriedTanks, 6);
    take(aerialTanks, 3);
  } else if (needsInteriorUsage) {
    take(buriedTanks, 9);
  } else {
    // Garden only
    take(aerialTanks, 5);
    take(buriedTanks, 4);
  }

  // Fallback fill to reach up to 9 if some buckets were short
  if (additional.length < 9) {
    const remaining = sortByPriority([...buriedTanks, ...aerialTanks]);
    additional.push(...remaining.slice(0, 9 - additional.length));
  }

  return additional.slice(0, 9);
}

/**
 * Gets compatible pumps based on usage and tank type
 * @param usages Array of usage types (garden, toilet, washing)
 * @param recommendedTanks Array of recommended tanks
 */
export async function getCompatiblePumps(usages: string[], recommendedTanks?: Product[]): Promise<Product[]> {
  const products = await fetchProducts();
  const pumps = products.filter((product) => product.type === "pump");
  
  // Determine if interior usage is needed
  const hasInteriorUsage = usages.includes("toilet") || usages.includes("washing");
  
  // Determine if garden usage is needed
  const hasGardenUsage = usages.includes("garden");
  
  // Determine the primary tank type (aerial or buried)
  let primaryTankType: "aerial" | "buried" | null = null;
  let recommendedTankVolumes: number[] = [];
  
  if (recommendedTanks && recommendedTanks.length > 0) {
    // Count tank types to determine primary type
    const tankTypeCounts = recommendedTanks.reduce(
      (counts, tank) => {
        if (tank.type === "aerial") counts.aerial += 1;
        if (tank.type === "buried") counts.buried += 1;
        if (tank.volume) recommendedTankVolumes.push(tank.volume);
        return counts;
      },
      { aerial: 0, buried: 0 }
    );
    
    // Determine primary tank type
    primaryTankType = tankTypeCounts.aerial > tankTypeCounts.buried ? "aerial" : "buried";
  }
  
  // Filter pumps based on the usage and tank type criteria
  const filteredPumps = pumps.filter(pump => {
    // If interior usage is needed, select the interior/exterior pump
    if (hasInteriorUsage) {
      return pump.name.includes("EXTERIEUR/INTERIEUR");
    }
    
    // If only garden usage and we have a primary tank type
    if (hasGardenUsage && primaryTankType) {
      if (primaryTankType === "aerial") {
        // For aerial tanks, use the aerial pump
        return pump.name.includes("CUVE AERIENNE") && pump.name.includes("EXTERIEUR");
      } else {
        // For buried tanks, use the standard exterior pump
        return !pump.name.includes("CUVE AERIENNE") && pump.name.includes("EXTERIEUR") && 
               !pump.name.includes("INTERIEUR");
      }
    }
    
    // Default case: include all pumps
    return true;
  });
  
  // Filter pumps by compatibility with recommended tank volumes
  const compatiblePumps = filteredPumps.filter(pump => {
    // If no tank volumes, consider all pumps compatible
    if (recommendedTankVolumes.length === 0) return true;
    
    // Check if pump is compatible with any of the recommended tank volumes
    if (primaryTankType === "aerial" && pump.compatibleWithAerialVolumes) {
      // For aerial tanks, check compatibleWithAerialVolumes
      return pump.compatibleWithAerialVolumes.length === 0 || // Empty array means compatible with all
             recommendedTankVolumes.some(volume => 
               pump.compatibleWithAerialVolumes?.includes(volume)
             );
    } else if (primaryTankType === "buried" && pump.compatibleWithBuriedVolumes) {
      // For buried tanks, check compatibleWithBuriedVolumes
      return pump.compatibleWithBuriedVolumes.length === 0 || // Empty array means compatible with all
             recommendedTankVolumes.some(volume => 
               pump.compatibleWithBuriedVolumes?.includes(volume)
             );
    }
    
    // If no compatibility info, consider it compatible
    return true;
  });
  
  // Sort by display_priority
  const sortedPumps = sortByPriority(compatiblePumps);
  
  // If no compatible pumps found, return any pumps
  if (sortedPumps.length === 0 && pumps.length > 0) {
    return sortByPriority(pumps).slice(0, 2);
  }
  
  // Limit to 2 pumps maximum
  return sortedPumps.slice(0, 2);
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

  // For pumps, check if it matches the usage pattern
  if (product.type === "pump") {
    const hasInteriorUsage = usages.includes("toilet") || usages.includes("washing");
    const hasGardenOnly = usages.includes("garden") && !hasInteriorUsage;
    
    // Interior/Exterior pump is bestseller for toilet/washing
    if (product.name.includes("EXTERIEUR/INTERIEUR") && hasInteriorUsage) {
      return true;
    }
    
    // Aerial pump is bestseller for garden-only with aerial tanks
    if (product.name.includes("CUVE AERIENNE") && hasGardenOnly) {
      return true;
    }
    
    // Standard exterior pump is bestseller for garden-only with buried tanks
    if (!product.name.includes("CUVE AERIENNE") && 
        product.name.includes("EXTERIEUR") && 
        !product.name.includes("INTERIEUR") && 
        hasGardenOnly) {
      return true;
    }
  }

  return false
}

/**
 * Gets product features based on product properties
 * @param product The product
 */
export function getProductFeatures(product: Product): string[] {
  // If the product has defined advantages, use them
  if (product.advantages && product.advantages.length > 0) {
    return product.advantages;
  }
  
  // Otherwise use the legacy feature generation logic
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
    if (product.name.includes("EXTERIEUR/INTERIEUR")) {
      features.push("Pour WC et lave-linge")
      features.push("Installation intérieure")
      features.push("Silencieux")
    }

    if (product.name.includes("EXTERIEUR") && !product.name.includes("INTERIEUR")) {
      features.push("Idéal pour l'arrosage")
      features.push("Facile à installer")
      features.push("Basse consommation")
    }
    
    if (product.name.includes("CUVE AERIENNE")) {
      features.push("Kit complet pour cuve aérienne")
      features.push("Pompe de surface")
    }
  }

  return features
}
