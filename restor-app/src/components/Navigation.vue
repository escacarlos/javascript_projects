<script setup>
import { useRouter } from 'vue-router'
import { store } from '@/store/store'
import { logout as logoutService } from '@/services/authService'
import FavoriteViewModal from './FavoriteViewModal.vue'
import { ref, watch } from 'vue'
import {
  BNavbar,
  BNavbarBrand,
  BNavbarNav,
  BNavbarToggle,
  BCollapse,
  BNavItem,
  BButton,
  BNavText,
  vBColorMode,
  useToast,
} from 'bootstrap-vue-next'
import SearchInput from './SearchInput.vue'
// Get router instance
const router = useRouter()
const searchQuery = ref('')
const toast = useToast()

async function logout() {
  await logoutService()

  if (router.currentRoute.value.name === 'User') {
    router.push({ name: 'Home' })
  }

  toast.create({
    title: 'You have been logged out.',
    variant: 'info',
    autoHideDelay: 3000,
  })
}

function selectFromSearchRestaurant(restaurant) {
  if (restaurant === undefined) {
    return
  } else {
    searchQuery.value = ''
    router.push({ name: 'Restaurant', params: { id: restaurant.id } })
  }
}

function selectFromSearchUser(user) {
  if (user === undefined) {
    return
  } else {
    searchQuery.value = ''
    router.push({ name: 'User', params: { id: user.id } })
  }
}

watch(router.currentRoute, () => {
  searchQuery.value = ''
})
</script>

<template>
  <BNavbar v-b-color-mode="'dark'" toggleable="lg" variant="dark" class="shadow-sm">
    <BNavbarBrand to="/" class="fw-bold"> <span class="text-primary">U</span>Food </BNavbarBrand>
    <BNavbarToggle target="navbarNav" />
    <BCollapse id="navbarNav" is-nav>
      <BNavbarNav class="me-auto mb-2 mb-lg-0">
        <BNavItem to="/">Home</BNavItem>
        <BNavItem v-if="store.user && store.favoriteLists">
          <FavoriteViewModal />
        </BNavItem>
      </BNavbarNav>

      <form
        class="nav-search-form me-auto mb-2 mb-lg-0"
        @submit.prevent
        v-if="router.currentRoute.value.name !== 'Home' || store.user !== undefined"
      >
        <SearchInput
          @selectFromSearchRestaurant="selectFromSearchRestaurant"
          @selectFromSearchUser="selectFromSearchUser"
          inputClass="form-control nav-search-input"
          v-model:searchQuery="searchQuery"
          :enable-user-search="store.user !== undefined"
          :enable-restaurant-search="router.currentRoute.value.name !== 'Home'"
        />
      </form>

      <BNavbarNav class="ms-auto align-items-center user-actions">
        <template v-if="store.user">
          <BNavText class="me-2 text-light user-info">
            <small>Logged in as:</small> <br />
            <span class="fw-bold">{{ store.user.name }}</span>
          </BNavText>

          <BNavItem class="d-flex flex-nowrap gap-2">
            <BButton variant="outline-light" size="sm" :to="`/user/${store.user.id}`"
              >Profile</BButton
            >
            <BButton variant="danger" size="sm" @click="logout">Logout</BButton>
          </BNavItem>
        </template>

        <template v-else>
          <BNavItem>
            <BButton variant="primary" size="sm" @click="router.push({ name: 'Login' })"
              >Login</BButton
            >
          </BNavItem>
        </template>
      </BNavbarNav>
    </BCollapse>
  </BNavbar>
</template>

<style scoped>
:deep(.navbar-brand) {
  font-size: 1.5rem;
}
:deep(.nav-link.router-link-active),
:deep(.router-link-active) {
  color: white !important;
  font-weight: bold;
}

:deep(#navbarNav) {
  position: relative;
}
.nav-search-form {
  position: absolute;
  left: 45%;
  transform: translateX(-50%);
  width: 500px;
  min-width: 320px;
  max-width: calc(100% - 300px);
  z-index: 1;
}
.nav-search-form :deep(.nav-search-input) {
  width: 100% !important;
  min-width: 100% !important;
  height: 48px !important;
  min-height: 48px !important;
  padding: 0.65rem 1.1rem !important;
  font-size: 1.1rem !important;
  border-radius: 0.375rem;
  box-sizing: border-box;
}
.user-info {
  white-space: nowrap;
  font-size: 0.875rem;
}
.user-info small {
  font-size: 0.75rem;
}
@media (max-width: 1200px) {
  .nav-search-form {
    width: 400px;
    max-width: calc(100% - 350px);
  }
}
@media (max-width: 991px) {
  .nav-search-form {
    position: relative;
    left: auto;
    transform: none;
    width: 100%;
    min-width: 100%;
    max-width: 100%;
    margin: 10px 0;
  }
  .nav-search-form :deep(.nav-search-input) {
    min-width: 100%;
  }
  .user-info {
    font-size: 0.8rem;
  }
  .user-actions {
    flex-direction: row;
    flex-wrap: nowrap;
    white-space: nowrap;
  }
  .user-actions :deep(.nav-item) {
    flex-shrink: 0;
    white-space: nowrap;
  }
  .user-actions :deep(.btn) {
    white-space: nowrap;
  }
}
</style>
