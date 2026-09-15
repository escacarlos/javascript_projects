import { doRequest } from './utils'
import { API_BASE_URL } from './config'

/**
 * Auth API: low-level HTTP calls for authentication.
 */

/**
 * Logs a user in.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ token: string }>}
 */
export async function login(email, password) {
  return doRequest(`${API_BASE_URL}/login`, 'POST', { email, password })
}

/**
 * Signs a user up.
 * @param {string} name
 * @param {string} email
 * @param {string} password
 * @returns {Promise<any>}
 */
export async function signup(name, email, password) {
  return doRequest(`${API_BASE_URL}/signup`, 'POST', { name, email, password })
}

/**
 * Gets information about the current token / authenticated user.
 * @returns {Promise<any>}
 */
export async function getTokenInfo() {
  return doRequest(`${API_BASE_URL}/tokenInfo`, 'GET')
}

/**
 * Logs the user out on the server (invalidates session / token when supported).
 * Call while store.token is still set so doRequest sends Authorization.
 */
export async function logout() {
  return doRequest(`${API_BASE_URL}/logout`, 'POST')
}
