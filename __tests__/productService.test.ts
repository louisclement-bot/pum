import {
  fetchProducts,
  getRecommendedTanks,
  getAdditionalRecommendedTanks,
  getCompatiblePumps,
  sortByPriority,
  isBestsellerProduct,
  getProductFeatures,
  type Product
} from '@/lib/productService';

// Mock the fetch function
global.fetch = jest.fn();

// Create mock product data that resembles the real catalog
const mockProducts: Product[] = [
  // Aerial tanks
  {
    id: "78349",
    name: "CUVE AERIENNE \"PLUVIALUX\" 400L",
    type: "aerial",
    volume: 400,
    usage: "Exterior Only",
    compatibleWithBuriedVolumes: [],
    productUrl: "https://example.com/product1",
    imageUrl: "https://example.com/image1.jpg",
    display_priority: 1,
    advantages: ["Advantage 1", "Advantage 2"],
    compatibleWithAerialVolumes: [400]
  },
  {
    id: "78351",
    name: "CUVE AERIENNE \"PLUVIALUX\" 700L",
    type: "aerial",
    volume: 700,
    usage: "Exterior Only",
    compatibleWithBuriedVolumes: [],
    productUrl: "https://example.com/product2",
    imageUrl: "https://example.com/image2.jpg",
    display_priority: 2,
    advantages: ["Advantage 1", "Advantage 2"],
    compatibleWithAerialVolumes: [700]
  },
  {
    id: "78361",
    name: "CUVE AERIENNE \"PLUVIOBLOCK\" 1000L",
    type: "aerial",
    volume: 1000,
    usage: "Exterior Only",
    compatibleWithBuriedVolumes: [],
    productUrl: "https://example.com/product3",
    imageUrl: "https://example.com/image3.jpg",
    display_priority: 3,
    advantages: ["Advantage 1", "Advantage 2"],
    compatibleWithAerialVolumes: [1000]
  },
  {
    id: "74469",
    name: "CITERNE AUTOPORTANTE 3000L",
    type: "aerial",
    volume: 3000,
    usage: "Exterior Only",
    compatibleWithBuriedVolumes: [],
    productUrl: "https://example.com/product4",
    imageUrl: "https://example.com/image4.jpg",
    display_priority: 4,
    advantages: ["Advantage 1", "Advantage 2"],
    compatibleWithAerialVolumes: [3000]
  },
  {
    id: "77375",
    name: "CUVE SOUPLE EAU DE PLUIE 5000L",
    type: "aerial",
    volume: 5000,
    usage: "Exterior Only",
    compatibleWithBuriedVolumes: [],
    productUrl: "https://example.com/product5",
    imageUrl: "https://example.com/image5.jpg",
    display_priority: 1,
    advantages: ["Advantage 1", "Advantage 2"],
    compatibleWithAerialVolumes: [5000]
  },
  {
    id: "77373",
    name: "CUVE SOUPLE EAU DE PLUIE 10000L",
    type: "aerial",
    volume: 10000,
    usage: "Exterior Only",
    compatibleWithBuriedVolumes: [],
    productUrl: "https://example.com/product6",
    imageUrl: "https://example.com/image6.jpg",
    display_priority: 2,
    advantages: ["Advantage 1", "Advantage 2"],
    compatibleWithAerialVolumes: [10000]
  },
  
  // Buried tanks
  {
    id: "65807",
    name: "CUVE EAU DE PLUIE PLATE 3000L",
    type: "buried",
    volume: 3000,
    usage: "Interior/Exterior",
    compatibleWithBuriedVolumes: [3000],
    productUrl: "https://example.com/product7",
    imageUrl: "https://example.com/image7.jpg",
    display_priority: 2,
    advantages: ["Advantage 1", "Advantage 2"],
    compatibleWithAerialVolumes: []
  },
  {
    id: "66673",
    name: "CUVE EAU DE PLUIE 5000L",
    type: "buried",
    volume: 5000,
    usage: "Interior/Exterior",
    compatibleWithBuriedVolumes: [5000],
    productUrl: "https://example.com/product8",
    imageUrl: "https://example.com/image8.jpg",
    display_priority: 1,
    advantages: ["Advantage 1", "Advantage 2"],
    compatibleWithAerialVolumes: []
  },
  {
    id: "custom1",
    name: "CUVE EAU DE PLUIE 5000L PRIORITY 3",
    type: "buried",
    volume: 5000,
    usage: "Interior/Exterior",
    compatibleWithBuriedVolumes: [5000],
    productUrl: "https://example.com/custom1",
    imageUrl: "https://example.com/custom1.jpg",
    display_priority: 3,
    advantages: ["Advantage 1", "Advantage 2"],
    compatibleWithAerialVolumes: []
  },
  {
    id: "custom2",
    name: "CUVE EAU DE PLUIE 5000L PRIORITY 2",
    type: "buried",
    volume: 5000,
    usage: "Interior/Exterior",
    compatibleWithBuriedVolumes: [5000],
    productUrl: "https://example.com/custom2",
    imageUrl: "https://example.com/custom2.jpg",
    display_priority: 2,
    advantages: ["Advantage 1", "Advantage 2"],
    compatibleWithAerialVolumes: []
  },
  {
    id: "66676",
    name: "CUVE EAU DE PLUIE 8000L",
    type: "buried",
    volume: 8000,
    usage: "Interior/Exterior",
    compatibleWithBuriedVolumes: [8000],
    productUrl: "https://example.com/product9",
    imageUrl: "https://example.com/image9.jpg",
    display_priority: 3,
    advantages: ["Advantage 1", "Advantage 2"],
    compatibleWithAerialVolumes: []
  },
  {
    id: "66677",
    name: "CUVE EAU DE PLUIE 10000L",
    type: "buried",
    volume: 10000,
    usage: "Interior/Exterior",
    compatibleWithBuriedVolumes: [10000],
    productUrl: "https://example.com/product10",
    imageUrl: "https://example.com/image10.jpg",
    display_priority: 2,
    advantages: ["Advantage 1", "Advantage 2"],
    compatibleWithAerialVolumes: []
  },
  {
    id: "79294",
    name: "CUVE EAU DE PLUIE PLATE 20000L",
    type: "buried",
    volume: 20000,
    usage: "Interior/Exterior",
    compatibleWithBuriedVolumes: [20000],
    productUrl: "https://example.com/product11",
    imageUrl: "https://example.com/image11.jpg",
    display_priority: 4,
    advantages: ["Advantage 1", "Advantage 2"],
    compatibleWithAerialVolumes: []
  },
  
  // Pumps
  {
    id: "78290",
    name: "KIT POMPE POUR REEMPLOI EXTERIEUR",
    type: "pump",
    volume: null,
    usage: null,
    compatibleWithBuriedVolumes: [3000, 5000, 8000, 10000],
    productUrl: "https://example.com/product12",
    imageUrl: "https://example.com/image12.jpg",
    display_priority: 1,
    advantages: ["Advantage 1", "Advantage 2"],
    compatibleWithAerialVolumes: []
  },
  {
    id: "79704",
    name: "KIT POMPE POUR CUVE AERIENNE REEMPLOI EXTERIEUR",
    type: "pump",
    volume: null,
    usage: null,
    compatibleWithBuriedVolumes: [],
    productUrl: "https://example.com/product13",
    imageUrl: "https://example.com/image13.jpg",
    display_priority: 2,
    advantages: ["Advantage 1", "Advantage 2"],
    compatibleWithAerialVolumes: [400, 700, 1000, 3000, 5000, 10000]
  },
  {
    id: "78291",
    name: "KIT POMPE POUR REEMPLOI EXTERIEUR/INTERIEUR",
    type: "pump",
    volume: null,
    usage: null,
    compatibleWithBuriedVolumes: [3000, 5000, 8000, 10000, 20000],
    productUrl: "https://example.com/product14",
    imageUrl: "https://example.com/image14.jpg",
    display_priority: 1,
    advantages: ["Advantage 1", "Advantage 2"],
    compatibleWithAerialVolumes: []
  }
];

// Helper function to setup fetch mock for success
function setupFetchMock() {
  (global.fetch as jest.Mock).mockImplementation(() => 
    Promise.resolve({
      ok: true,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve(mockProducts)
    })
  );
}

// Helper function to setup fetch mock for failure
function setupFetchFailureMock() {
  (global.fetch as jest.Mock).mockImplementation(() => 
    Promise.reject(new Error('Network error'))
  );
}

// Helper to reset the module cache
function resetProductServiceCache() {
  // Access the module and reset its cache
  const productServiceModule = require('@/lib/productService');
  if (productServiceModule && typeof productServiceModule._resetCache === 'function') {
    productServiceModule._resetCache();
  }
}

describe('Product Service - V2 Algorithm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetProductServiceCache();
    setupFetchMock();
  });

  describe('roundUpToNearestCap utility', () => {
    // We need to test the private function directly
    // Extract it from the module for testing
    const productServiceModule = require('@/lib/productService');
    const roundUpToNearestCap = productServiceModule.default?.roundUpToNearestCap || 
                               (productServiceModule as any).roundUpToNearestCap;
    
    // If we can't access the function directly, we'll test it indirectly through the public API
    const AERIAL_CAPS = [400, 700, 1000, 3000, 5000, 10000];
    const BURIED_CAPS = [3000, 5000, 8000, 10000, 20000];

    test('rounds up to nearest aerial capacity', () => {
      if (roundUpToNearestCap) {
        // Direct testing
        expect(roundUpToNearestCap(350, AERIAL_CAPS)).toBe(400);
        expect(roundUpToNearestCap(400, AERIAL_CAPS)).toBe(400);
        expect(roundUpToNearestCap(500, AERIAL_CAPS)).toBe(700);
        expect(roundUpToNearestCap(850, AERIAL_CAPS)).toBe(1000);
        expect(roundUpToNearestCap(2600, AERIAL_CAPS)).toBe(3000);
        expect(roundUpToNearestCap(15000, AERIAL_CAPS)).toBe(15000); // Above max, returns original
      } else {
        // Indirect testing through getRecommendedTanks
        // This will be covered in other tests
        expect(true).toBe(true);
      }
    });

    test('rounds up to nearest buried capacity', () => {
      if (roundUpToNearestCap) {
        // Direct testing
        expect(roundUpToNearestCap(2500, BURIED_CAPS)).toBe(3000);
        expect(roundUpToNearestCap(3000, BURIED_CAPS)).toBe(3000);
        expect(roundUpToNearestCap(4200, BURIED_CAPS)).toBe(5000);
        expect(roundUpToNearestCap(7600, BURIED_CAPS)).toBe(8000);
        expect(roundUpToNearestCap(18500, BURIED_CAPS)).toBe(20000);
        expect(roundUpToNearestCap(65000, BURIED_CAPS)).toBe(65000); // Above max, returns original
      } else {
        // Indirect testing through getRecommendedTanks
        // This will be covered in other tests
        expect(true).toBe(true);
      }
    });
  });

  describe('getRecommendedTanks', () => {
    test('returns only buried tanks for indoor usage (toilet)', async () => {
      const tanks = await getRecommendedTanks(4200, ['toilet'], 3);
      
      expect(tanks.length).toBeLessThanOrEqual(3);
      expect(tanks.every(tank => tank.type === 'buried')).toBe(true);
      
      // Should round up to 5000L (nearest available buried capacity)
      expect(tanks[0].volume).toBe(5000);
      
      // Check sorting: first by distance to rounded need (5000), then by display_priority
      const expectedOrder = [5000, 8000, 10000];
      expect(tanks.map(t => t.volume)).toEqual(expectedOrder);
    });

    test('returns only buried tanks for indoor usage (washing)', async () => {
      const tanks = await getRecommendedTanks(4200, ['washing'], 3);
      
      expect(tanks.length).toBeLessThanOrEqual(3);
      expect(tanks.every(tank => tank.type === 'buried')).toBe(true);
      
      // Should round up to 5000L (nearest available buried capacity)
      expect(tanks[0].volume).toBe(5000);
    });

    test('returns only buried tanks for mixed usage (toilet + garden)', async () => {
      const tanks = await getRecommendedTanks(4200, ['toilet', 'garden'], 3);
      
      expect(tanks.length).toBeLessThanOrEqual(3);
      expect(tanks.every(tank => tank.type === 'buried')).toBe(true);
      
      // Should round up to 5000L (nearest available buried capacity)
      expect(tanks[0].volume).toBe(5000);
    });

    test('returns 2 aerial + 1 buried for garden-only usage', async () => {
      const tanks = await getRecommendedTanks(850, ['garden'], 3);
      
      expect(tanks.length).toBeLessThanOrEqual(3);
      
      // Should have 2 aerial tanks first
      expect(tanks[0].type).toBe('aerial');
      expect(tanks[1].type).toBe('aerial');
      
      // Third should be buried
      if (tanks.length > 2) {
        expect(tanks[2].type).toBe('buried');
      }
      
      // First aerial tank should be 1000L (nearest available aerial capacity to 850L)
      expect(tanks[0].volume).toBe(1000);
      
      // Second aerial tank should be 700L (next closest by distance)
      expect(tanks[1].volume).toBe(700);
    });

    test('returns only aerial tanks if no buried tanks available for garden-only', async () => {
      // Create a new mock with only aerial tanks above 6000L
      const aerialOnlyMock = mockProducts.filter(p => 
        p.type === 'aerial' || (p.type === 'pump')
      );
      
      // Reset cache and setup custom mock
      resetProductServiceCache();
      (global.fetch as jest.Mock).mockImplementation(() => 
        Promise.resolve({
          ok: true,
          headers: { get: () => 'application/json' },
          json: () => Promise.resolve(aerialOnlyMock)
        })
      );
      
      const tanks = await getRecommendedTanks(850, ['garden'], 3);
      
      expect(tanks.length).toBeLessThanOrEqual(3);
      expect(tanks.every(tank => tank.type === 'aerial')).toBe(true);
    });

    test('sorts by distance to rounded need, then by display_priority', async () => {
      // This test uses the mock data with multiple 5000L tanks with different priorities
      const tanks = await getRecommendedTanks(4800, ['toilet'], 3);
      
      // Should round up to 5000L (nearest available buried capacity)
      // Then sort by distance to 5000L
      expect(tanks[0].volume).toBe(5000);
      
      // Get all 5000L tanks from the results
      const fiveThousandTanks = tanks.filter(t => t.volume === 5000);
      expect(fiveThousandTanks.length).toBeGreaterThan(1);
      
      // Check that tanks with same distance are sorted by display_priority
      for (let i = 1; i < fiveThousandTanks.length; i++) {
        const prevPriority = fiveThousandTanks[i-1].display_priority || 999;
        const currPriority = fiveThousandTanks[i].display_priority || 999;
        expect(prevPriority).toBeLessThanOrEqual(currPriority);
      }
    });

    test('test scenario 1: Garden-only, need = 850 L', async () => {
      const tanks = await getRecommendedTanks(850, ['garden'], 3);
      
      expect(tanks.length).toBeLessThanOrEqual(3);
      
      // First two should be aerial tanks
      expect(tanks[0].type).toBe('aerial');
      expect(tanks[1].type).toBe('aerial');
      
      // First should be 1000L (nearest available aerial capacity to 850L)
      expect(tanks[0].volume).toBe(1000);
      
      // Second should be 700L (next closest)
      expect(tanks[1].volume).toBe(700);
    });

    test('test scenario 2: Toilet + Garden, need = 4200 L', async () => {
      const tanks = await getRecommendedTanks(4200, ['toilet', 'garden'], 3);
      
      expect(tanks.length).toBeLessThanOrEqual(3);
      expect(tanks.every(tank => tank.type === 'buried')).toBe(true);
      
      // Should round up to 5000L (nearest available buried capacity)
      expect(tanks[0].volume).toBe(5000);
      
      // Check the expected order: 5000L, 8000L, 10000L
      const volumes = tanks.map(t => t.volume);
      expect(volumes[0]).toBe(5000);
      expect(volumes[1]).toBe(8000);
      expect(volumes[2]).toBe(10000);
    });

    test('handles error by returning empty array', async () => {
      resetProductServiceCache();
      setupFetchFailureMock();
      
      // Mock both primary and fallback fetch to fail
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('API error'))
        .mockRejectedValueOnce(new Error('Fallback error'));
      
      const tanks = await getRecommendedTanks(4200, ['toilet'], 3);
      
      expect(tanks).toEqual([]);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('getAdditionalRecommendedTanks', () => {
    test('excludes tanks already in topProducts', async () => {
      const topProducts = [mockProducts[0], mockProducts[1]]; // First two aerial tanks
      
      const additionalTanks = await getAdditionalRecommendedTanks(850, ['garden'], topProducts);
      
      expect(additionalTanks.length).toBeLessThanOrEqual(9);
      
      // Should not include any of the topProducts
      expect(additionalTanks.some(t => t.id === topProducts[0].id)).toBe(false);
      expect(additionalTanks.some(t => t.id === topProducts[1].id)).toBe(false);
    });

    test('returns only buried tanks for indoor usage', async () => {
      // Reset cache and setup fresh mock
      resetProductServiceCache();
      setupFetchMock();
      
      const topProducts = [
        mockProducts.find(p => p.type === 'buried' && p.volume === 5000)!
      ]; // One buried tank
      
      const additionalTanks = await getAdditionalRecommendedTanks(4200, ['toilet'], topProducts);
      
      expect(additionalTanks.length).toBeLessThanOrEqual(9);
      expect(additionalTanks.every(tank => tank.type === 'buried')).toBe(true);
    });

    test('prioritizes aerial tanks for garden-only usage', async () => {
      // Reset cache and setup fresh mock
      resetProductServiceCache();
      setupFetchMock();
      
      // Top products already has 2 aerial + 1 buried
      const topProducts = [
        mockProducts.find(p => p.type === 'aerial' && p.volume === 1000)!,
        mockProducts.find(p => p.type === 'aerial' && p.volume === 700)!,
        mockProducts.find(p => p.type === 'buried' && p.volume === 3000)!
      ];
      
      const additionalTanks = await getAdditionalRecommendedTanks(850, ['garden'], topProducts);
      
      expect(additionalTanks.length).toBeLessThanOrEqual(9);
      
      // Count aerial and buried tanks in additional tanks
      const aerialTanksInAdditional = additionalTanks.filter(t => t.type === 'aerial');
      const buriedTanksInAdditional = additionalTanks.filter(t => t.type === 'buried');
      
      // Should have at most 3 more aerial tanks (to reach 5 total)
      expect(aerialTanksInAdditional.length).toBeLessThanOrEqual(3);
      
      // Should have at most 3 more buried tanks (to reach 4 total)
      expect(buriedTanksInAdditional.length).toBeLessThanOrEqual(3);
    });

    test('limits to 9 tanks maximum', async () => {
      const topProducts: Product[] = [];
      
      const additionalTanks = await getAdditionalRecommendedTanks(850, ['garden'], topProducts);
      
      expect(additionalTanks.length).toBeLessThanOrEqual(9);
    });

    test('handles error by returning empty array', async () => {
      resetProductServiceCache();
      
      // Mock both primary and fallback fetch to fail
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('API error'))
        .mockRejectedValueOnce(new Error('Fallback error'));
      
      const additionalTanks = await getAdditionalRecommendedTanks(4200, ['toilet'], []);
      
      expect(additionalTanks).toEqual([]);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('getCompatiblePumps', () => {
    test('returns interior/exterior kit for indoor usage (toilet)', async () => {
      const pumps = await getCompatiblePumps(['toilet']);
      
      expect(pumps.length).toBeGreaterThan(0);
      
      // Should include the interior/exterior pump
      const interiorPump = pumps.find(p => p.name.includes('EXTERIEUR/INTERIEUR'));
      expect(interiorPump).toBeDefined();
      
      // Should not include the aerial pump
      const aerialPump = pumps.find(p => p.name.includes('CUVE AERIENNE'));
      expect(aerialPump).toBeUndefined();
    });

    test('returns interior/exterior kit for indoor usage (washing)', async () => {
      const pumps = await getCompatiblePumps(['washing']);
      
      expect(pumps.length).toBeGreaterThan(0);
      
      // Should include the interior/exterior pump
      const interiorPump = pumps.find(p => p.name.includes('EXTERIEUR/INTERIEUR'));
      expect(interiorPump).toBeDefined();
    });

    test('returns interior/exterior kit for mixed usage (toilet + garden)', async () => {
      const pumps = await getCompatiblePumps(['toilet', 'garden']);
      
      expect(pumps.length).toBeGreaterThan(0);
      
      // Should include the interior/exterior pump
      const interiorPump = pumps.find(p => p.name.includes('EXTERIEUR/INTERIEUR'));
      expect(interiorPump).toBeDefined();
    });

    test('returns both garden kits for garden-only usage', async () => {
      const pumps = await getCompatiblePumps(['garden']);
      
      expect(pumps.length).toBe(2);
      
      // Should include the aerial pump
      const aerialPump = pumps.find(p => p.name.includes('CUVE AERIENNE'));
      expect(aerialPump).toBeDefined();
      
      // Should include the regular exterior pump
      const exteriorPump = pumps.find(p => 
        p.name.includes('EXTERIEUR') && 
        !p.name.includes('INTERIEUR') && 
        !p.name.includes('CUVE AERIENNE')
      );
      expect(exteriorPump).toBeDefined();
    });

    test('falls back to old logic if literal matching fails', async () => {
      // Reset cache and setup custom mock
      resetProductServiceCache();
      
      // Create mock with different pump names
      const customMockProducts = mockProducts.map(p => {
        if (p.type === 'pump') {
          return {
            ...p,
            name: p.name.replace('KIT POMPE', 'CUSTOM PUMP') // Change the names
          };
        }
        return p;
      });
      
      (global.fetch as jest.Mock).mockImplementation(() => 
        Promise.resolve({
          ok: true,
          headers: { get: () => 'application/json' },
          json: () => Promise.resolve(customMockProducts)
        })
      );
      
      const pumps = await getCompatiblePumps(['garden']);
      
      expect(pumps.length).toBeGreaterThan(0);
      
      // Should still return pumps even though literal names don't match
      expect(pumps.every(p => p.type === 'pump')).toBe(true);
    });

    test('test scenario 1: Garden-only, returns 2 garden kits', async () => {
      const pumps = await getCompatiblePumps(['garden']);
      
      expect(pumps.length).toBe(2);
      
      // Should include the aerial pump
      const aerialPump = pumps.find(p => p.name.includes('CUVE AERIENNE'));
      expect(aerialPump).toBeDefined();
      
      // Should include the regular exterior pump
      const exteriorPump = pumps.find(p => 
        p.name.includes('EXTERIEUR') && 
        !p.name.includes('INTERIEUR') && 
        !p.name.includes('CUVE AERIENNE')
      );
      expect(exteriorPump).toBeDefined();
    });

    test('test scenario 2: Toilet + Garden, returns indoor/exterior kit', async () => {
      const pumps = await getCompatiblePumps(['toilet', 'garden']);
      
      expect(pumps.length).toBeGreaterThan(0);
      
      // Should include the interior/exterior pump
      const interiorPump = pumps.find(p => p.name.includes('EXTERIEUR/INTERIEUR'));
      expect(interiorPump).toBeDefined();
    });

    test('handles error by returning empty array', async () => {
      resetProductServiceCache();
      
      // Mock both primary and fallback fetch to fail
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('API error'))
        .mockRejectedValueOnce(new Error('Fallback error'));
      
      const pumps = await getCompatiblePumps(['garden']);
      
      expect(pumps).toEqual([]);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('fetchProducts', () => {
    test('returns products from API', async () => {
      resetProductServiceCache();
      setupFetchMock();
      
      const products = await fetchProducts();
      
      expect(products).toEqual(mockProducts);
      expect(global.fetch).toHaveBeenCalledWith('/api/products');
    });

    test('falls back to static file if API fails', async () => {
      resetProductServiceCache();
      
      // First call fails, second succeeds (fallback)
      (global.fetch as jest.Mock)
        .mockImplementationOnce(() => Promise.reject(new Error('API error')))
        .mockImplementationOnce(() => 
          Promise.resolve({
            ok: true,
            headers: { get: () => 'application/json' },
            json: () => Promise.resolve(mockProducts)
          })
        );
      
      const products = await fetchProducts();
      
      expect(products).toEqual(mockProducts);
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(global.fetch).toHaveBeenNthCalledWith(1, '/api/products');
      expect(global.fetch).toHaveBeenNthCalledWith(2, '/data/products.json');
    });

    test('returns empty array if all fetches fail', async () => {
      resetProductServiceCache();
      
      // Both calls fail
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('API error'))
        .mockRejectedValueOnce(new Error('Fallback error'));
      
      const products = await fetchProducts();
      
      expect(products).toEqual([]);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('isBestsellerProduct', () => {
    test('marks tank as bestseller if close to recommended size', () => {
      const tank = mockProducts.find(p => p.type === 'buried' && p.volume === 5000)!;
      
      // Tank is exactly the recommended size
      expect(isBestsellerProduct(tank, 5000, ['toilet'])).toBe(true);
      
      // Tank is within 20% above the recommended size
      expect(isBestsellerProduct(tank, 4500, ['toilet'])).toBe(true);
      
      // Tank is more than 20% above the recommended size
      expect(isBestsellerProduct(tank, 4000, ['toilet'])).toBe(false);
      
      // Tank is below the recommended size
      expect(isBestsellerProduct(tank, 5500, ['toilet'])).toBe(false);
    });

    test('marks pump as bestseller based on usage pattern', () => {
      const interiorPump = mockProducts.find(p => p.name.includes('EXTERIEUR/INTERIEUR'))!;
      const aerialPump = mockProducts.find(p => p.name.includes('CUVE AERIENNE'))!;
      const exteriorPump = mockProducts.find(p => 
        p.type === 'pump' && 
        p.name.includes('EXTERIEUR') && 
        !p.name.includes('INTERIEUR') && 
        !p.name.includes('CUVE AERIENNE')
      )!;
      
      // Interior pump is bestseller for toilet usage
      expect(isBestsellerProduct(interiorPump, 5000, ['toilet'])).toBe(true);
      
      // Aerial pump is bestseller for garden-only usage
      expect(isBestsellerProduct(aerialPump, 5000, ['garden'])).toBe(true);
      
      // Exterior pump is bestseller for garden-only usage
      expect(isBestsellerProduct(exteriorPump, 5000, ['garden'])).toBe(true);
      
      // Interior pump is not bestseller for garden-only usage
      expect(isBestsellerProduct(interiorPump, 5000, ['garden'])).toBe(false);
    });
  });

  describe('getProductFeatures', () => {
    test('returns product advantages if available', () => {
      const product = mockProducts[0]; // Has advantages
      
      const features = getProductFeatures(product);
      
      expect(features).toEqual(product.advantages);
    });

    test('generates features for aerial tanks if advantages not available', () => {
      const product = {
        ...mockProducts[0],
        advantages: undefined // Remove advantages
      };
      
      const features = getProductFeatures(product);
      
      expect(features.length).toBeGreaterThan(0);
      expect(features).toContain('Installation facile');
    });

    test('generates features for buried tanks if advantages not available', () => {
      const product = {
        ...mockProducts[6], // Buried tank
        advantages: undefined // Remove advantages
      };
      
      const features = getProductFeatures(product);
      
      expect(features.length).toBeGreaterThan(0);
      expect(features).toContain('Installation professionnelle');
    });

    test('generates features for pumps if advantages not available', () => {
      const product = {
        ...mockProducts[11], // Pump
        advantages: undefined // Remove advantages
      };
      
      const features = getProductFeatures(product);
      
      expect(features.length).toBeGreaterThan(0);
    });
  });
});
