<script setup>
import { ref, computed } from 'vue'
import { BModal, BCard, BCardBody, BFormInput, BFormSelect, BRow, BCol, useToast, BFormTextarea, BButton, BFormInvalidFeedback } from 'bootstrap-vue-next'
import { createCard, updateCard, deleteCard } from '../services/cardService.js'
import ConfirmeDelete from './ConfirmeDelete.vue'
import { handleError } from '../services/helper.js'

const { create } = useToast()

const props = defineProps({
  card: { type: Object, required: false },
  listId: { type: String, required: true }
})

const showModal = ref(false)
const isSaving = ref(false)
const isDeleting = ref(false)
const form = ref({ ...props.card })

function handleKeypress(e) {
  if (e.key === 'Enter') validateForm()
}

function closeModal() {
  isSaving.value = false
  showModal.value = false
}

function openModal() {
  form.value = { ...props.card }
  showModal.value = true
}


function validateForm() {
  const title = form.value.title?.trim()
  const description = form.value.description?.trim()
  const priority  = Number(form.value.priority)
  const dateTime = form.value.dueDate?.trim()
  if (!title || !description || !priority || !dateTime) {
    create?.({
      title: 'Error',
      body: 'Please fill in all fields',
      variant: 'danger',
      autoHideDelay: 3000,
    });
    return false;
  }
  return true
}

const dueDateLocal = computed({
  get() {
    if (!form.value.dueDate) return ''
    const d = form.value.dueDate
    if (typeof d === 'string' && d.length >= 16) return d.slice(0, 16)
    return new Date(d).toISOString().slice(0, 16)
  },
  set(v) {
    form.value.dueDate = v || ''
  }
})

async function confirmDeleteCard() {
  isDeleting.value = true
  await deleteCard(form.value.listId, form.value.id).catch((error) => {
    handleError(create, error, 'Error', 'Failed to delete card')
    isDeleting.value = false
  })
}

async function saveCard() {
  if (validateForm()) {
    isSaving.value = true
    if (props.card) {
      await updateCard(form.value).then(() => {
        closeModal()
      }).catch((error) => {
        handleError(create, error, 'Error', 'Failed to update card')
        isSaving.value = false
      })
    } else {
      form.value.listId = props.listId
      await createCard(form.value).then(() => {
        closeModal()
      }).catch((error) => {
        isSaving.value = false
        handleError(create, error, 'Error', 'Failed to create card')
      })
    }
  }
}

</script>

<template>
  <BCardBody class="py-2 px-3 card-body-clickable" @click="openModal()" v-if="card">
    <div class="d-flex justify-content-between align-items-center gap-2">
      <span class="flex-grow-1 text-break small">{{ props.card?.title }}</span>
    </div>
  </BCardBody>
  <BButton @click="openModal()" variant="primary" v-else><i class="bi bi-plus-square-fill"></i></BButton>


  <BModal v-model="showModal" :title="card ? 'Edit Card' : 'Add Card'" @hidden="closeModal" @ok.prevent="saveCard" size="lg">
    <BCard class="border-0 shadow-sm mb-4" :no-body="true" >
      <BCardBody class="p-3 p-md-4">
        <div class="mb-3">
          <label for="input-title">Card title :</label>
          <BFormInput
            id="input-title"
            v-model="form.title"
            placeholder="Enter card title"
            size="lg"
            class="border-secondary"
            @keypress="handleKeypress"
            aria-label="New card title"
            aria-describedby="input-title-feedback"
            :state="form.title?.length > 2 ? true : false"
          />
          <BFormInvalidFeedback id="input-title-feedback"> Enter at least 3 characters </BFormInvalidFeedback>
        </div>
        <div class="mb-3">
          <label for="input-description">Description :</label>
          <BFormTextarea
            id="input-description"
            v-model="form.description"
            placeholder="Enter description"
            size="lg"
            class="border-secondary"
            aria-label="Description"
            aria-describedby="input-description-feedback"
            :state="form.description?.length > 0 ? true : false"
            rows="8"
          />
          <BFormInvalidFeedback id="input-description-feedback"> Enter at least 1 letters </BFormInvalidFeedback>
        </div>
        <BRow class="mb-3">
          <BCol md="8" class="mb-2 mb-md-0">
            <label for="input-due-date">Due date :</label>
            <BFormInput
              id="input-due-date"
              v-model="dueDateLocal"
              type="datetime-local"
              size="lg"
              class="border-secondary"
              aria-label="Select date and time"
              aria-describedby="input-due-date-feedback"
              :state="form.dueDate?.length > 0 ? true : false"
            />
            <BFormInvalidFeedback id="input-due-date-feedback"> Enter a valid date and time </BFormInvalidFeedback>
          </BCol>
          <BCol md="4">
            <label for="input-priority">Priority :</label>
            <BFormSelect
              v-model="form.priority"
              size="lg"
              class="border-secondary"
              aria-label="Priority"
              :options="[
                { value: '', text: 'Select priority', disabled: true },
                { value: 1, text: '1 - High' },
                { value: 2, text: '2 - Medium' },
                { value: 3, text: '3 - Low' }
              ]"
              aria-describedby="input-priority-feedback"
              :state="form.priority ? true : false"
            />
            <BFormInvalidFeedback id="input-priority-feedback"> Select a priority </BFormInvalidFeedback>
          </BCol>
        </BRow>
      </BCardBody>
    </BCard>
    <template #footer="{ok, cancel}">
      <div class="d-flex justify-content-between w-100 align-items-center">
        <div class="me-auto">
            <ConfirmeDelete @confirmDelete="confirmDeleteCard()" v-if="card" :isDeleting="isDeleting" />
        </div>
        <div class="d-flex gap-2">
          <BButton size="md" variant="secondary" @click="cancel()">Cancel</BButton>
          <BButton size="md" variant="primary" @click="ok()" :disabled="!form.title || !form.description || !form.priority || !form.dueDate || isSaving" :loading="isSaving" :loading-text="'Saving...'">Save</BButton>
        </div>
      </div>
    </template>
  </BModal>
</template>

<style scoped>
.card-body-clickable {
  cursor: pointer;
}
</style>
