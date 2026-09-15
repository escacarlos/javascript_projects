import { store } from '../store/store'
import {
  getUserById as getUserByIdApi,
  getFavoriteLists,
  getAllUserRestaurantVisits,
  createVisit as createVisitApi,
  searchUsers as searchUsersApi,
} from '../apis/userApi'
import { getRestaurantById } from './restaurantsService'

export async function getUserById(id) {
  const user = await getUserByIdApi(id)

  const visits = await getAllUserRestaurantVisits(user.id).then((response) => response.items)
  const userRestaurantVisits = await getListRestaurantsUnique(visits)

  const favoriteListsResponse = await getFavoriteLists(user.id)
  const favoriteLists = favoriteListsResponse.items

  for (const favorite of favoriteLists) {
    favorite.restaurantDetails = []
    for (const restaurant of favorite.restaurants) {
      const restaurantDetail = await getRestaurantById(restaurant.id)
      favorite.restaurantDetails.push(restaurantDetail)
    }
  }

  return { user, userRestaurantVisits, favoriteLists }
}

/**
 * Builds the unique restaurant list from visits (business logic + store).
 */
async function getListRestaurantsUnique(restaurants) {
  if (!restaurants || restaurants.length === 0) return []
  const latestById = new Map()
  restaurants.forEach((restaurant) => {
    const id = restaurant.restaurant_id
    const existing = latestById.get(id)
    if (!existing) {
      latestById.set(id, { visits: [restaurant] })
    } else {
      existing.visits.push(restaurant)
    }
  })
  store.userRestaurantVisitsId = Array.from(latestById.keys())
  const result = await Promise.all(
    Array.from(latestById.entries()).map(async ([id, { visits }]) => {
      const restaurantDetail = await getRestaurantById(id)
      restaurantDetail.visits = visits
      restaurantDetail.lastVisit = visits[0]
      return restaurantDetail
    }),
  )
  result.forEach((restaurant) => sortUserRestaurantVisits(restaurant))
  return sortUserRestaurantVisitsRestaurant(result)
}

/**
 * Creates a visit then updates the store (orchestration + business logic).
 */
export async function createVisitUnsecure(userId, restaurantId, rating, comment, date) {
  const body = {
    restaurant_id: restaurantId,
    rating: Number(rating),
    comment: comment || '',
    date: date || undefined,
  }
  const visit = await createVisitApi(userId, body)

  let userRestaurantVisit = store.userRestaurantVisits.find((r) => r.id === restaurantId)

  if (userRestaurantVisit) {
    userRestaurantVisit.visits.push(visit)
    if (new Date(userRestaurantVisit.lastVisit?.date) < new Date(visit.date)) {
      userRestaurantVisit.lastVisit = visit
    }
    userRestaurantVisit.visits.sort((a, b) => new Date(b.date) - new Date(a.date))
    sortUserRestaurantVisits(userRestaurantVisit)
  } else {
    const restaurantDetail = await getRestaurantById(restaurantId)
    restaurantDetail.visits = [visit]
    restaurantDetail.lastVisit = visit
    store.userRestaurantVisits.push(restaurantDetail)
    store.userRestaurantVisitsId.push(restaurantId)
  }

  store.userRestaurantVisits = sortUserRestaurantVisitsRestaurant(store.userRestaurantVisits)
  store.user.rating += 10
  return visit
}

export async function searchUsers(query) {
  return searchUsersApi(query)
}

function sortUserRestaurantVisitsRestaurant(restaurants) {
  return restaurants.sort(
    (a, b) => new Date(b.lastVisit?.date ?? 0) - new Date(a.lastVisit?.date ?? 0),
  )
}

function sortUserRestaurantVisits(restaurant) {
  if (!restaurant?.visits?.length) return
  restaurant.visits.sort((a, b) => new Date(b.date) - new Date(a.date))
  restaurant.lastVisit = restaurant.visits[0]
}
