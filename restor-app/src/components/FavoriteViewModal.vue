<script setup>
import { ref } from 'vue'
import {
  BButton,
  BFormInput,
  BInputGroup,
  BListGroup,
  BListGroupItem,
  BModal,
  useToast,
  BPopover,
} from 'bootstrap-vue-next'
import { useRouter } from 'vue-router'
import { store } from '@/store/store'
import SearchRestaurantInput from './SearchInput.vue'
import {
  addRestaurantToFavorite,
  createFavoriteList,
  updateFavoriteList,
} from '@/services/favoritesService.js'
import FavoriteConfirmationModal from './FavoriteConfirmationModal.vue'

const router = useRouter()
const toast = useToast()

const show = ref(false)
const selectedList = ref(null)
const newListName = ref('')
const createError = ref('')
const createLoading = ref(false)

const editingId = ref(null)
const editName = ref('')
const editLoading = ref(false)

const searchQuery = ref('')
const searchResults = ref([])
const selectedToAdd = ref(null)
const addRestaurantLoading = ref(false)

async function createList() {
  const listName = newListName.value.trim()
  if (!listName) {
    createError.value = 'List name cannot be empty.'
    return
  } else {
    createError.value = ''
  }
  createLoading.value = true
  const newListPayload = {
    name: listName,
    owner: String(store.user.email),
    restaurants: [], // Initializing as an empty array as requested
  }
  await createFavoriteList(newListPayload)
    .then(() => {
      newListName.value = ''
      createLoading.value = false
    })
    .catch(() => {
      toast.create({
        title: 'Error creating list',
        variant: 'danger',
        autoHideDelay: 3000,
      })
      createLoading.value = false
    })
}

function close() {
  show.value = false
}

async function openFavoritesModal() {
  show.value = true
  selectedList.value = null
}

function startInlineEdit(list) {
  editingId.value = list.id
  editName.value = list.name
}

function cancelInlineEdit() {
  editingId.value = null
  editName.value = ''
}

async function saveInlineEdit(list) {
  const newName = editName.value.trim()
  if (!newName) {
    toast.create({
      title: 'List name cannot be empty',
      variant: 'danger',
      autoHideDelay: 3000,
    })
    return
  }
  editLoading.value = true
  await updateFavoriteList(list.id, {
    name: newName,
    owner: store.user.email,
    restaurants: list.restaurants,
  })
    .then(() => {
      editingId.value = null
      editLoading.value = false
    })
    .catch(() => {
      toast.create({
        title: 'Error saving list',
        variant: 'danger',
        autoHideDelay: 3000,
      })
      editLoading.value = false
    })
}

function showRestaurantsList(list) {
  if (editingId.value) {
    return
  }

  selectedList.value = list
  clearSearch()
}

function clearSearch() {
  searchQuery.value = ''
  searchResults.value = []
  selectedToAdd.value = null
}

async function addSelectedRestaurant() {
  if (!selectedToAdd.value) {
    toast.create({
      title: 'Please select a restaurant to add',
      variant: 'danger',
      autoHideDelay: 3000,
    })
    return
  }
  addRestaurantLoading.value = true
  await addRestaurantToFavorite(selectedList.value.id, selectedToAdd.value.id)
    .then(() => {
      clearSearch()
      addRestaurantLoading.value = false
    })
    .catch(() => {
      toast.create({
        title: 'Error adding restaurant',
        variant: 'danger',
        autoHideDelay: 3000,
      })
      addRestaurantLoading.value = false
    })
}

function selectRestaurant(restaurant) {
  router.push({ name: 'Restaurant', params: { id: String(restaurant.id) } })
  close()
}

function selectFromSearch(restaurant) {
  if (restaurant === undefined) {
    selectedToAdd.value = null
  } else {
    selectedToAdd.value = restaurant
    searchQuery.value = restaurant.name + ' : ' + restaurant.address
    searchResults.value = []
  }
}
</script>

<template>
  <BButton variant="outline-light" size="sm" @click="openFavoritesModal">
    <i class="bi bi-star me-1"></i>My Favorites
  </BButton>
  <BModal
    :model-value="show"
    title="My Favorite Lists"
    centered
    size="lg"
    @hide="close"
    @close="close"
  >
    <template v-if="!selectedList">
      <div class="mb-4">
        <label class="form-label text-muted small mb-2">Create a new list</label>
        <BInputGroup>
          <BFormInput v-model="newListName" placeholder="New list name" @keyup.enter="createList" />

          <BPopover placement="top" :manual="newListName !== ''">
            <template #target>
              <span class="d-inline-block">
                <BButton
                  variant="success"
                  @click="createList"
                  :loading="createLoading"
                  loading-text="Creating list..."
                  :disabled="createLoading || newListName === ''"
                  ><i class="bi bi-plus-lg me-1"></i>Create List</BButton
                >
              </span>
            </template>
            You need to put a name for creating a list.
          </BPopover>
        </BInputGroup>
        <div v-if="createError" class="text-danger mt-2 small">{{ createError }}</div>
      </div>
      <label class="form-label text-muted small mb-2">Your lists</label>
      <BListGroup flush class="mb-0">
        <BListGroupItem
          v-for="list in store.favoriteLists"
          :key="list.id"
          class="d-flex justify-content-between align-items-center list-group-item-action"
          @click="showRestaurantsList(list)"
        >
          <div
            v-if="editingId !== list.id"
            class="d-flex justify-content-between align-items-center w-100"
          >
            <span class="fw-medium">{{ list.name }}</span>
            <div class="d-flex gap-2">
              <BButton size="sm" variant="outline-primary" @click.stop="startInlineEdit(list)">
                <i class="bi bi-pencil"></i>
              </BButton>
              <FavoriteConfirmationModal :listToDelete="list" />
            </div>
          </div>
          <div v-else class="w-100 d-flex gap-2 align-items-center flex-nowrap">
            <BFormInput
              v-model="editName"
              size="sm"
              class="flex-grow-1 mw-50"
              @keyup.enter="saveInlineEdit(list)"
            />
            <div class="d-flex gap-1">
              <BButton
                size="sm"
                variant="primary"
                @click="saveInlineEdit(list)"
                :disabled="!editName.trim() || editLoading"
                :loading="editLoading"
                loading-text="Saving..."
              >
                Save
              </BButton>
              <BButton size="sm" variant="secondary" @click.stop="cancelInlineEdit">Cancel</BButton>
            </div>
          </div>
        </BListGroupItem>
      </BListGroup>
      <div v-if="store.favoriteLists.length === 0" class="text-muted text-center py-4">
        No favorite lists yet. Create one above.
      </div>
    </template>
    <template v-else>
      <div class="mb-2">
        <label class="form-label text-muted small mb-2">Add a restaurant to this list</label>
        <div class="d-flex gap-2 align-items-start flex-wrap">
          <div class="flex-grow-1">
            <SearchRestaurantInput
              @selectFromSearchRestaurant="selectFromSearch"
              :restaurantsToExclude="selectedList.restaurantDetails"
              v-model:searchQuery="searchQuery"
            />
          </div>
          <BPopover
            placement="top"
            :manual="
              selectedList.restaurantDetails.some((r) => r.id === selectedToAdd?.id) === undefined
            "
          >
            <template #target>
              <span class="d-inline-block">
                <BButton
                  size="sm"
                  variant="success"
                  :disabled="
                    !selectedToAdd ||
                    selectedList.restaurantDetails.some((r) => r.id === selectedToAdd.id) ||
                    addRestaurantLoading
                  "
                  @click="addSelectedRestaurant"
                  :loading="addRestaurantLoading"
                  loading-text="Adding restaurant..."
                >
                  <i class="bi bi-plus-lg me-1"></i>Add
                </BButton>
              </span>
            </template>
            You need to select a restaurant to add it.
          </BPopover>
        </div>
      </div>
      <h6 class="border-bottom pb-2 mb-3 mt-4">Restaurants in "{{ selectedList.name }}"</h6>
      <BListGroup flush>
        <BListGroupItem
          v-for="restaurant in selectedList.restaurantDetails"
          :key="restaurant.id"
          class="d-flex justify-content-between align-items-center list-group-item-action"
          @click="selectRestaurant(restaurant)"
        >
          <span class="fw-medium">{{ restaurant.name }} : {{ restaurant.address }}</span>
          <FavoriteConfirmationModal
            :restaurantToDelete="restaurant"
            :listToDelete="selectedList"
          />
        </BListGroupItem>
      </BListGroup>
      <div v-if="selectedList.restaurantDetails.length === 0" class="text-muted text-center py-4">
        No restaurants in this list. Use the search above to add some.
      </div>
    </template>
    <template #footer>
      <div class="me-auto" v-if="selectedList">
        <BButton variant="outline-secondary" @click="selectedList = undefined">
          <i class="bi bi-arrow-left me-1"></i>Back to lists
        </BButton>
      </div>
      <BButton variant="secondary" @click="close">Close</BButton>
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
.list-group-item .text-primary {
  cursor: pointer;
}
.list-group-item .text-primary:hover {
  text-decoration: underline;
}
</style>
