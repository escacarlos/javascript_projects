import {
  getRestaurantById as getRestaurantByIdApi,
  searchRestaurants as searchRestaurantsApi,
} from '../apis/restaurantsApi'

/**
 * Gets a restaurant by id.
 * @param {string} id - Restaurant id
 * @returns {Promise<Restaurant|null>}
 */
export async function getRestaurantById(id) {
  return getRestaurantByIdApi(id)
}

/**
 * Searches restaurants with filters and pagination.
 * @param {string} searchText
 * @param {string[]} selectedPrices
 * @param {string[]} selectedGenres
 * @param {number} page
 * @param {number} limit
 * @returns {Promise<{ items: Restaurant[], total: number }>}
 */
export async function searchRestaurants(
  searchText,
  selectedPrices = '',
  selectedGenres = '',
  page = 0,
  limit = 10,
  longitude = undefined,
  latitude = undefined,
) {
  return searchRestaurantsApi(
    searchText,
    selectedPrices,
    selectedGenres,
    page,
    limit,
    longitude,
    latitude,
  )
}

/**
 * Get similar restaurants based on current restaurant
 * @param {string} restaurantId - The id of the current restaurant
 * @param {number} limit - Maximum number of similar restaurants to return
 * @returns {Promise<Restaurant[]>} Promise that resolves to array of similar restaurants
 */
export async function getSimilarRestaurants(currentRestaurant, limit = 6) {
  return searchRestaurants(
    '',
    currentRestaurant.price_range,
    currentRestaurant.genres,
    0,
    limit + 2,
  )
    .then((data) => data.items)
    .then((items) => items.filter((item) => item.id !== currentRestaurant.id))
    .then((items) => items.slice(0, limit))
}
