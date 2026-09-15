import { getGravatarUrl as getGravatarUrlApi } from '../apis/gravatarApi'

/**
 * Returns the Gravatar avatar URL for an email.
 * @param {string} email - User email
 * @returns {string} Gravatar URL
 */
export function getGravatarUrl(email) {
  return getGravatarUrlApi(email)
}
