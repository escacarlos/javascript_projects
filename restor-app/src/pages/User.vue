<script setup>
import { onMounted, ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { formatDate } from '@/utils/helper.js'
import { getGravatarUrl } from '@/services/gravatarService.js'
import VisitViewModal from '@/components/VisitViewModal.vue'
import UserFollowersModal from '@/components/UserFollowersModal.vue'
import { useToast } from 'bootstrap-vue-next'
import { followUser, unfollowUser } from '@/services/followService.js'
import {
  BContainer,
  BCard,
  BCardBody,
  BCardHeader,
  BImg,
  BCol,
  BRow,
  BButton,
  BBadge,
  BSpinner,
} from 'bootstrap-vue-next'
import { store } from '@/store/store'
import { getUserById } from '@/services/userService.js'

const user = ref(null)
const route = useRoute()
const visits = ref([])
const toast = useToast()

const isFollowing = computed(() => {
  if (!store.user || !store.user.following || !user.value) return false
  return store.user.following.some((f) => f.id === user.value.id)
})

async function loadProfile() {
  if (route.params.id === store.user.id) {
    user.value = store.user
    visits.value = store.userRestaurantVisits
  } else {
    user.value = null
    const response = await getUserById(route.params.id)
    user.value = response.user
    visits.value =
      response.userRestaurantVisits.length > 0 ? response.userRestaurantVisits : undefined
  }
}
onMounted(() => {
  loadProfile()
})

watch(
  () => route.params.id,
  () => {
    loadProfile()
  },
)

const isNotMe = computed(() => store.user?.id !== route.params.id)

async function handleFollowAction() {
  if (isFollowing.value) {
    await unfollowUser(user.value.id)
      .then(() => {
        store.user.following = store.user.following.filter((f) => f.id !== user.value.id)
        user.value.followers = user.value.followers.filter((f) => f.id !== store.user.id)
      })
      .catch(() => {
        toast.create({
          title: 'Error unfollowing user',
          variant: 'danger',
          autoHideDelay: 3000,
        })
      })
  } else {
    await followUser(user.value.id)
      .then(() => {
        store.user.following.push({
          id: user.value.id,
          name: user.value.name,
          email: user.value.email,
        })
        user.value.followers.push({
          id: store.user.id,
          name: store.user.name,
          email: store.user.email,
        })
      })
      .catch(() => {
        toast.create({
          title: 'Error following user',
          variant: 'danger',
          autoHideDelay: 3000,
        })
      })
  }
}
</script>

<template>
  <BContainer class="py-4 mb-4">
    <BRow v-if="user">
      <BCol cols="12" md="4" class="mb-4 mb-md-0">
        <BCard no-body class="shadow-sm h-100">
          <BCardBody class="text-center">
            <BImg
              :src="getGravatarUrl(user.email)"
              alt="User profile"
              rounded
              fluid
              class="mx-auto mb-3 border border-3 border-primary"
              style="width: 150px; height: 150px; object-fit: cover"
            />
            <h2 class="card-title mb-3">{{ user.name }}</h2>
            <div v-if="isNotMe" class="mb-3">
              <BButton
                :variant="isFollowing ? 'outline-danger' : 'primary'"
                @click="handleFollowAction"
                class="w-100"
              >
                <i :class="isFollowing ? 'bi bi-person-dash' : 'bi bi-person-plus'"></i>
                {{ isFollowing ? ' Unfollow' : ' Follow' }}
              </BButton>
            </div>
            <div class="mb-3">
              <div class="mb-2">
                <i
                  v-for="i in 5"
                  :key="i"
                  :class="
                    i <= (user.rating / 100 || 0)
                      ? 'bi bi-star-fill text-warning'
                      : 'bi bi-star text-muted'
                  "
                  style="font-size: 1.5rem"
                ></i>
              </div>
              <BBadge variant="warning" text-variant="dark"> {{ user.rating || 0 }} points</BBadge>
            </div>
            <BRow class="g-3 mt-3">
              <UserFollowersModal
                key="followers-stat-tile"
                tab="followers"
                :followers="user.followers || []"
                :following="user.following || []"
              />
              <UserFollowersModal
                key="following-stat-tile"
                tab="following"
                :followers="user.followers || []"
                :following="user.following || []"
              />
            </BRow>
          </BCardBody>
        </BCard>
      </BCol>

      <BCol cols="12" md="8">
        <BCard no-body class="shadow-sm">
          <BCardHeader class="bg-white">
            <h3 class="mb-0">
              <i class="bi bi-clock-history me-2"></i>Restaurants Visited Recently
            </h3>
          </BCardHeader>
          <BCardBody>
            <div v-if="visits">
              <div class="table-responsive">
                <table class="table table-hover align-middle">
                  <thead class="table-light">
                    <tr>
                      <th><i class="bi bi-shop me-2"></i>Restaurant Name</th>
                      <th><i class="bi bi-calendar-event me-2"></i>Last Visit</th>
                      <th class="text-center"><i class="bi bi-arrow-repeat me-2"></i>Visits</th>
                    </tr>
                  </thead>
                  <tbody>
                    <VisitViewModal
                      v-for="restaurant in visits"
                      :key="restaurant.restaurant_id"
                      :restaurant-visit="restaurant"
                    >
                      <template #before-modal="{ openModal }">
                        <tr class="visit-row" @click="openModal">
                          <td>
                            <strong>{{ restaurant.name }}</strong>
                          </td>
                          <td>
                            <i class="bi bi-calendar3 me-1 text-muted"></i>
                            {{ formatDate(restaurant.lastVisit.date) }}
                          </td>
                          <td class="text-center">
                            <BBadge variant="primary">
                              {{ restaurant.visits.length }}
                            </BBadge>
                          </td>
                        </tr>
                      </template>
                    </VisitViewModal>
                  </tbody>
                </table>
              </div>
            </div>
            <div v-else class="text-center py-5">
              <i class="bi bi-inbox display-1 text-muted"></i>
              <p class="mt-3 mb-3" v-if="!isNotMe">You haven't visited any restaurants yet.</p>
              <p class="mt-3 mb-3" v-else>This user hasn't visited any restaurants yet.</p>
              <BButton variant="primary" :to="{ path: '/' }" v-if="!isNotMe">
                <i class="bi bi-house-door me-2"></i>Go to the homepage to explore restaurants
              </BButton>
            </div>
          </BCardBody>
        </BCard>
      </BCol>
    </BRow>
    <BRow v-else>
      <BSpinner variant="primary" />
      <p class="mt-3 text-muted">Loading user...</p>
    </BRow>
  </BContainer>
</template>

<style scoped>
.visit-row {
  cursor: pointer;
  transition: background-color 0.15s ease-in-out;
}
.visit-row:hover {
  background-color: #f8f9fa !important;
}
.visit-row:active {
  background-color: #e9ecef !important;
}
</style>
