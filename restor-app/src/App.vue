<template>
  <BApp>
    <Navigation />
    <router-view />
  </BApp>
</template>

<script setup>
import { BApp } from 'bootstrap-vue-next'
import Navigation from './components/Navigation.vue'
import 'leaflet/dist/leaflet.css'
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
</script>

<style></style>
