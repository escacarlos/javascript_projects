<script setup>
import { ref } from 'vue'
import {
  BModal,
  BListGroup,
  BListGroupItem,
  BButton,
  BPopover,
  BBadge,
  BSpinner,
  useToast,
} from 'bootstrap-vue-next'
import { store } from '@/store/store'
import { addRestaurantToFavorite } from '@/services/favoritesService.js'

const showFavoriteModal = ref(false)
const loadingListId = ref(undefined)
const toast = useToast()

const props = defineProps({
  restaurant: {
    type: Object,
    required: true,
  },
})

function openFavoriteModal() {
  showFavoriteModal.value = true
}

function closeFavoriteModal() {
  showFavoriteModal.value = false
}

async function selectFavoriteList(list) {
  loadingListId.value = list.id
  await addRestaurantToFavorite(list.id, props.restaurant.id)
    .then(() => {
      toast.create({
        title: `Added "${props.restaurant.name}" to "${list.name}"! 🎉`,
        variant: 'success',
        autoHideDelay: 3000,
      })
      showFavoriteModal.value = false
    })
    .catch(() => {
      toast.create({
        title: `Error adding "${props.restaurant.name}" to "${list.name}"`,
        variant: 'danger',
        autoHideDelay: 3000,
      })
    })
    .finally(() => {
      loadingListId.value = undefined
    })
}
</script>

<template>
  <BPopover placement="top" :manual="store.user !== undefined">
    <template #target>
      <span class="d-inline-block">
        <BButton
          variant="outline-warning"
          class="me-2"
          data-testid="favorite-trigger"
          @click="openFavoriteModal"
          :disabled="!store.user"
          ><i class="bi bi-star-fill"></i> Favorite</BButton
        >
      </span>
    </template>
    You need to be logged in to add a restaurant to your favorite lists.
  </BPopover>
  <BModal
    title="Select Favorite List"
    centered
    @hide="closeFavoriteModal"
    @close="closeFavoriteModal"
    v-model="showFavoriteModal"
  >
    <p class="text-muted small mb-3">
      Choose a list to add <strong>{{ restaurant.name }}</strong> to.
    </p>
    <BListGroup v-if="Array.isArray(store.favoriteLists) && store.favoriteLists.length" flush>
      <BListGroupItem
        v-for="list in store.favoriteLists"
        :key="list.id"
        button
        class="d-flex justify-content-between align-items-center"
        :disabled="
          loadingListId !== undefined ||
          (Array.isArray(list.restaurants) && list.restaurants.some((r) => r.id === restaurant.id))
        "
        @click="selectFavoriteList(list)"
      >
        <span class="d-flex align-items-center gap-2">
          <BSpinner v-if="loadingListId === list.id" small class="me-1" />
          {{ list.name }}
        </span>
        <BBadge
          v-if="
            Array.isArray(list.restaurants) && list.restaurants.some((r) => r.id === restaurant.id)
          "
          variant="secondary"
        >
          Already added
        </BBadge>
      </BListGroupItem>
    </BListGroup>

    <div v-else class="text-muted text-center py-4">No favorite lists available.</div>

    <template #footer>
      <BButton variant="secondary" @click="closeFavoriteModal">Close</BButton>
    </template>
  </BModal>
</template>
