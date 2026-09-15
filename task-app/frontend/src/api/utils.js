import { store } from '../store/store.js'
import { logout } from '../services/userService.js'

export function doRequest(url, method, body) {
    return fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': store.token ? `Bearer ${store.token}` : undefined
        },
        body: body ? JSON.stringify(body) : undefined
    })
    .then(response => {
        if (!response.ok) {
            const status = response.status
            if ((status === 401 || status === 403)) {
                // Token invalid or expired: clear auth state and redirect to login.
                // Dynamic import: useRouter() is invalid outside setup; static router import cycles via Home.
                logout()
                import('../router/index.js').then((m) => m.default.push({ name: 'home', query: { expired: '1' } }))
            }
            return response.json().then(body => {
                throw { status: response.status, body };
            });
        }

        if (response.status === 204) {
            return null;
        }

        return response.json();
    })
    .then(data => data?.data)
}
