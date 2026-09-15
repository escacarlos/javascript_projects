import md5 from 'md5'
import { GRAVATAR_BASE_URL } from './config'

export function getGravatarUrl(email) {
  if (!email) return `${GRAVATAR_BASE_URL}/default?d=retro`
  const hash = md5(email.toLowerCase().trim())
  return `${GRAVATAR_BASE_URL}/${hash}?d=retro`
}
