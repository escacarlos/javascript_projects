<template>
  <BCard no-body class="shadow-sm mt-4">
    <BCardHeader class="bg-white">
      <h4 class="mb-0">
        <i class="bi bi-shop me-2"></i>Similar Restaurants
        <span class="ms-2 badge bg-secondary">{{ similarRestaurants.length }} found</span>
      </h4>
    </BCardHeader>

    <BCardBody v-if="loadingSimilar" class="text-center py-4">
      <BSpinner small variant="primary" />
      <span class="ms-2 text-muted">Loading similar restaurants...</span>
    </BCardBody>

    <BCardBody v-else-if="error !== undefined" class="text-center py-4">
      <BAlert variant="danger" show>
        <i class="bi bi-exclamation-triangle-fill me-2"></i>
        {{ error }}
        <BButton variant="outline-danger" size="sm" class="ms-3" @click="loadSimilarRestaurants">
          <i class="bi bi-arrow-clockwise me-1"></i>Retry
        </BButton>
      </BAlert>
    </BCardBody>

    <BCardBody v-else-if="similarRestaurants.length === 0" class="text-center py-4">
      <BAlert variant="warning" show>
        <i class="bi bi-exclamation-triangle-fill me-2"></i>
        No similar restaurants found
      </BAlert>
    </BCardBody>

    <BCardBody v-else class="p-3">
      <div class="similar-scroll-wrapper">
        <BButton
          v-if="canScrollLeft"
          type="button"
          class="scroll-btn left"
          aria-label="Scroll left"
          @click="scrollLeft"
        >
          ‹
        </BButton>

        <div class="similar-scroll" ref="scrollContainer" @scroll.passive="updateScrollState">
          <div v-for="item in similarRestaurants" :key="item.id" class="scroll-card">
            <RestaurantCard :restaurant="item" :button-visit-visible="false" />
          </div>
        </div>

        <BButton
          v-if="canScrollRight"
          type="button"
          class="scroll-btn right"
          aria-label="Scroll right"
          @click="scrollRight"
        >
          ›
        </BButton>
      </div>
    </BCardBody>
  </BCard>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { getSimilarRestaurants } from '@/services/restaurantsService.js'
import RestaurantCard from '@/components/RestaurantCard.vue'
import { BCard, BCardHeader, BCardBody, BSpinner, BAlert, BButton } from 'bootstrap-vue-next'

const props = defineProps({
  currentRestaurant: {
    type: Object,
    required: true,
  },
})

const similarRestaurants = ref([])
const loadingSimilar = ref(true)
const scrollContainer = ref(null)
const error = ref(undefined)
const SCROLL_STEP = 360
const SCROLL_EPS = 2

const canScrollLeft = ref(false)
const canScrollRight = ref(false)

function updateScrollState() {
  const el = scrollContainer.value
  if (!el) {
    canScrollLeft.value = false
    canScrollRight.value = false
    return
  }
  const { scrollLeft, clientWidth, scrollWidth } = el
  canScrollLeft.value = scrollLeft > SCROLL_EPS
  canScrollRight.value = scrollLeft + clientWidth < scrollWidth - SCROLL_EPS
}

function scrollLeft() {
  scrollContainer.value?.scrollBy({ left: -SCROLL_STEP, behavior: 'smooth' })
}

function scrollRight() {
  scrollContainer.value?.scrollBy({ left: SCROLL_STEP, behavior: 'smooth' })
}

async function loadSimilarRestaurants() {
  loadingSimilar.value = true
  error.value = undefined
  try {
    const similar = await getSimilarRestaurants(props.currentRestaurant)
    similarRestaurants.value = similar
  } catch {
    similarRestaurants.value = []
    error.value = 'Error loading similar restaurants'
  } finally {
    loadingSimilar.value = false
    await nextTick()
    updateScrollState()
  }
}

onMounted(() => {
  loadSimilarRestaurants()
  window.addEventListener('resize', updateScrollState)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateScrollState)
})

watch(similarRestaurants, async () => {
  await nextTick()
  updateScrollState()
})

watch(
  () => props.currentRestaurant?.id,
  (id) => {
    if (id != null) loadSimilarRestaurants()
  },
)
</script>

<style scoped>
.similar-scroll-wrapper {
  position: relative;
}

.similar-scroll {
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  scroll-behavior: smooth;
  padding: 0.25rem 2.5rem;
  -webkit-overflow-scrolling: touch;
}

.similar-scroll::-webkit-scrollbar {
  height: 8px;
}

.similar-scroll::-webkit-scrollbar-thumb {
  background: #ced4da;
  border-radius: 4px;
}

.scroll-card {
  flex: 0 0 min(100%, 380px);
  max-width: 380px;
}

.scroll-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2;
  width: 2rem;
  height: 2rem;
  padding: 0;
  border: 1px solid #dee2e6;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
  line-height: 1;
  font-size: 1.25rem;
  color: #495057;
  cursor: pointer;
}

.scroll-btn:hover {
  background: #f8f9fa;
}

.scroll-btn.left {
  left: 0;
}

.scroll-btn.right {
  right: 0;
}
</style>
