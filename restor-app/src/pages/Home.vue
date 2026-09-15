<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { searchRestaurants } from '@/services/restaurantsService.js'
import MapLeafLet from '../components/MapLeafLet.vue'
import RestaurantCard from '../components/RestaurantCard.vue'
import {
  BContainer,
  BCard,
  BCardBody,
  BCardHeader,
  BCol,
  BRow,
  BFormCheckbox,
  BFormInput,
  BButton,
  BSpinner,
  BAlert,
  BBadge,
  BPagination,
} from 'bootstrap-vue-next'
import { store } from '@/store/store'

const restaurants = ref([])
const totalRestaurants = ref(0)
const loading = ref(false)
const error = ref(null)
const searchText = ref('')
const mapCenterLat = ref(null)
const mapCenterLng = ref(null)
let mapCenterDebounceTimer = null
const selectedPrices = ref([])
const selectedGenres = ref([])
const currentPage = ref(1)
const pageSize = ref(9)

const resultsTopRef = ref(null)
const allGenres = ref([
  'ambiance',
  'asiatique',
  'bistro',
  'boulangerie',
  'café',
  'charcuterie',
  'cuisine moléculaire',
  'desserts',
  'européen',
  'fast-food',
  'fruits de mer',
  'grec',
  'hamburgers',
  'happy hour',
  'indien',
  'italien',
  'japonais',
  'libanais',
  'mexicain',
  'pizzeria',
  'santé',
  'steakhouse',
  'végétarien',
  'vietnamien',
])

const totalPages = computed(() =>
  totalRestaurants.value > 0 ? Math.ceil(totalRestaurants.value / pageSize.value) : 1,
)

const useMapCenterForSearch = computed(
  () =>
    store.viewMode === 'map' &&
    mapCenterLat.value != null &&
    mapCenterLng.value != null &&
    Number.isFinite(mapCenterLat.value) &&
    Number.isFinite(mapCenterLng.value),
)

function onMapCenterChange({ lat, lng }) {
  mapCenterLat.value = lat
  mapCenterLng.value = lng
  if (store.viewMode !== 'map') return
  clearTimeout(mapCenterDebounceTimer)
  mapCenterDebounceTimer = setTimeout(() => {
    loadRestaurants()
  }, 400)
}

async function loadRestaurants() {
  loading.value = store.viewMode === 'list' ? true : false
  error.value = null
  try {
    const { items, total } = await searchRestaurants(
      searchText.value,
      selectedPrices.value,
      selectedGenres.value,
      store.viewMode === 'list' ? currentPage.value - 1 : 0,
      store.viewMode === 'list' ? pageSize.value : 100,
      useMapCenterForSearch.value ? mapCenterLng.value : undefined,
      useMapCenterForSearch.value ? mapCenterLat.value : undefined,
    )
    restaurants.value = items
    totalRestaurants.value = total
  } catch (err) {
    error.value = 'Failed to load restaurants. Please try again later.'
    console.error('Error loading restaurants:', err)
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  searchText.value = ''
  mapCenterLat.value = null
  mapCenterLng.value = null
  selectedGenres.value = []
  selectedPrices.value = []
  currentPage.value = 1
}

onMounted(() => {
  loadRestaurants()
})

watch(searchText, () => {
  currentPage.value = 1
  loadRestaurants()
})

watch(selectedPrices, () => {
  currentPage.value = 1
  loadRestaurants()
})

watch(selectedGenres, () => {
  currentPage.value = 1
  loadRestaurants()
})

watch(currentPage, async () => {
  await loadRestaurants()
  await nextTick()
  if (resultsTopRef.value) {
    resultsTopRef.value.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
})

watch(
  () => store.viewMode,
  () => {
    loadRestaurants()
  },
)
</script>

<template>
  <BContainer class="py-4 mb-4">
    <BCard no-body class="border-0 shadow-sm mb-4">
      <BCardBody class="text-center">
        <h1 class="card-title mb-0"><i class="bi bi-house-door-fill me-2"></i>Restaurants</h1>
      </BCardBody>
    </BCard>

    <BCard no-body class="shadow-sm mb-4">
      <BCardHeader class="bg-white">
        <h5 class="mb-0"><i class="bi bi-funnel-fill me-2"></i>Search & Filters</h5>
      </BCardHeader>
      <BCardBody>
        <div class="mb-4">
          <label class="form-label fw-bold">
            <i class="bi bi-search me-2"></i>Search restaurants
          </label>
          <BFormInput
            v-model="searchText"
            type="text"
            size="lg"
            placeholder="Search by name, address, or genre..."
          />
        </div>

        <div class="mb-4">
          <label class="form-label fw-bold mb-2">
            <i class="bi bi-currency-dollar me-2"></i>Price range
          </label>
          <div class="d-flex flex-wrap gap-3">
            <BFormCheckbox
              v-for="p in [1, 2, 3, 4, 5]"
              :key="p"
              v-model="selectedPrices"
              :value="String(p)"
              inline
              :id="`price${p}`"
            >
              {{ '$'.repeat(p) }}
            </BFormCheckbox>
          </div>
        </div>

        <div class="mb-3">
          <label class="form-label fw-bold mb-0">
            <i class="bi bi-tags-fill me-2"></i>Genres
          </label>
          <BRow class="g-2">
            <BCol v-for="g in allGenres" :key="g" cols="6" md="4" lg="3">
              <BFormCheckbox v-model="selectedGenres" :value="g" :id="`genre-${g}`">
                {{ g }}
              </BFormCheckbox>
            </BCol>
          </BRow>
          <div class="mt-2">
            <small class="text-muted">
              <i class="bi bi-info-circle me-1"></i>
              {{
                selectedGenres.length === 0
                  ? 'None (show all)'
                  : `Selected: ${selectedGenres.join(', ')} — Restaurants matching any of the selected genres will be shown.`
              }}
            </small>
          </div>
        </div>

        <div class="text-center">
          <BButton variant="outline-secondary" @click="resetFilters">
            <i class="bi bi-arrow-counterclockwise me-2"></i>Reset All Filters
          </BButton>
        </div>
      </BCardBody>
    </BCard>

    <div v-if="loading" class="text-center py-5">
      <BSpinner variant="primary" />
      <p class="mt-3 text-muted">Loading restaurants...</p>
    </div>

    <BAlert v-else-if="error" variant="danger" show>
      <i class="bi bi-exclamation-triangle-fill me-2"></i>
      {{ error }}
      <BButton variant="outline-danger" size="sm" class="ms-3" @click="loadRestaurants">
        <i class="bi bi-arrow-clockwise me-1"></i>Retry
      </BButton>
    </BAlert>

    <template v-else>
      <div class="d-flex justify-content-center mb-4">
        <div class="btn-group" role="group" aria-label="View mode">
          <BButton
            type="button"
            :variant="store.viewMode === 'list' ? 'primary' : 'outline-primary'"
            :aria-pressed="store.viewMode === 'list'"
            @click="store.viewMode = 'list'"
          >
            <i class="bi bi-list-ul me-1"></i>List
          </BButton>
          <BButton
            type="button"
            :variant="store.viewMode === 'map' ? 'primary' : 'outline-primary'"
            :aria-pressed="store.viewMode === 'map'"
            @click="store.viewMode = 'map'"
          >
            <i class="bi bi-map me-1"></i>Map
          </BButton>
        </div>
      </div>

      <div
        ref="resultsTopRef"
        class="d-flex justify-content-between align-items-center mb-3"
        v-if="store.viewMode === 'list'"
      >
        <h2 class="h5 mb-0"><i class="bi bi-list-ul me-2"></i>Results</h2>
        <BBadge variant="primary">{{ totalRestaurants }} result(s)</BBadge>
      </div>

      <BAlert v-if="restaurants.length === 0" variant="warning" show>
        <i class="bi bi-exclamation-triangle-fill me-2"></i>
        No restaurants found. Try changing your search or filters.
      </BAlert>

      <div v-else-if="store.viewMode === 'list'">
        <BRow class="g-3">
          <BCol v-for="r in restaurants" :key="r.id" cols="12" md="6" lg="4">
            <RestaurantCard :restaurant="r" :button-visit-visible="true" />
          </BCol>
        </BRow>

        <div
          v-if="store.viewMode === 'list' && totalPages > 1"
          class="d-flex justify-content-center mt-4"
        >
          <BPagination
            v-model="currentPage"
            :total-rows="totalRestaurants"
            :per-page="pageSize"
            align="center"
            first-number
            last-number
            prev-text="Previous"
            next-text="Next"
          />
        </div>
      </div>

      <div v-if="store.viewMode === 'map'">
        <MapLeafLet :restaurants="restaurants" @map-center-change="onMapCenterChange" />
      </div>
    </template>
  </BContainer>
</template>
