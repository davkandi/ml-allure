/**
 * Calculate delivery fee based on zone and order subtotal
 * Zones in Kinshasa, DRC with delivery fees in USD
 */

export interface DeliveryFeeResult {
  fee: number;
  zone: string;
  currency: string;
  isFree: boolean;
  freeDeliveryThreshold: number;
}

// Delivery fee configuration (in USD)
const DELIVERY_ZONES: Record<string, number> = {
  // Primary zones - Lower fees
  'gombe': 5,
  'gombé': 5,
  
  // Secondary zones
  'kinshasa': 7,
  
  // Tertiary zones
  'ngaliema': 6,
  'kalamu': 6,
  'kasa-vubu': 6,
  'kasa vubu': 6,
  'kasavubu': 6,
  'limete': 6,
  'limété': 6,
  'lingwala': 6,
  'barumbu': 6,
  
  // Outer zones - Higher fees
  'lemba': 8,
  'matete': 8,
  'ngiri-ngiri': 8,
  'ngiri ngiri': 8,
  'ngiringiri': 8,
  'bumbu': 8,
  'makala': 8,
  'selembao': 8,
  'selembao': 8,
  'kimbanseke': 9,
  'masina': 9,
  'ndjili': 9,
  'n\'djili': 9,
  'mont-ngafula': 9,
  'mont ngafula': 9,
  'ngaliema': 9,
  
  // Default for unknown zones
  'default': 10,
};

// Free delivery threshold (in USD)
const FREE_DELIVERY_THRESHOLD = 100;

/**
 * Calculate delivery fee based on zone and order subtotal
 * @param zone - The delivery zone/commune
 * @param subtotal - Order subtotal amount
 * @returns Delivery fee details
 */
export function calculateDeliveryFee(
  zone: string | undefined,
  subtotal: number
): DeliveryFeeResult {
  // If subtotal exceeds threshold, delivery is free
  if (subtotal >= FREE_DELIVERY_THRESHOLD) {
    return {
      fee: 0,
      zone: zone || 'N/A',
      currency: 'USD',
      isFree: true,
      freeDeliveryThreshold: FREE_DELIVERY_THRESHOLD,
    };
  }

  // Normalize zone name (lowercase, trim)
  const normalizedZone = zone?.toLowerCase().trim() || 'default';
  
  // Get delivery fee for zone (default to 10 if not found)
  const fee = DELIVERY_ZONES[normalizedZone] || DELIVERY_ZONES['default'];

  return {
    fee,
    zone: zone || 'Unknown',
    currency: 'USD',
    isFree: false,
    freeDeliveryThreshold: FREE_DELIVERY_THRESHOLD,
  };
}

/**
 * Get all available delivery zones with their fees
 * @returns Array of zones with fees
 */
export function getDeliveryZones(): Array<{ name: string; fee: number }> {
  return Object.entries(DELIVERY_ZONES)
    .filter(([name]) => name !== 'default')
    .map(([name, fee]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      fee,
    }))
    .sort((a, b) => a.fee - b.fee || a.name.localeCompare(b.name));
}

/**
 * Check if delivery is free for given subtotal
 * @param subtotal - Order subtotal amount
 * @returns Boolean indicating if delivery is free
 */
export function isDeliveryFree(subtotal: number): boolean {
  return subtotal >= FREE_DELIVERY_THRESHOLD;
}

/**
 * Calculate amount needed for free delivery
 * @param subtotal - Current order subtotal
 * @returns Amount needed to qualify for free delivery, or 0 if already qualified
 */
export function amountNeededForFreeDelivery(subtotal: number): number {
  if (subtotal >= FREE_DELIVERY_THRESHOLD) {
    return 0;
  }
  return FREE_DELIVERY_THRESHOLD - subtotal;
}
