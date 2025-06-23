/**
 * Volume calculation utilities for tank size recommendations
 * Based on the available tank sizes in the product catalog
 */

/**
 * Tank types
 */
export type TankType = 'aerial' | 'buried';

/**
 * Returns the available tank volumes in liters for a given tank type
 * @param type The tank type ('aerial' or 'buried')
 * @returns Array of available volumes in liters, sorted in ascending order
 */
export function getAvailableTankVolumes(type: TankType): number[] {
  if (type === 'aerial') {
    // Aerial tank volumes from the product catalog
    return [400, 465, 700, 1000, 3000, 5000, 10000];
  } else {
    // Buried tank volumes from the product catalog
    return [
      2000, 3000, 4000, 5000, 6000, 7000, 8000, 10000, 
      15000, 20000, 25000, 30000, 35000, 40000, 45000, 
      50000, 55000, 60000
    ];
  }
}

/**
 * Maximum available tank volume in liters
 */
export const MAX_TANK_VOLUME = 60000;

/**
 * Rounds up a calculated volume to the next available tank size
 * @param calculatedVolume The calculated volume in liters
 * @param tankType The type of tank ('aerial' or 'buried')
 * @returns The next available tank size in liters
 */
export function ceilToAvailableVolume(calculatedVolume: number, tankType: TankType): number {
  // Get the available volumes for the tank type
  const availableVolumes = getAvailableTankVolumes(tankType);
  
  // If the calculated volume exceeds the maximum available volume,
  // return the maximum volume (with a note that a custom solution might be needed)
  if (calculatedVolume >= MAX_TANK_VOLUME) {
    return MAX_TANK_VOLUME;
  }
  
  // Find the smallest available volume that is greater than or equal to the calculated volume
  for (const volume of availableVolumes) {
    if (volume >= calculatedVolume) {
      return volume;
    }
  }
  
  // If no suitable volume is found (which shouldn't happen given our checks),
  // return the largest available volume
  return availableVolumes[availableVolumes.length - 1];
}

/**
 * Determines the appropriate tank type based on the required volume
 * Prefers aerial tanks for smaller volumes, buried for larger volumes
 * @param volumeInLiters The required volume in liters
 * @returns The recommended tank type ('aerial' or 'buried')
 */
export function determineRecommendedTankType(volumeInLiters: number): TankType {
  // Get available aerial tank volumes
  const aerialVolumes = getAvailableTankVolumes('aerial');
  const maxAerialVolume = aerialVolumes[aerialVolumes.length - 1];
  
  // If the volume is within the range of aerial tanks and <= 1000L, prefer aerial
  if (volumeInLiters <= 1000) {
    return 'aerial';
  }
  
  // For volumes > 1000L or that exceed aerial capacity, recommend buried
  return 'buried';
}

/**
 * Gets the recommended tank size based on the calculated volume
 * Automatically determines the appropriate tank type and rounds to the next available size
 * @param calculatedVolumeInLiters The calculated volume in liters
 * @returns An object containing the recommended volume and tank type
 */
export function getRecommendedTankSize(calculatedVolumeInLiters: number): { 
  volume: number; 
  tankType: TankType;
  isCustomSolution: boolean;
} {
  // Determine the recommended tank type
  const recommendedTankType = determineRecommendedTankType(calculatedVolumeInLiters);
  
  // Round up to the next available volume
  const recommendedVolume = ceilToAvailableVolume(calculatedVolumeInLiters, recommendedTankType);
  
  // Determine if this is a custom solution (volume at maximum)
  const isCustomSolution = recommendedVolume === MAX_TANK_VOLUME && 
                           calculatedVolumeInLiters > MAX_TANK_VOLUME;
  
  return {
    volume: recommendedVolume,
    tankType: recommendedTankType,
    isCustomSolution
  };
}
