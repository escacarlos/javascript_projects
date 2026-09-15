import { doRequest } from './utils'
import { FAVORITE_API_BASE_URL } from './config'

/**
 * Creates a favorite list (HTTP call only).
 */
export async function createFavoriteList(listData) {
  return doRequest(FAVORITE_API_BASE_URL, 'POST', listData)
}

/**
 * Updates a favorite list (HTTP call only).
 */
export async function updateFavoriteList(id, data) {
  return doRequest(`${FAVORITE_API_BASE_URL}/${id}`, 'PUT', data)
}

/**
 * Deletes a favorite list (HTTP call only).
 */
export async function deleteFavoriteList(id) {
  return doRequest(`${FAVORITE_API_BASE_URL}/${id}`, 'DELETE')
}

/**
 * Adds a restaurant to a favorite list (HTTP call only).
 */
export async function addRestaurantToFavorite(favoriteId, restaurantId) {
  return doRequest(`${FAVORITE_API_BASE_URL}/${favoriteId}/restaurants`, 'POST', {
    id: restaurantId,
  })
}

/**
 * Removes a restaurant from a favorite list (HTTP call only).
 */
export async function removeRestaurantFromFavorite(favoriteId, restaurantId) {
  return doRequest(`${FAVORITE_API_BASE_URL}/${favoriteId}/restaurants/${restaurantId}`, 'DELETE')
}
