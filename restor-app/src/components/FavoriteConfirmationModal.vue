<script setup>
import { ref } from 'vue'
import { BModal, BButton, useToast } from 'bootstrap-vue-next'
import { removeRestaurantFromFavorite, deleteFavoriteList } from '@/services/favoritesService.js'

const showModal = ref(false)
const { create } = useToast()
const props = defineProps({
  restaurantToDelete: {
    type: Object,
    required: false,
  },
  listToDelete: {
    type: Object,
    required: false,
  },
})
const deleteLoading = ref(false)

async function deleteConfirmed() {
  if (props.listToDelete && props.restaurantToDelete) {
    deleteLoading.value = true
    await removeRestaurantFromFavorite(props.listToDelete.id, props.restaurantToDelete.id)
      .then(() => {
        showModal.value = false
        deleteLoading.value = false
      })
      .catch(() => {
        create({
          title: 'Error removing restaurant',
          variant: 'danger',
          autoHideDelay: 3000,
        })
        deleteLoading.value = false
      })
  } else if (props.listToDelete) {
    deleteLoading.value = true
    await deleteFavoriteList(props.listToDelete.id)
      .then(() => {
        showModal.value = false
        deleteLoading.value = false
      })
      .catch(() => {
        create({
          title: 'Error deleting list',
          variant: 'danger',
          autoHideDelay: 3000,
        })
        deleteLoading.value = false
      })
  } else {
    create({
      title: 'Error deleting item',
      variant: 'danger',
      autoHideDelay: 3000,
    })
  }
}
</script>

<template>
  <BButton
    size="sm"
    variant="outline-danger"
    data-testid="favorite-confirm-open"
    @click.stop="showModal = true"
    title="Remove from list"
    v-if="restaurantToDelete"
    ><i class="bi bi-trash3-fill"></i
  ></BButton>
  <BButton
    size="sm"
    variant="outline-danger"
    data-testid="favorite-confirm-open"
    @click.stop="showModal = true"
    v-else
  >
    <i class="bi bi-trash3-fill"></i>
  </BButton>
  <BModal
    v-model="showModal"
    :title="restaurantToDelete ? 'Delete Restaurant' : 'Delete List'"
    centered
  >
    <template v-if="restaurantToDelete">
      <p>
        Are you sure you want to remove <strong>{{ restaurantToDelete?.name }}</strong> from this
        list?
      </p>
    </template>
    <template v-else>
      <p>
        Are you sure you want to delete <strong>"{{ listToDelete?.name }}"</strong>?
      </p>
    </template>
    <template #footer>
      <BButton variant="secondary" @click="showModal = false">Cancel</BButton>
      <BButton
        variant="danger"
        @click="deleteConfirmed"
        :loading="deleteLoading"
        loading-text="Deleting..."
        >Delete</BButton
      >
    </template>
  </BModal>
</template>
