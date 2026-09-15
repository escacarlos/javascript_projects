<script setup>
import { ref, computed, watch } from 'vue'
import { searchRestaurants } from '@/services/restaurantsService.js'
import { searchUsers } from '@/services/userService.js'
import { getGravatarUrl } from '@/services/gravatarService.js'
import { useToast } from 'bootstrap-vue-next'

const searchQuery = defineModel('searchQuery', {
  type: String,
  required: false,
  default: '',
})

const props = defineProps({
  restaurantsToExclude: {
    type: Array,
    required: false,
    default: () => [],
  },
  inputClass: {
    type: String,
    required: false,
    default: '',
  },
  enableUserSearch: {
    type: Boolean,
    default: false,
  },
  enableRestaurantSearch: {
    type: Boolean,
    default: true,
  },
  placeholder: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['selectFromSearchRestaurant', 'selectFromSearchUser'])

const toast = useToast()

const searchResultsSaved = ref(null)
const restaurantResults = ref([])
const userResults = ref([])

let clearTimeoutId = null

const restaurantActive = computed(
  () => props.enableRestaurantSearch || (!props.enableUserSearch && !props.enableRestaurantSearch),
)
const userActive = computed(() => props.enableUserSearch)

const resolvedPlaceholder = computed(() => {
  if (props.placeholder) return props.placeholder
  if (userActive.value && restaurantActive.value) {
    return 'Search restaurant or user...'
  }
  if (userActive.value) {
    return 'Search user...'
  }
  return 'Search restaurant...'
})

const filteredRestaurantResults = computed(() =>
  restaurantResults.value.filter((r) => !props.restaurantsToExclude.some((f) => f.id === r.id)),
)

const hasDropdown = computed(() => {
  const r = restaurantActive.value && filteredRestaurantResults.value.length > 0
  const u = userActive.value && userResults.value.length > 0
  return r || u
})

function selectFromSearch(restaurant) {
  emit('selectFromSearchRestaurant', restaurant)
  restaurantResults.value = []
  userResults.value = []
}

function selectUser(user) {
  emit('selectFromSearchUser', user)
  restaurantResults.value = []
  userResults.value = []
}

async function runSearch() {
  if (restaurantActive.value) {
    emit('selectFromSearchRestaurant', undefined)
  }
  if (userActive.value) {
    emit('selectFromSearchUser', undefined)
  }
  if (searchQuery.value.length < 2) {
    restaurantResults.value = []
    userResults.value = []
    return
  }

  if (restaurantActive.value) {
    restaurantResults.value = await searchRestaurants(searchQuery.value)
      .then((data) => data.items)
      .catch(() => {
        toast.create({
          title: 'Error searching restaurants',
          variant: 'danger',
          autoHideDelay: 3000,
        })
        return []
      })
  } else {
    restaurantResults.value = []
  }

  if (userActive.value) {
    userResults.value = await searchUsers(searchQuery.value)
      .then((data) => data.items)
      .catch(() => {
        toast.create({
          title: 'Error searching users',
          variant: 'danger',
          autoHideDelay: 3000,
        })
        return []
      })
  } else {
    userResults.value = []
  }
}

function clearSearch() {
  if (clearTimeoutId) clearTimeout(clearTimeoutId)
  clearTimeoutId = setTimeout(() => {
    searchResultsSaved.value = {
      restaurants: restaurantResults.value,
      users: userResults.value,
    }
    restaurantResults.value = []
    userResults.value = []
    clearTimeoutId = null
  }, 150)
}

function restoreSearch() {
  if (clearTimeoutId) {
    clearTimeout(clearTimeoutId)
    clearTimeoutId = null
  }
  if (searchResultsSaved.value) {
    restaurantResults.value = searchResultsSaved.value.restaurants
    userResults.value = searchResultsSaved.value.users
    searchResultsSaved.value = null
  }
}

watch(searchQuery, () => {
  if (searchQuery.value.length < 2) {
    restaurantResults.value = []
    userResults.value = []
    searchResultsSaved.value = null
  }
})
</script>

<template>
  <div class="position-relative w-100" @focusout="clearSearch" @focusin="restoreSearch">
    <input
      type="search"
      class="form-control form-select-sm"
      v-model="searchQuery"
      @input="runSearch"
      :placeholder="resolvedPlaceholder"
      :class="inputClass"
    />
    <ul
      v-if="hasDropdown"
      class="list-group position-absolute w-100 shadow"
      style="z-index: 1000; top: 100%"
    >
      <template v-if="userActive && userResults.length > 0">
        <li v-if="restaurantActive" class="list-group-item small text-muted py-1 border-bottom-0">
          Users
        </li>
        <li
          v-for="u in userResults"
          :key="'u-' + u.id"
          class="list-group-item list-group-item-action d-flex align-items-center"
          @click="selectUser(u)"
          style="cursor: pointer"
        >
          <img
            :src="getGravatarUrl(u.email)"
            width="25"
            height="25"
            class="rounded-circle me-2"
            alt=""
          />
          <span>{{ u.name }}</span>
        </li>
      </template>
      <template v-if="restaurantActive && filteredRestaurantResults.length > 0">
        <li v-if="userActive" class="list-group-item small text-muted py-1 border-bottom-0">
          Restaurants
        </li>
        <li
          v-for="r in filteredRestaurantResults"
          :key="'r-' + r.id"
          class="list-group-item list-group-item-action"
          @click="selectFromSearch(r)"
          style="cursor: pointer"
        >
          {{ r.name }} : {{ r.address }}
        </li>
      </template>
    </ul>
  </div>
</template>
