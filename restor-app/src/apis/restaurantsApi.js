import { doRequest } from './utils'
import { RESTAURANTS_API_BASE_URL } from './config'

/**
 * Get a restaurant by id from the API
 * @param {string} id - The id of the restaurant
 * @returns {Promise<Restaurant|null>} Promise that resolves to the restaurant or null if not found
 */
export async function getRestaurantById(id) {
  return doRequest(`${RESTAURANTS_API_BASE_URL}/${id}`, 'GET')
}

/**
 * Search for restaurants based on search text, selected prices, and selected genres
 * @param {string} searchText - The search text
 * @param {string[]} selectedPrices - The selected prices
 * @param {string[]} selectedGenres - The selected genres
 * @param {number} page - The page number
 * @param {number} limit - The limit of restaurants per page
 * @returns {Restaurant[]} The filtered restaurants
 */
export async function searchRestaurants(
  searchText,
  selectedPrices,
  selectedGenres,
  page,
  limit,
  longitude,
  latitude,
) {
  let url = `${RESTAURANTS_API_BASE_URL}?limit=${limit}&page=${page}`
  if (searchText) {
    url += `&q=${searchText}`
  }
  if (selectedPrices.length > 0) {
    url += `&price_range=${selectedPrices.join(',')}`
  }
  if (selectedGenres.length > 0) {
    url += `&genres=${selectedGenres.join(',')}`
  }
  if (longitude !== undefined && latitude !== undefined) {
    url += `&lon=${longitude}&lat=${latitude}`
  }
  return doRequest(url, 'GET').then((data) => ({
    items: data.items ?? [],
    total: typeof data.total === 'number' ? data.total : (data.items ?? []).length,
  }))
}
