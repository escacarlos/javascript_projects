<script setup>
import { ref } from 'vue'
import { formatDate } from '@/utils/helper.js'
import { BModal, BButton, BBadge } from 'bootstrap-vue-next'
import { useRouter } from 'vue-router'

const router = useRouter()

const isOpen = ref(false)

const props = defineProps({
  restaurantVisit: {
    type: Object,
    required: true,
  },
})

const visit = ref(undefined)

function openModal() {
  isOpen.value = true
  if (props.restaurantVisit.visits.length === 1) {
    visit.value = props.restaurantVisit.visits[0]
  }
}

function closeModal() {
  isOpen.value = false
  visit.value = undefined
}

function goToRestaurant() {
  router.push(`/restaurant/${props.restaurantVisit.id}`)
  closeModal()
}

function renderStars(rating) {
  const stars = []
  for (let i = 1; i <= 5; i++) {
    stars.push(i <= rating ? '★' : '☆')
  }
  return stars.join('')
}
</script>

<template>
  <slot name="before-modal" :open-modal="openModal" />
  <BModal
    :model-value="isOpen"
    :title="`Restaurant Visit Details — ${restaurantVisit.name}`"
    centered
    @close="closeModal"
    @hide="closeModal"
  >
    <template v-if="visit">
      <div class="mb-4">
        <h6 class="text-muted small text-uppercase fw-semibold mb-2">Restaurant</h6>
        <p class="mb-0">{{ restaurantVisit.name }}</p>
      </div>

      <div class="mb-4">
        <h6 class="text-muted small text-uppercase fw-semibold mb-2">Visit Date</h6>
        <p class="mb-0">
          <i class="bi bi-calendar3 me-2 text-muted"></i>{{ formatDate(visit.date) }}
        </p>
      </div>

      <div class="mb-4">
        <h6 class="text-muted small text-uppercase fw-semibold mb-2">Your Rating</h6>
        <p class="mb-0">
          <span class="text-warning fs-5" :title="`${visit.rating} out of 5`">{{
            renderStars(visit.rating)
          }}</span>
          <BBadge variant="warning" class="ms-2">{{ visit.rating }}/5</BBadge>
        </p>
      </div>

      <div class="mb-0" v-if="visit.comment">
        <h6 class="text-muted small text-uppercase fw-semibold mb-2">Your Comment</h6>
        <p class="p-3 bg-light border-start border-primary border-3 rounded mb-0 text-break">
          {{ visit.comment }}
        </p>
      </div>
    </template>
    <template v-else>
      <ul class="list-group list-group-flush">
        <li
          v-for="v in restaurantVisit.visits"
          :key="v.id"
          class="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
          @click="visit = v"
        >
          <span><i class="bi bi-calendar3 me-2 text-muted"></i>{{ formatDate(v.date) }}</span>
          <span>
            <BBadge variant="warning" class="me-2">{{ v.rating }}/5</BBadge>
            <i class="bi bi-chevron-right text-muted"></i>
          </span>
        </li>
      </ul>
    </template>

    <template #footer>
      <div class="me-auto" v-if="visit && restaurantVisit.visits.length > 1">
        <BButton variant="outline-secondary" @click="visit = undefined">
          <i class="bi bi-arrow-left me-1"></i>Back to List
        </BButton>
      </div>
      <BButton variant="secondary" @click="closeModal">Close</BButton>
      <BButton variant="primary" @click="goToRestaurant">
        <i class="bi bi-shop me-2"></i>View Restaurant
      </BButton>
    </template>
  </BModal>
</template>

<style scoped>
.list-group-item-action {
  cursor: pointer;
}
.list-group-item-action:hover {
  background-color: rgba(0, 0, 0, 0.04);
}
</style>
