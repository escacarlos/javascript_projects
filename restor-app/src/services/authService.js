import {
  login as loginApi,
  getTokenInfo as getTokenInfoApi,
  logout as logoutApi,
  signup as signupApi,
} from '@/apis/authApi'
import { store } from '@/store/store'
import { getUserById } from './userService'

export const TOKEN_STORAGE_KEY = 'authToken'

export async function login(email, password) {
  const { token } = await loginApi(email, password)
  store.token = token
  localStorage.setItem(TOKEN_STORAGE_KEY, token)
  await getTokenInfoAndLoadUser()
}

export async function getTokenInfoAndLoadUser() {
  const tokenInfo = await getTokenInfoApi()
  store.user = tokenInfo.user ?? tokenInfo
  const { user, userRestaurantVisits, favoriteLists } = await getUserById(store.user.id)
  store.user = user
  store.favoriteLists = favoriteLists
  store.userRestaurantVisits = userRestaurantVisits
}

export async function signup(name, email, password) {
  await signupApi(name, email, password)
}

/** Clears client-side session only (no server call). Used when the token is already invalid. */
export function clearLocalSession() {
  store.user = undefined
  store.favoriteLists = undefined
  store.userRestaurantVisits = undefined
  store.userRestaurantVisitsId = []
  store.token = undefined
  localStorage.removeItem(TOKEN_STORAGE_KEY)
}

export async function logout() {
  await logoutApi().finally(() => {
    clearLocalSession()
  })
}
