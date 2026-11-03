<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { store } from '../store/store.js'
import { logout as logoutService } from '../services/userService.js'
import {
  BNavbar,
  BNavbarBrand,
  BNavbarNav,
  BNavbarToggle,
  BCollapse,
  BNavItem,
  BButton,
  BNavText,
} from 'bootstrap-vue-next'

const router = useRouter()
const user = computed(() => store.user)

async function logout() {
  await logoutService()
  router.push('/')
}
</script>

<template>
  <BNavbar toggleable="lg" class="nav-custom shadow-sm">
    <BNavbarToggle target="navbarNav" />
    <BCollapse id="navbarNav" is-nav>
      <BNavbarBrand class="fw-bold">UTask</BNavbarBrand>
      <BNavbarNav class="ms-auto align-items-center">
        <BNavText v-if="user" class="me-2 text-white">
          <small>Logged in as:</small>
          <span class="fw-bold ms-1">{{ user.username }}</span>
        </BNavText>
        <BNavItem v-if="user" class="d-flex gap-2">
          <BButton variant="outline-light" size="sm" @click="logout">Logout</BButton>
        </BNavItem>
      </BNavbarNav>
    </BCollapse>
  </BNavbar>
</template>

<style scoped>
.nav-custom {
  background-color: #5c6b7a;
}
.nav-custom .navbar-brand,
.nav-custom .nav-link {
  color: rgba(255, 255, 255, 0.9) !important;
}
.navbar-brand {
  font-size: 1.25rem;
}
</style>
