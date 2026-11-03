<script setup>
import { BCard } from 'bootstrap-vue-next'
import CardForm from './CardForm.vue'

defineProps({
  card: { type: Object, required: true }
})

const emit = defineEmits(['dragstart', 'dragend'])

</script>

<template>
  <BCard
    border-variant="secondary"
    class="border-start border-4 shadow-sm"
    :no-body="true"
    draggable="true"
    :data-id="card.id"
    @dragstart="emit('dragstart', $event)"
    @dragend="emit('dragend', $event)">
    <CardForm :card="card" :listId="card.listId" />
  </BCard>
</template>
