/**
 * Generate SKU (Stock Keeping Unit) for product variants
 * Format: PROD-{productId}-{size}-{color}
 * Example: PROD-123-M-RED
 * 
 * @param productId - Product ID
 * @param size - Size (e.g., "S", "M", "L", "XL")
 * @param color - Color (e.g., "RED", "BLUE", "BLACK")
 * @returns Generated SKU
 */
export function generateSKU(
  productId: number | string,
  size?: string,
  color?: string
): string {
  // Base SKU with product ID
  let sku = `PROD-${productId}`;
  
  // Add size if provided
  if (size) {
    const sizeFormatted = size.toUpperCase().replace(/\s+/g, '-');
    sku += `-${sizeFormatted}`;
  }
  
  // Add color if provided
  if (color) {
    const colorFormatted = color.toUpperCase().replace(/\s+/g, '-');
    sku += `-${colorFormatted}`;
  }
  
  return sku;
}

/**
 * Generate SKU with sanitized attributes
 * Removes special characters and normalizes format
 * 
 * @param productId - Product ID
 * @param attributes - Object with size, color, and other attributes
 * @returns Generated SKU
 */
export function generateSKUFromAttributes(
  productId: number | string,
  attributes: {
    size?: string;
    color?: string;
    material?: string;
    style?: string;
    [key: string]: string | undefined;
  }
): string {
  let sku = `PROD-${productId}`;
  
  // Add size
  if (attributes.size) {
    sku += `-${sanitizeAttribute(attributes.size)}`;
  }
  
  // Add color
  if (attributes.color) {
    sku += `-${sanitizeAttribute(attributes.color)}`;
  }
  
  // Add material (optional)
  if (attributes.material) {
    sku += `-${sanitizeAttribute(attributes.material)}`;
  }
  
  // Add style (optional)
  if (attributes.style) {
    sku += `-${sanitizeAttribute(attributes.style)}`;
  }
  
  return sku;
}

/**
 * Sanitize attribute value for SKU
 * Removes special characters, converts to uppercase, replaces spaces with hyphens
 * 
 * @param value - Attribute value
 * @returns Sanitized value
 */
function sanitizeAttribute(value: string): string {
  return value
    .toUpperCase()
    .trim()
    .replace(/[^A-Z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-'); // Replace multiple hyphens with single
}

/**
 * Parse SKU to extract product ID and attributes
 * 
 * @param sku - SKU string
 * @returns Object with productId and attributes, or null if invalid
 */
export function parseSKU(sku: string): {
  productId: string;
  size?: string;
  color?: string;
  material?: string;
  style?: string;
} | null {
  // Validate SKU format
  if (!sku.startsWith('PROD-')) {
    return null;
  }
  
  const parts = sku.split('-');
  
  if (parts.length < 2) {
    return null;
  }
  
  const result: any = {
    productId: parts[1]
  };
  
  // Extract attributes based on position
  if (parts.length > 2) result.size = parts[2];
  if (parts.length > 3) result.color = parts[3];
  if (parts.length > 4) result.material = parts[4];
  if (parts.length > 5) result.style = parts[5];
  
  return result;
}

/**
 * Validate SKU format
 * 
 * @param sku - SKU string to validate
 * @returns True if valid format
 */
export function isValidSKU(sku: string): boolean {
  const pattern = /^PROD-[A-Z0-9]+((-[A-Z0-9]+)*)$/;
  return pattern.test(sku);
}

/**
 * Generate batch of SKUs for multiple variants
 * 
 * @param productId - Product ID
 * @param variants - Array of variant objects
 * @returns Array of generated SKUs
 */
export function generateSKUBatch(
  productId: number | string,
  variants: Array<{ size?: string; color?: string }>
): string[] {
  return variants.map(variant => 
    generateSKU(productId, variant.size, variant.color)
  );
}

/**
 * Format SKU for display (with spaces)
 * 
 * @param sku - SKU string
 * @returns Formatted SKU
 */
export function formatSKU(sku: string): string {
  if (!isValidSKU(sku)) {
    return sku;
  }
  
  return sku.replace(/-/g, ' ');
}

/**
 * Get color code from common color names
 * Useful for generating standardized SKUs
 */
export const COLOR_CODES: Record<string, string> = {
  'noir': 'BLK',
  'blanc': 'WHT',
  'rouge': 'RED',
  'bleu': 'BLU',
  'vert': 'GRN',
  'jaune': 'YEL',
  'orange': 'ORG',
  'violet': 'PUR',
  'rose': 'PNK',
  'gris': 'GRY',
  'marron': 'BRN',
  'beige': 'BGE',
  'marine': 'NVY',
  'bordeaux': 'BOR',
  'or': 'GLD',
  'argent': 'SLV',
  'black': 'BLK',
  'white': 'WHT',
  'red': 'RED',
  'blue': 'BLU',
  'green': 'GRN',
  'yellow': 'YEL',
  'orange': 'ORG',
  'purple': 'PUR',
  'pink': 'PNK',
  'gray': 'GRY',
  'brown': 'BRN',
  'beige': 'BGE',
  'navy': 'NVY',
  'burgundy': 'BOR',
  'gold': 'GLD',
  'silver': 'SLV',
};

/**
 * Get size code from size names
 */
export const SIZE_CODES: Record<string, string> = {
  'extra small': 'XS',
  'small': 'S',
  'medium': 'M',
  'large': 'L',
  'extra large': 'XL',
  'xxl': '2XL',
  'xxxl': '3XL',
  'petit': 'S',
  'moyen': 'M',
  'grand': 'L',
};
