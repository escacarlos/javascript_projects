<script setup>
import { BModal, BFormInput, BFormTextarea, BButton, BNavForm, useToast, BFormInvalidFeedback } from 'bootstrap-vue-next'
import { ref } from 'vue'
import { createBoard, updateBoard, deleteBoard } from '../services/boardService.js'
import ConfirmeDelete from './ConfirmeDelete.vue'
import { useRouter } from 'vue-router'
import { store } from '../store/store.js'
import { handleError } from '../services/helper.js'

const router = useRouter()
const { create } = useToast()
const isSaving = ref(false)
const showModal = ref(false)
const boardLocal = ref({ id: undefined, name: '', description: '' })
const isDeleting = ref(false)

const props = defineProps({
  board: { type: Object, required: false }
})

function openEditModal() {
  boardLocal.value = { id: props.board?.id, name: props.board?.name, description: props.board?.description }
  showModal.value = true
}

async function saveBoard() {
  isSaving.value = true
  if (props.board) {
    await updateBoard(boardLocal.value.id, boardLocal.value.name, boardLocal.value.description).then(() => {
      isSaving.value = false
      showModal.value = false
    }).catch((error) => {
      handleError(create, error, 'Error', 'Failed to update board')
      isSaving.value = false
    })
  } else {
    await createBoard(boardLocal.value.name, boardLocal.value.description).then(board => {
      store.selectedBoard = board
      router.push(`/board/${board.id}`)
      isSaving.value = false
      showModal.value = false
    }).catch((error) => {
      isSaving.value = false
      handleError(create, error, 'Error', 'Failed to create board')
    })
  }
}

async function confirmDeleteBoard() {
  isDeleting.value = true
  await deleteBoard(boardLocal.value.id).then(() => {
    if (store.boards.length > 0) {
        store.selectedBoard = store.boards[0]
        router.push(`/board/${store.selectedBoard.id}`)
    } else {
        store.selectedBoard = undefined
        router.push(`/board/`)
    }
  }).catch((error) => {
    isDeleting.value = false
    handleError(create, error, 'Error', 'Failed to delete board')
  })
}
</script>

<template>
    <BButton type="button" size="sm" variant="transparent" @click.stop.prevent="openEditModal" title="Edit board" v-if="board"><i class="bi bi-pencil-fill"></i></BButton>
    <BNavForm v-else><BButton variant="primary" @click="openEditModal">Create Board</BButton></BNavForm>
    <BModal v-model="showModal" :title="board ? 'Edit Board' : 'Create Board'" size="lg" :ok-title="'Save'" @ok.prevent="saveBoard">
        <div class="mb-3">
            <label for="input-name">Board Name :</label>
            <BFormInput id="input-name" v-model="boardLocal.name" placeholder="Enter name" aria-describedby="input-name-feedback" :state="boardLocal.name?.length > 2" />
            <BFormInvalidFeedback id="input-name-feedback"> Enter at least 3 characters</BFormInvalidFeedback>
        </div>
        <div class="mb-3">
            <label for="input-description">Board Description :</label>
            <BFormTextarea id="input-description" v-model="boardLocal.description" placeholder="Enter description" />
        </div>
        <template #footer="{ok, cancel}">
            <div class="me-auto" v-if="board">
                <ConfirmeDelete @confirmDelete="confirmDeleteBoard" :isDeleting="isDeleting" />
            </div>
            <div>
                <BButton variant="secondary" @click="cancel">Cancel</BButton>
                <BButton variant="primary" @click="ok" :disabled="!boardLocal.name || isSaving" :loading="isSaving" :loading-text="'Saving...'">Save</BButton>
            </div>
        </template>
  </BModal>
</template>