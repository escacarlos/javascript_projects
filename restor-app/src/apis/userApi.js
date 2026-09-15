import { doRequest } from './utils'
import { USER_API_BASE_URL } from './config'

/**
 * Gets a user by id (HTTP call only).
 */
export async function getUserById(id) {
  return doRequest(`${USER_API_BASE_URL}/${id}`, 'GET')
}

/**
 * Gets a user's favorite lists (HTTP call only).
 */
export async function getFavoriteLists(userId) {
  return doRequest(`${USER_API_BASE_URL}/${userId}/favorites`, 'GET')
}

/**
 * Gets all restaurant visits for a user with pagination (HTTP call only).
 */
export async function getAllUserRestaurantVisits(userId) {
  const limit = 100
  const allItems = []
  let offset = 0
  let total = null

  while (true) {
    const data = await doRequest(
      `${USER_API_BASE_URL}/${userId}/restaurants/visits?limit=${limit}&offset=${offset}`,
      'GET',
    )
    if (total === null) total = data.total ?? 0
    if (!data.items?.length) break
    allItems.push(...data.items)
    if (allItems.length >= total || data.items.length < limit) break
    offset += limit
    if (offset >= 100 * 10) break
  }

  return { items: allItems, total: total ?? allItems.length }
}

/**
 * Creates a visit (HTTP call only).
 * @param {string} userId - User id
 * @param {Object} body - The body of the request
 */
export async function createVisit(userId, body) {
  return doRequest(`${USER_API_BASE_URL}/${userId}/restaurants/visits`, 'POST', body)
}

/**
 * Recherche globale d'usagers
 */
export async function searchUsers(query, limit = 10, offset = 0) {
  return doRequest(`${USER_API_BASE_URL}?q=${query}&limit=${limit}&offset=${offset}`, 'GET')
}
