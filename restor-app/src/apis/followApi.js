import { doRequest } from './utils'
import { API_BASE_URL } from './config'

/**
 * Follows a user.
 * @param {string} userId - The ID of the user to follow
 */
export async function followUser(userId) {
  return doRequest(`${API_BASE_URL}/follow`, 'POST', { id: userId })
}

/**
 * Unfollows a user.
 */
export async function unfollowUser(userId) {
  return doRequest(`${API_BASE_URL}/follow/${userId}`, 'DELETE')
}
