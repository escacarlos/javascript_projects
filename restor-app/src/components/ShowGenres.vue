<script setup>
import { BBadge } from 'bootstrap-vue-next'

defineProps({
  genres: {
    type: Array,
    required: true,
  },
})
</script>

<template>
  <BBadge v-for="g in genres || []" :key="g" variant="light" class="border text-dark me-1">{{
    g
  }}</BBadge>
</template>
