import { store } from '@/store/store'
import { router } from '@/router'
import { clearLocalSession } from '@/services/authService'

export function doRequest(url, method, body) {
  return fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: store.token ? `Bearer ${store.token}` : undefined,
    },
    body: body ? JSON.stringify(body) : undefined,
  }).then(async (response) => {
    if (!response.ok) {
      const status = response.status
      const error = new Error(`HTTP Error: ${status}`)
      error.status = status

      if ((status === 401 || status === 403) && store.token) {
        // Token invalid or expired: clear auth state and redirect to login.
        clearLocalSession()
        if (router.currentRoute.value.name !== 'Login') {
          router.push({ name: 'Login', query: { expired: '1' } })
        }
        error.body = { message: 'Session expired' }
      } else {
        const text = await response.text()
        try {
          error.body = text ? JSON.parse(text) : null
        } catch {
          error.body = text
        }
      }
      throw error
    }

    const text = await response.text()

    return text !== '' ? JSON.parse(text) : null
  })
}
