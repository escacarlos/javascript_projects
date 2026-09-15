import { reactive } from 'vue'

export const store = reactive({
  user: undefined,
  favoriteLists: undefined,
  userRestaurantVisits: undefined,
  userRestaurantVisitsId: [],
  token: undefined,
  viewMode: 'list', // 'list' or 'map'
})
