<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getRestaurantById } from '@/services/restaurantsService.js'
import MapLeafLet from '@/components/MapLeafLet.vue'
import ShowGenres from '@/components/ShowGenres.vue'
import VisitFormModal from '@/components/VisitFormModal.vue'
import { formatPriceRange, formatDegit } from '@/utils/helper.js'
import { store } from '@/store/store'
import SimilarRestaurants from '@/components/SimilarRestaurants.vue'
import FavoriteRestaurantModal from '@/components/FavoriteRestaurantModal.vue'
import {
  BContainer,
  BCard,
  BCardBody,
  BCardHeader,
  BCol,
  BRow,
  BButton,
  BBadge,
  BListGroup,
  BListGroupItem,
  BSpinner,
  BAlert,
  BCarousel,
  BCarouselSlide,
  BPopover,
} from 'bootstrap-vue-next'

const route = useRoute()

const restaurant = ref(null)
const loading = ref(true)
const error = ref(null)
const MapLeafLetRef = ref(null)

const formattedOpeningHours = computed(() => {
  if (!restaurant.value) return []
  const order = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  return order.map((d) => ({
    day: d.charAt(0).toUpperCase() + d.slice(1),
    hours: restaurant.value.opening_hours[d] ?? 'Closed',
  }))
})

function getDirections() {
  MapLeafLetRef.value?.getDirections()
}

async function loadRestaurant() {
  error.value = null
  loading.value = true
  const id = route.params.id
  restaurant.value = await getRestaurantById(id)
    .then((restaurant) => {
      return restaurant
    })
    .catch(() => {
      error.value = 'Error loading restaurant'
    })
    .finally(() => {
      loading.value = false
    })
}

onMounted(() => {
  loadRestaurant()
})

watch(
  () => route.params.id,
  () => {
    loadRestaurant()
  },
)
</script>

<template>
  <BContainer class="mt-4 mb-4">
    <div v-if="loading" class="text-center py-5">
      <BSpinner variant="primary" />
      <p class="mt-3 text-muted">Loading restaurant details...</p>
    </div>

    <BAlert v-else-if="error" variant="danger" show>
      <i class="bi bi-exclamation-triangle-fill me-2"></i>
      {{ error }}
      <p class="mt-2 mb-0">Please try again later.</p>
    </BAlert>

    <section v-else-if="restaurant">
      <BCard no-body class="mb-4 border-0 shadow-sm">
        <BCardBody class="d-flex justify-content-between align-items-center">
          <h1 class="card-title mb-0">{{ restaurant.name }}</h1>
          <div>
            <FavoriteRestaurantModal :restaurant="restaurant" />

            <VisitFormModal :restaurant="restaurant">
              <template #before-modal="{ openModal }">
                <BPopover placement="top" :manual="store.user !== undefined">
                  <template #target>
                    <span class="d-inline-block">
                      <BButton variant="outline-primary" @click="openModal" :disabled="!store.user"
                        ><i class="bi bi-geo"></i> Visit</BButton
                      >
                    </span>
                  </template>
                  You need to be logged in to mark a restaurant as visited.
                </BPopover>
              </template>
            </VisitFormModal>
          </div>
        </BCardBody>
      </BCard>

      <BRow class="mb-4">
        <BCol cols="12" md="7" class="mb-3 mb-md-0">
          <BCard no-body class="h-100 shadow-sm">
            <BCardBody>
              <h3 class="card-title mb-3"><i class="bi bi-info-circle me-2"></i>Information</h3>
              <div class="mb-3">
                <p class="mb-1">
                  <i class="bi bi-geo-alt-fill text-primary me-2"></i><strong>Address</strong>
                </p>
                <p class="ms-4 mb-0">{{ restaurant.address }}</p>
              </div>
              <div class="mb-3">
                <p class="mb-1">
                  <i class="bi bi-telephone-fill text-primary me-2"></i><strong>Phone</strong>
                </p>
                <p class="ms-4 mb-0">{{ restaurant.tel }}</p>
              </div>
              <div class="mb-3">
                <p class="mb-2">
                  <i class="bi bi-tags-fill text-primary me-2"></i><strong>Genres</strong>
                </p>
                <div class="ms-4">
                  <showGenres :genres="restaurant.genres" />
                </div>
              </div>
              <BRow class="g-2">
                <BCol cols="6">
                  <p class="mb-1">
                    <i class="bi bi-currency-dollar text-primary me-2"></i><strong>Price</strong>
                  </p>
                  <BBadge variant="success" class="ms-4">{{
                    formatPriceRange(restaurant.price_range)
                  }}</BBadge>
                </BCol>
                <BCol cols="6">
                  <p class="mb-1">
                    <i class="bi bi-star-fill text-warning me-2"></i><strong>Rating</strong>
                  </p>
                  <BBadge variant="warning" text-variant="dark" class="ms-4"
                    >⭐ {{ formatDegit(restaurant.rating) }}</BBadge
                  >
                </BCol>
              </BRow>
            </BCardBody>
          </BCard>
        </BCol>

        <BCol cols="12" md="5">
          <BCard no-body class="h-100 shadow-sm">
            <BCardBody>
              <h3 class="card-title mb-3"><i class="bi bi-clock-fill me-2"></i>Opening Hours</h3>
              <BListGroup flush>
                <BListGroupItem
                  v-for="item in formattedOpeningHours"
                  :key="item.day"
                  class="d-flex justify-content-between align-items-center px-0"
                >
                  <span class="fw-bold">{{ item.day }}</span>
                  <span class="text-muted">{{ item.hours }}</span>
                </BListGroupItem>
              </BListGroup>
            </BCardBody>
          </BCard>
        </BCol>
      </BRow>

      <BCard v-if="restaurant.pictures?.length" no-body class="mb-4 shadow-sm">
        <BCardHeader class="bg-white">
          <h4 class="mb-0"><i class="bi bi-images me-2"></i>Photos</h4>
        </BCardHeader>
        <BCardBody class="p-0">
          <BCarousel controls indicators ride="carousel" img-height="500">
            <BCarouselSlide
              v-for="(image, index) in restaurant.pictures"
              :key="index"
              :img-src="image"
              img-alt="Restaurant photo"
              img-height="500"
            />
          </BCarousel>
        </BCardBody>
      </BCard>

      <BCard no-body class="mb-4 shadow-sm">
        <BCardHeader class="bg-white">
          <h4 class="mb-0"><i class="bi bi-geo-alt me-2"></i>Location</h4>
        </BCardHeader>
        <BCardBody>
          <map-leaf-let
            class="mapLeafLet"
            ref="MapLeafLetRef"
            :selected-restaurant="restaurant"
            v-if="restaurant"
          />
          <div class="mt-3 text-center">
            <BButton variant="primary" size="lg" @click="getDirections">
              <i class="bi bi-compass me-2"></i>Get Directions (from my location)
            </BButton>
            <p class="text-muted mt-3 mb-0 small">
              Or click anywhere on the map to get directions from that point.
            </p>
          </div>
        </BCardBody>
      </BCard>
      <!--   carrousel de restaurants similaires -->
      <SimilarRestaurants :current-restaurant="restaurant" />
    </section>
  </BContainer>
</template>
