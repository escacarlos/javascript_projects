<script setup>
import { BApp, BContainer } from 'bootstrap-vue-next'
import Navigation from './components/Navigation.vue'
import ChatWidget from './components/ChatWidget.vue'
import { store } from './store/store.js'
import 'bootstrap-icons/font/bootstrap-icons.css'
</script>

<template>
  <BApp>
    <div class="app-wrapper min-vh-100 bg-light py-4">
      <BContainer fluid>
        <Navigation v-if="store.user" />
        <header class="text-center mb-4" v-else>
          <h1 class="display-5 fw-bold text-dark mb-1">UTask</h1>
          <p class="text-muted lead">My TODO List</p>
        </header>

        <RouterView />
      </BContainer>
    </div>
    <ChatWidget v-if="store.user" />
  </BApp>
</template>
