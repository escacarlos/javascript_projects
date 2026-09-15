<script setup>
import { ref, watch, computed } from 'vue'
import { getGravatarUrl } from '@/services/gravatarService.js'
import { BModal, BButton, BImg, BCol, BPagination } from 'bootstrap-vue-next'

const PAGE_SIZE = 8

const props = defineProps({
  tab: {
    type: String,
    default: 'followers',
    /** 'followers' | 'following' */
    validator: (v) => v === 'followers' || v === 'following',
  },
  followers: {
    type: Array,
    default: () => [],
  },
  following: {
    type: Array,
    default: () => [],
  },
})

const modelValue = ref(false)

const localTab = ref(props.tab)

const followersPage = ref(1)
const followingPage = ref(1)

const followersTotal = computed(() => props.followers?.length ?? 0)
const followingTotal = computed(() => props.following?.length ?? 0)

const followersTotalPages = computed(() => Math.max(1, Math.ceil(followersTotal.value / PAGE_SIZE)))
const followingTotalPages = computed(() => Math.max(1, Math.ceil(followingTotal.value / PAGE_SIZE)))

const paginatedFollowers = computed(() => {
  const list = props.followers || []
  const start = (followersPage.value - 1) * PAGE_SIZE
  return list.slice(start, start + PAGE_SIZE)
})

const paginatedFollowing = computed(() => {
  const list = props.following || []
  const start = (followingPage.value - 1) * PAGE_SIZE
  return list.slice(start, start + PAGE_SIZE)
})

function clampPages() {
  if (followersPage.value > followersTotalPages.value) {
    followersPage.value = followersTotalPages.value
  }
  if (followingPage.value > followingTotalPages.value) {
    followingPage.value = followingTotalPages.value
  }
}

watch(modelValue, (open) => {
  if (open) {
    followersPage.value = 1
    followingPage.value = 1
  }
})

watch([followersTotal, followingTotal], clampPages)

function setTab(value) {
  localTab.value = value
}

function close() {
  modelValue.value = false
}

function rowKey(prefix, page, index, item) {
  const idPart = item?.id != null && item.id !== '' ? String(item.id) : 'noid'
  const emailPart = item?.email ? String(item.email) : ''
  return `${prefix}-p${page}-i${index}-${idPart}-${emailPart}`
}
</script>

<template>
  <BCol cols="6">
    <div
      class="border rounded p-3 social-stat-tile"
      role="button"
      tabindex="0"
      @click="modelValue = true"
      @keydown.enter.prevent="modelValue = true"
    >
      <h3 class="h4 mb-0" :class="tab === 'following' ? 'text-primary' : 'text-success'">
        {{ tab === 'following' ? (following || []).length : (followers || []).length }}
      </h3>
      <small class="text-muted">
        <i class="bi me-1" :class="tab === 'following' ? 'bi-person-heart' : 'bi-people'"></i
        >{{ tab === 'following' ? 'Following' : 'Followers' }}</small
      >
    </div>
  </BCol>
  <BModal
    :model-value="modelValue"
    title="Followers & Following"
    centered
    size="lg"
    scrollable
    @close="close"
    @hide="close"
  >
    <div v-if="modelValue" class="social-modal-body">
      <ul class="nav nav-tabs nav-justified" role="tablist">
        <li class="nav-item" role="presentation">
          <button
            type="button"
            class="nav-link"
            :class="{ active: localTab === 'followers' }"
            role="tab"
            :aria-selected="localTab === 'followers'"
            @click="setTab('followers')"
          >
            <i class="bi bi-people-fill me-1"></i>Followers
          </button>
        </li>
        <li class="nav-item" role="presentation">
          <button
            type="button"
            class="nav-link"
            :class="{ active: localTab === 'following' }"
            role="tab"
            :aria-selected="localTab === 'following'"
            @click="setTab('following')"
          >
            <i class="bi bi-person-heart me-1"></i>Following
          </button>
        </li>
      </ul>

      <div v-show="localTab === 'followers'" class="social-modal-list pt-3" role="tabpanel">
        <div v-if="followers && followers.length > 0">
          <div
            v-for="(follower, idx) in paginatedFollowers"
            :key="rowKey('fol', followersPage, idx, follower)"
            class="d-flex align-items-center mb-3"
          >
            <BImg
              :src="getGravatarUrl(follower.email)"
              rounded
              width="50"
              height="50"
              class="me-3 border border-2 border-primary"
            />
            <div>
              <strong>{{ follower.name }}</strong>
              <br />
              <RouterLink :to="`/user/${follower.id}`" class="text-primary small" @click="close">
                View profile
              </RouterLink>
            </div>
          </div>
          <div
            v-if="followersTotalPages > 1"
            class="d-flex justify-content-center pt-2 border-top mt-2"
          >
            <BPagination
              key="pagination-followers"
              v-model="followersPage"
              :total-rows="followersTotal"
              :per-page="PAGE_SIZE"
              align="center"
              first-number
              last-number
              prev-text="Previous"
              next-text="Next"
            />
          </div>
        </div>
        <div v-else class="text-muted">No followers yet.</div>
      </div>

      <div v-show="localTab === 'following'" class="social-modal-list pt-3" role="tabpanel">
        <div v-if="following && following.length > 0">
          <div
            v-for="(follow, idx) in paginatedFollowing"
            :key="rowKey('ing', followingPage, idx, follow)"
            class="d-flex align-items-center mb-3"
          >
            <BImg
              :src="getGravatarUrl(follow.email)"
              rounded
              width="50"
              height="50"
              class="me-3 border border-2 border-primary"
            />
            <div>
              <strong>{{ follow.name }}</strong>
              <br />
              <RouterLink :to="`/user/${follow.id}`" class="text-primary small" @click="close">
                View profile
              </RouterLink>
            </div>
          </div>
          <div
            v-if="followingTotalPages > 1"
            class="d-flex justify-content-center pt-2 border-top mt-2"
          >
            <BPagination
              key="pagination-following"
              v-model="followingPage"
              :total-rows="followingTotal"
              :per-page="PAGE_SIZE"
              align="center"
              first-number
              last-number
              prev-text="Previous"
              next-text="Next"
            />
          </div>
        </div>
        <div v-else class="text-muted">No following yet.</div>
      </div>
    </div>
    <template #footer>
      <BButton variant="secondary" @click="close">Close</BButton>
    </template>
  </BModal>
</template>

<style scoped>
.social-modal-list {
  max-height: min(75vh, 42rem);
  overflow-y: auto;
}

.social-stat-tile {
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    box-shadow 0.15s ease;
}
.social-stat-tile:hover {
  background-color: #f8f9fa;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}
.social-stat-tile:focus {
  outline: 0;
  box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
}
</style>
