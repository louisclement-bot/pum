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

// Available capacities for tank types (used for rounding)
const AERIAL_CAPS = [400, 700, 1000, 3000, 5000, 10000];
const BURIED_CAPS = [3000, 5000, 8000, 10000, 20000];

/**
 * Rounds up to the nearest capacity in the provided list that is >= the need.
 * If need exceeds all available capacities, returns the need unchanged.
 * 
 * @param need The required capacity in liters
 * @param capacities Array of available capacities in ascending order
 * @returns The smallest capacity >= need, or need if none exists
 */
function roundUpToNearestCap(need: number, capacities: number[]): number {
  // Find the first capacity that is >= need
  const nextCap = capacities.find(cap => cap >= need);
  return nextCap !== undefined ? nextCap : need;
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
 * V2 Algorithm: 
 * - Indoor usage = only buried tanks
 * - Garden-only = 2 aerial + 1 buried (if available)
 * - Sort by distance to rounded need, then display_priority, then volume
 * 
 * @param recommendedSize The recommended tank size in liters
 * @param usages Array of usage types (garden, toilet, washing)
 * @param limit Maximum number of tanks to return (default: 3)
 */
export async function getRecommendedTanks(recommendedSize: number, usages: string[], limit = 3): Promise<Product[]> {
  try {
    const products = await fetchProducts();
    const hasIndoorUsage = usages.includes("toilet") || usages.includes("washing");
    const hasGardenUsage = usages.includes("garden");
    
    // Round up to nearest available capacity based on usage
    const roundedNeed = hasIndoorUsage 
      ? roundUpToNearestCap(recommendedSize, BURIED_CAPS)
      : recommendedSize;
    
    // Filter tanks by type and minimum size
    const buriedTanks = products.filter(
      (product) => product.type === "buried" && 
                  product.volume !== null && 
                  product.volume >= roundedNeed
    );
    
    const aerialTanks = products.filter(
      (product) => product.type === "aerial" && 
                  product.volume !== null && 
                  product.volume >= roundedNeed
    );
    
    // Sort tanks by distance to roundedNeed, then by display_priority
    const sortByDistanceAndPriority = (tanks: Product[]): Product[] => {
      return [...tanks].sort((a, b) => {
        // First sort by distance to roundedNeed
        const distanceA = (a.volume || 0) - roundedNeed;
        const distanceB = (b.volume || 0) - roundedNeed;
        
        if (distanceA !== distanceB) {
          return distanceA - distanceB;
        }
        
        // If distance is the same, sort by display_priority
        if (a.display_priority !== undefined && b.display_priority !== undefined) {
          return a.display_priority - b.display_priority;
        }
        
        // If only one has display_priority, prioritize it
        if (a.display_priority !== undefined) return -1;
        if (b.display_priority !== undefined) return 1;
        
        // Finally, sort by volume
        return (a.volume || 0) - (b.volume || 0);
      });
    };
    
    // Deduplicate by ID only (not by volume)
    const deduplicateById = (tanks: Product[]): Product[] => {
      const uniqueIds = new Set<string>();
      return tanks.filter(tank => {
        if (uniqueIds.has(tank.id)) return false;
        uniqueIds.add(tank.id);
        return true;
      });
    };
    
    const sortedBuriedTanks = deduplicateById(sortByDistanceAndPriority(buriedTanks));
    const sortedAerialTanks = deduplicateById(sortByDistanceAndPriority(aerialTanks));
    
    let selectedTanks: Product[] = [];
    
    // Apply tank selection rules based on usage
    if (hasIndoorUsage) {
      // Indoor usage: only buried tanks
      selectedTanks = sortedBuriedTanks.slice(0, limit);
    } else {
      // Garden-only: EXACTLY 2 aerial + 1 buried (if available)
      // First, take up to 2 aerial tanks
      const aerialCount = Math.min(2, sortedAerialTanks.length);
      selectedTanks = sortedAerialTanks.slice(0, aerialCount);
      
      // Then, if we have room and buried tanks are available, add 1 buried tank
      if (selectedTanks.length < limit && sortedBuriedTanks.length > 0) {
        selectedTanks.push(sortedBuriedTanks[0]);
      }
      
      // If we still don't have enough tanks, add more aerial tanks
      if (selectedTanks.length < limit && aerialCount < sortedAerialTanks.length) {
        selectedTanks = [
          ...selectedTanks,
          ...sortedAerialTanks.slice(aerialCount, limit - selectedTanks.length + aerialCount)
        ];
      }
    }
    
    // Limit to requested number of tanks
    return selectedTanks.slice(0, limit);
  } catch (error) {
    console.error("[productService] getRecommendedTanks failed:", error);
    return [];
  }
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
 * Gets up to 9 **additional** tanks (after the Top-3) following V2 business rules.
 * Ensures no duplication with the supplied `topProducts`.
 * 
 * V2 Rules: Continue the same filtering and ordering logic from getRecommendedTanks
 * until max 9 total products.
 */
export async function getAdditionalRecommendedTanks(
  recommendedSize: number,
  usages: string[],
  topProducts: Product[],
): Promise<Product[]> {
  try {
    const products = await fetchProducts();
    const excludeIds = new Set(topProducts.map((p) => p.id));
    
    const hasIndoorUsage = usages.includes("toilet") || usages.includes("washing");
    const hasGardenUsage = usages.includes("garden");
    
    // Round up to nearest available capacity based on usage
    const roundedNeed = hasIndoorUsage 
      ? roundUpToNearestCap(recommendedSize, BURIED_CAPS)
      : recommendedSize;
    
    // Filter eligible tanks by type, minimum size, and exclude already selected tanks
    const eligibleBuriedTanks = products.filter(
      (product) => product.type === "buried" && 
                  product.volume !== null && 
                  product.volume >= roundedNeed &&
                  !excludeIds.has(product.id)
    );
    
    const eligibleAerialTanks = products.filter(
      (product) => product.type === "aerial" && 
                  product.volume !== null && 
                  product.volume >= roundedNeed &&
                  !excludeIds.has(product.id)
    );
    
    // Sort tanks by distance to roundedNeed, then by display_priority
    const sortByDistanceAndPriority = (tanks: Product[]): Product[] => {
      return [...tanks].sort((a, b) => {
        // First sort by distance to roundedNeed
        const distanceA = (a.volume || 0) - roundedNeed;
        const distanceB = (b.volume || 0) - roundedNeed;
        
        if (distanceA !== distanceB) {
          return distanceA - distanceB;
        }
        
        // If distance is the same, sort by display_priority
        if (a.display_priority !== undefined && b.display_priority !== undefined) {
          return a.display_priority - b.display_priority;
        }
        
        // If only one has display_priority, prioritize it
        if (a.display_priority !== undefined) return -1;
        if (b.display_priority !== undefined) return 1;
        
        // Finally, sort by volume
        return (a.volume || 0) - (b.volume || 0);
      });
    };
    
    // Deduplicate by ID only (not by volume)
    const deduplicateById = (tanks: Product[]): Product[] => {
      const uniqueIds = new Set<string>();
      return tanks.filter(tank => {
        if (uniqueIds.has(tank.id)) return false;
        uniqueIds.add(tank.id);
        return true;
      });
    };
    
    const sortedBuriedTanks = deduplicateById(sortByDistanceAndPriority(eligibleBuriedTanks));
    const sortedAerialTanks = deduplicateById(sortByDistanceAndPriority(eligibleAerialTanks));
    
    const additionalTanks: Product[] = [];
    
    // Apply tank selection rules based on usage
    if (hasIndoorUsage) {
      // Indoor usage: only buried tanks
      additionalTanks.push(...sortedBuriedTanks.slice(0, 9));
    } else {
      // Garden-only: prioritize aerial tanks, but include buried if available
      // Count existing aerial and buried tanks in topProducts
      const existingAerialCount = topProducts.filter(p => p.type === "aerial").length;
      const existingBuriedCount = topProducts.filter(p => p.type === "buried").length;
      
      // Calculate how many more we need to reach target ratios
      // Garden-only: 5 aerial + 4 buried total (including topProducts)
      const targetAerialCount = 5;
      const targetBuriedCount = 4;
      
      const remainingAerialCount = Math.max(0, targetAerialCount - existingAerialCount);
      const remainingBuriedCount = Math.max(0, targetBuriedCount - existingBuriedCount);
      
      // Add aerial tanks first (up to the remaining count)
      additionalTanks.push(...sortedAerialTanks.slice(0, remainingAerialCount));
      
      // Then add buried tanks (up to the remaining count)
      additionalTanks.push(...sortedBuriedTanks.slice(0, remainingBuriedCount));
    }
    
    // If we still don't have 9 tanks, add any remaining eligible tanks
    if (additionalTanks.length < 9) {
      // For indoor usage, only add more buried tanks
      if (hasIndoorUsage) {
        const remainingBuriedTanks = sortedBuriedTanks.filter(
          tank => !additionalTanks.some(t => t.id === tank.id)
        );
        additionalTanks.push(...remainingBuriedTanks.slice(0, 9 - additionalTanks.length));
      } else {
        // For garden-only, add any remaining tanks (aerial preferred)
        const remainingAerialTanks = sortedAerialTanks.filter(
          tank => !additionalTanks.some(t => t.id === tank.id)
        );
        additionalTanks.push(...remainingAerialTanks.slice(0, 9 - additionalTanks.length));
        
        // If still not enough, add more buried tanks
        if (additionalTanks.length < 9) {
          const remainingBuriedTanks = sortedBuriedTanks.filter(
            tank => !additionalTanks.some(t => t.id === tank.id)
          );
          additionalTanks.push(...remainingBuriedTanks.slice(0, 9 - additionalTanks.length));
        }
      }
    }
    
    // Limit to 3 extra tanks (top-3 are handled upstream → 6 tanks max)
    return additionalTanks.slice(0, 3);
  } catch (error) {
    console.error("[productService] getAdditionalRecommendedTanks failed:", error);
    return [];
  }
}

/**
 * Gets compatible pumps based on usage according to V2 rules
 * 
 * V2 Rules:
 * - Garden-only: "KIT POMPE POUR CUVE AERIENNE REEMPLOI EXTERIEUR" and "KIT POMPE POUR REEMPLOI EXTERIEUR"
 * - Indoor usage: "KIT POMPE POUR REEMPLOI EXTERIEUR/INTERIEUR"
 * 
 * @param usages Array of usage types (garden, toilet, washing)
 * @param recommendedTanks Array of recommended tanks (optional)
 */
export async function getCompatiblePumps(usages: string[], recommendedTanks?: Product[]): Promise<Product[]> {
  try {
    const products = await fetchProducts();
    const pumps = products.filter((product) => product.type === "pump");
    
    // Determine usage pattern
    const hasIndoorUsage = usages.includes("toilet") || usages.includes("washing");
    const hasGardenUsage = usages.includes("garden");
    
    let selectedPumps: Product[] = [];
    
    if (hasIndoorUsage) {
      // Indoor usage (with or without garden): return the interior/exterior kit
      const interiorPump = pumps.find(pump => 
        pump.name.includes("KIT POMPE POUR REEMPLOI EXTERIEUR/INTERIEUR")
      );
      
      if (interiorPump) {
        selectedPumps.push(interiorPump);
      }
    } else if (hasGardenUsage) {
      // Garden-only: return both garden kits
      const aerialPump = pumps.find(pump => 
        pump.name.includes("KIT POMPE POUR CUVE AERIENNE REEMPLOI EXTERIEUR")
      );
      
      const regularPump = pumps.find(pump => 
        pump.name.includes("KIT POMPE POUR REEMPLOI EXTERIEUR") && 
        !pump.name.includes("INTERIEUR") &&
        !pump.name.includes("CUVE AERIENNE")
      );
      
      if (aerialPump) {
        selectedPumps.push(aerialPump);
      }
      
      if (regularPump) {
        selectedPumps.push(regularPump);
      }
    }
    
    // Fallback to old logic if no pumps found with literal matching
    if (selectedPumps.length === 0) {
      // Filter pumps based on the usage and tank type criteria
      const filteredPumps = pumps.filter(pump => {
        // If interior usage is needed, select the interior/exterior pump
        if (hasIndoorUsage) {
          return pump.name.includes("EXTERIEUR/INTERIEUR");
        }
        
        // If only garden usage and we have a primary tank type
        if (hasGardenUsage && recommendedTanks && recommendedTanks.length > 0) {
          // Count tank types to determine primary type
          const tankTypeCounts = recommendedTanks.reduce(
            (counts, tank) => {
              if (tank.type === "aerial") counts.aerial += 1;
              if (tank.type === "buried") counts.buried += 1;
              return counts;
            },
            { aerial: 0, buried: 0 }
          );
          
          const primaryTankType = tankTypeCounts.aerial > tankTypeCounts.buried ? "aerial" : "buried";
          
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
      
      selectedPumps = sortByPriority(filteredPumps).slice(0, 2);
    }
    
    // If still no pumps found, return any pumps
    if (selectedPumps.length === 0 && pumps.length > 0) {
      return sortByPriority(pumps).slice(0, 2);
    }
    
    return selectedPumps;
  } catch (error) {
    console.error("[productService] getCompatiblePumps failed:", error);
    return [];
  }
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
    if (hasInteriorUsage && product.name.includes("EXTERIEUR/INTERIEUR")) {
      return true;
    }
    
    // For garden-only usage
    if (hasGardenOnly) {
      // Aerial pump is bestseller for garden-only
      if (product.name.includes("CUVE AERIENNE")) {
        return true;
      }
      
      // Standard exterior pump is bestseller for garden-only
      if (!product.name.includes("CUVE AERIENNE") && 
          product.name.includes("EXTERIEUR") && 
          !product.name.includes("INTERIEUR")) {
        return true;
      }
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

/**
 * TEST-ONLY helper – clears the products cache so that successive unit tests
 * can stub different fetch behaviours without polluting each other.
 * It is **not** used by the application runtime but is exported to ease Jest
 * setups. Prefixed with an underscore to signal internal usage.
 */
export function _resetCache(): void {
  productsCache = null
}
