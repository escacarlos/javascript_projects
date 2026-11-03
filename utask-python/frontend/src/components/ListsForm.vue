<script setup>
import { BButton, BModal, BFormInput, useToast, BFormInvalidFeedback } from 'bootstrap-vue-next'
import { ref } from 'vue'
import { createList, updateList, deleteList } from '../services/listService.js'
import ConfirmeDelete from './ConfirmeDelete.vue'
import { store } from '../store/store.js'
import CardForm from './CardForm.vue'
import { handleError } from '../services/helper.js'

const { create } = useToast()

const props = defineProps({
    list: { type: Object, required: false },
    boardId: { type: String, required: true }
})

const editModal = ref(false)
const editName = ref('')
const isSaving = ref(false)
const isDeleting = ref(false)

function startEdit() {
    editName.value = props.list?.name
    editModal.value = true
    isSaving.value = false
}

function validateName() {
  if (editName.value?.trim() === '') {
    create?.({
      title: 'Error',
      body: 'Name cannot be empty',
      variant: 'danger',
      autoHideDelay: 3000,
    });
    return false;
  }
  return true
}

async function saveName() {
  if (!validateName()) {
    return;
  }
  isSaving.value = true
  if (props.list) {
    await updateList(props.list.id, editName.value, props.list.order ?? 0, props.list.boardId).then(() => {
      editModal.value = false
      isSaving.value = false
    }).catch((error) => {
      handleError(create, error, 'Error', 'Failed to update list')
      isSaving.value = false
    })
  } else {
    await createList(props.boardId, editName.value, store.lists[props.boardId]?.length ?? 0).then(() => {
      editModal.value = false
      isSaving.value = false
    }).catch((error) => {
      handleError(create, error, 'Error', 'Failed to create list')
      isSaving.value = false
    })
  }
}

async function confirmDeleteList() {
  isDeleting.value = true
  await deleteList(props.list.boardId, props.list.id).catch((error) => {
    handleError(create, error, 'Error', 'Failed to delete list')
    isDeleting.value = false
  })
}
</script>

<template>
    <BButton variant="primary" @click="startEdit" v-if="!list">Add List</BButton>
    <BButton size="sm" variant="primary" title="Edit" @click="startEdit" v-else><i class="bi bi-pencil-fill"></i></BButton>
    <div class="ms-auto" v-if="list">
        <CardForm :listId="list.id" />
    </div>
    <BModal v-model="editModal" :title="list ? 'Edit List' : 'Add List'" size="lg" :ok-title="'Save'" @ok.prevent="saveName">
        <label for="input-name">List Name :</label>
        <BFormInput id="input-name" v-model="editName" placeholder="Enter list name" aria-describedby="input-name-feedback" :state="editName?.length > 0" />
        <BFormInvalidFeedback id="input-name-feedback"> Enter at least 1 character </BFormInvalidFeedback>

        <template #footer="{ok, cancel}">
            <div class="d-flex justify-content-between w-100 align-items-center">
                <div class="me-auto">
                    <ConfirmeDelete @confirmDelete="confirmDeleteList()" v-if="list" :isDeleting="isDeleting" />
                </div>
                <div class="d-flex gap-2">
                    <BButton size="md" variant="secondary" @click="cancel()">Cancel</BButton>
                    <BButton size="md" variant="primary" @click="ok()" :disabled="!editName || editName === props.list?.name || isSaving"  :loading="isSaving" :loading-text="'Saving...'">Save</BButton>
                </div>
            </div>
        </template>
    </BModal>
</template>