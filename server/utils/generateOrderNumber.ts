/**
 * Generate unique order number with format: MLA-YYYYMMDD-XXXX
 * Example: MLA-20250123-0001
 * 
 * @param counter - Auto-increment counter for the day
 * @returns Formatted order number
 */
export function generateOrderNumber(counter: number = 1): string {
  // Get current date
  const now = new Date();
  
  // Format date as YYYYMMDD
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;
  
  // Format counter with leading zeros (4 digits)
  const counterStr = String(counter).padStart(4, '0');
  
  // Combine to create order number
  return `MLA-${dateStr}-${counterStr}`;
}

/**
 * Parse order number to extract date and counter
 * @param orderNumber - Order number string (e.g., "MLA-20250123-0001")
 * @returns Object with date and counter, or null if invalid format
 */
export function parseOrderNumber(orderNumber: string): { 
  date: Date; 
  counter: number; 
} | null {
  // Validate format
  const pattern = /^MLA-(\d{8})-(\d{4})$/;
  const match = orderNumber.match(pattern);
  
  if (!match) {
    return null;
  }
  
  const [, dateStr, counterStr] = match;
  
  // Parse date
  const year = parseInt(dateStr.substring(0, 4));
  const month = parseInt(dateStr.substring(4, 6)) - 1; // Month is 0-indexed
  const day = parseInt(dateStr.substring(6, 8));
  const date = new Date(year, month, day);
  
  // Parse counter
  const counter = parseInt(counterStr);
  
  return { date, counter };
}

/**
 * Get next order number for today
 * This function should query the database to find the highest counter for today
 * and increment it. For now, it's a placeholder that generates a random counter.
 * 
 * @param getLastCounterFn - Optional function to get last counter from database
 * @returns Next order number
 */
export async function getNextOrderNumber(
  getLastCounterFn?: () => Promise<number>
): Promise<string> {
  let counter = 1;
  
  if (getLastCounterFn) {
    const lastCounter = await getLastCounterFn();
    counter = lastCounter + 1;
  } else {
    // Default: use timestamp-based counter to avoid collisions
    counter = Math.floor(Date.now() / 1000) % 10000;
  }
  
  return generateOrderNumber(counter);
}

/**
 * Validate order number format
 * @param orderNumber - Order number to validate
 * @returns True if valid format
 */
export function isValidOrderNumber(orderNumber: string): boolean {
  const pattern = /^MLA-\d{8}-\d{4}$/;
  return pattern.test(orderNumber);
}

/**
 * Get date from order number
 * @param orderNumber - Order number string
 * @returns Date object or null if invalid
 */
export function getOrderDate(orderNumber: string): Date | null {
  const parsed = parseOrderNumber(orderNumber);
  return parsed ? parsed.date : null;
}

/**
 * Format order number for display (with spaces)
 * @param orderNumber - Order number string
 * @returns Formatted string (e.g., "MLA 20250123 0001")
 */
export function formatOrderNumber(orderNumber: string): string {
  if (!isValidOrderNumber(orderNumber)) {
    return orderNumber;
  }
  
  const parts = orderNumber.split('-');
  return parts.join(' ');
}
