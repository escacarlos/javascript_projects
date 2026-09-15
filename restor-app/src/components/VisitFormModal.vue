<script setup>
import { ref } from 'vue'
import {
  BModal,
  BButton,
  BFormInput,
  BFormSelect,
  BFormTextarea,
  BFormGroup,
  BAlert,
  useToast,
  BFormInvalidFeedback,
} from 'bootstrap-vue-next'
import { store } from '@/store/store'
import { createVisitUnsecure } from '@/services/userService.js'

const isOpen = ref(false)

const visitDate = ref('')
const visitRating = ref(null)
const visitComment = ref('')
const formErrors = ref([])
const submitting = ref(false)
const toast = useToast()

const props = defineProps({
  restaurant: {
    type: Object,
    required: true,
  },
})

function openModal() {
  isOpen.value = true
  visitDate.value = new Date().toLocaleDateString('en-CA')
  visitRating.value = null
  visitComment.value = ''
  formErrors.value = []
}

function closeModal() {
  isOpen.value = false
  submitting.value = false
}

function validateForm() {
  const errors = []
  if (!visitDate.value?.trim()) {
    errors.push('Visit date is required.')
  } else {
    const [y, m, d] = visitDate.value.split('-').map(Number)
    const chosen = new Date(y, m - 1, d)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (chosen > today) {
      errors.push('Visit date cannot be in the future.')
    }
  }
  const rating =
    visitRating.value === null || visitRating.value === '' ? null : Number(visitRating.value)
  if (rating === null || isNaN(rating)) {
    errors.push('Please select a rating.')
  } else if (rating < 1 || rating > 5) {
    errors.push('Rating must be between 1 and 5.')
  }
  const user = store.user
  if (!user?.id) {
    errors.push('Please log in to record a visit.')
  }
  formErrors.value = errors
  return errors.length === 0
}

async function submitVisit() {
  if (!validateForm()) return
  const user = store.user
  submitting.value = true
  formErrors.value = []

  const rating = Number(visitRating.value)
  let date
  if (visitDate.value) {
    const [y, m, d] = visitDate.value.split('-').map(Number)
    const localMidnight = new Date(y, m - 1, d)
    date = localMidnight.toISOString()
  } else {
    date = undefined
  }
  await createVisitUnsecure(
    user.id,
    props.restaurant.id,
    rating,
    visitComment.value?.trim() || '',
    date,
  )
    .then(() => {
      toast.create({
        title: 'Visit saved successfully',
        variant: 'success',
        autoHideDelay: 3000,
      })
      closeModal()
    })
    .catch(() => {
      submitting.value = false

      toast.create({
        title: 'Error saving visit',
        variant: 'danger',
        autoHideDelay: 3000,
      })
    })
}
</script>

<template>
  <slot name="before-modal" :open-modal="openModal" />
  <BModal
    :model-value="isOpen"
    title="Mark as Visited"
    centered
    @close="closeModal"
    @hide="closeModal"
  >
    <p class="text-muted small mb-4">
      Record your visit to <strong>{{ restaurant.name }}</strong
      >. Fill in the date, your rating and an optional comment.
    </p>
    <BAlert v-if="formErrors.length" variant="danger" show class="small mb-3">
      <ul class="mb-0 ps-3">
        <li v-for="(err, i) in formErrors" :key="i">{{ err }}</li>
      </ul>
    </BAlert>
    <BFormGroup label="Visit date" label-for="visit-date" class="mb-3">
      <BFormInput
        id="visit-date"
        v-model="visitDate"
        type="date"
        required
        :state="visitDate !== ''"
        aria-describedby="vist-date-feedback"
      />
      <BFormInvalidFeedback id="vist-date-feedback"> Visit date is required </BFormInvalidFeedback>
    </BFormGroup>
    <BFormGroup label="Your rating (1–5)" label-for="visit-rating" class="mb-3">
      <BFormSelect
        id="visit-rating"
        v-model="visitRating"
        :options="[
          { value: null, text: 'Select rating' },
          { value: 1, text: '1 star' },
          { value: 2, text: '2 stars' },
          { value: 3, text: '3 stars' },
          { value: 4, text: '4 stars' },
          { value: 5, text: '5 stars' },
        ]"
        value-field="value"
        text-field="text"
        :state="visitRating !== null"
        aria-describedby="vist-rating-feedback"
      />
      <BFormInvalidFeedback id="vist-rating-feedback">
        Please select a rating
      </BFormInvalidFeedback>
    </BFormGroup>
    <BFormGroup label="Comment (optional)" label-for="visit-comment">
      <BFormTextarea
        id="visit-comment"
        v-model="visitComment"
        rows="3"
        placeholder="Your experience..."
        class="mb-0"
      />
    </BFormGroup>
    <template #footer>
      <BButton variant="secondary" @click="closeModal">Close</BButton>
      <BButton
        variant="primary"
        @click="submitVisit"
        :disabled="submitting || visitDate === '' || visitRating === null"
        :loading="submitting"
        loading-text="Saving visit..."
      >
        <i class="bi bi-check-lg me-1"></i>Save visit
      </BButton>
    </template>
  </BModal>
</template>
