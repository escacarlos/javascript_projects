<script setup>
import { useRouter } from 'vue-router'
import { formatDegit, formatPriceRange } from '@/utils/helper.js'
import showGenres from './ShowGenres.vue'
import VisitFormModal from './VisitFormModal.vue'
import { BCard, BCardBody, BCardImg, BBadge, BButton, BPopover } from 'bootstrap-vue-next'
import { store } from '@/store/store'

defineProps({
  restaurant: {
    type: Object,
    required: true,
  },
  buttonVisitVisible: {
    type: Boolean,
  },
})

const router = useRouter()
</script>

<template>
  <BCard no-body class="h-100 shadow-sm">
    <BCardImg
      v-if="restaurant.pictures?.length"
      :src="restaurant.pictures[0]"
      alt="Restaurant"
      img-top
      style="height: 200px; object-fit: cover"
    />
    <BCardBody class="d-flex flex-column">
      <div class="d-flex justify-content-between align-items-start mb-2">
        <h3 class="h5 card-title mb-0">{{ restaurant.name }}</h3>
        <BBadge variant="warning" text-variant="dark">
          <i class="bi bi-star-fill me-1"></i>{{ formatDegit(restaurant.rating || 0) }}
        </BBadge>
      </div>

      <p class="card-text text-muted mb-3">
        <i class="bi bi-geo-alt me-1"></i>{{ restaurant.address }}
      </p>

      <div class="mb-3">
        <showGenres :genres="restaurant.genres" />
      </div>

      <div class="mt-auto d-flex flex-wrap gap-2 justify-content-between align-items-center">
        <BBadge variant="success">
          <i class="bi bi-currency-dollar me-1"></i>{{ formatPriceRange(restaurant.price_range) }}
        </BBadge>
        <div class="d-flex gap-1">
          <BButton
            variant="primary"
            size="sm"
            @click="router.push({ name: 'Restaurant', params: { id: restaurant.id } })"
          >
            <i class="bi bi-eye me-1"></i>View
          </BButton>

          <VisitFormModal v-if="buttonVisitVisible" :restaurant="restaurant">
            <template #before-modal="{ openModal }">
              <BPopover placement="top" :manual="store.user !== undefined">
                <template #target>
                  <span class="d-inline-block">
                    <BButton
                      variant="outline-secondary"
                      size="sm"
                      :disabled="!store.user"
                      @click="openModal"
                      ><i class="bi bi-geo-alt me-1"></i
                      ><span v-if="store.userRestaurantVisitsId.includes(restaurant.id)"
                        >Already visited</span
                      ><span v-else>Mark as visited</span></BButton
                    >
                  </span>
                </template>
                You need to be logged in to mark a restaurant as visited.
              </BPopover>
            </template>
          </VisitFormModal>
        </div>
      </div>
    </BCardBody>
  </BCard>
</template>
