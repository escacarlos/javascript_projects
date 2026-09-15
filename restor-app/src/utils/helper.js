/**
 * Format a number to a readable format
 * @param {string} degit - The number to format
 * @returns {string} The formatted number
 */
export function formatDegit(degit) {
  return Number(degit).toFixed(2)
}

/**
 * Format a price range to a readable format
 * @param {string} price - The price to format
 * @returns {string} The formatted price
 */
export function formatPriceRange(price) {
  return '$'.repeat(Math.max(1, Math.min(5, Number(price) || 1)))
}

/**
 * Format a date to a readable format
 * @param {string} date - The date to format
 * @returns {string} The formatted date
 */
export function formatDate(date) {
  return new Date(date).toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
