import { store } from '../store/store'
import {
  createFavoriteList as createFavoriteListApi,
  updateFavoriteList as updateFavoriteListApi,
  deleteFavoriteList as deleteFavoriteListApi,
  addRestaurantToFavorite as addRestaurantToFavoriteApi,
  removeRestaurantFromFavorite as removeRestaurantFromFavoriteApi,
} from '../apis/favoritesApi'
import { getRestaurantById } from './restaurantsService'

/**
 * Creates a favorite list
 */
export async function createFavoriteList(listData) {
  const response = await createFavoriteListApi(listData)
  response.restaurantDetails = []
  store.favoriteLists.push(response)
  return response
}

/**
 * Updates a favorite list
 */
export async function updateFavoriteList(id, data) {
  const response = await updateFavoriteListApi(id, data)
  store.favoriteLists.forEach((favorite) => {
    if (favorite.id === id) {
      favorite.name = data.name
    }
  })
  return response
}

/**
 * Deletes a favorite list
 */
export async function deleteFavoriteList(id) {
  await deleteFavoriteListApi(id)
  store.favoriteLists = store.favoriteLists.filter((favorite) => favorite.id !== id)
}

/**
 * Adds a restaurant to a favorite list
 */
export async function addRestaurantToFavorite(favoriteId, restaurantId) {
  const response = await addRestaurantToFavoriteApi(favoriteId, restaurantId)
  const favorite = store.favoriteLists.find((f) => f.id === favoriteId)
  if (favorite) {
    const restaurant = await getRestaurantById(restaurantId)
    favorite.restaurantDetails.push(restaurant)
    favorite.restaurants = response.restaurants
  }
  return response
}

/**
 * Removes a restaurant from a favorite list
 */
export async function removeRestaurantFromFavorite(favoriteId, restaurantId) {
  await removeRestaurantFromFavoriteApi(favoriteId, restaurantId)
  store.favoriteLists.forEach((favorite) => {
    if (favorite.id === favoriteId) {
      favorite.restaurantDetails = favorite.restaurantDetails.filter((r) => r.id !== restaurantId)
      favorite.restaurants = favorite.restaurants.filter((r) => r.id !== restaurantId)
    }
  })
}
