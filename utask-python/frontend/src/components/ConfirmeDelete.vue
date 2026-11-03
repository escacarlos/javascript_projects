<script setup>
import { BButton } from 'bootstrap-vue-next'
import { ref } from 'vue'

const emit = defineEmits(['confirmDelete'])

defineProps({
    isDeleting: { type: Boolean, default: false }
})

const confirmingDelete = ref(false)
</script>

<template>
    <template v-if="!confirmingDelete">
        <BButton size="sm" variant="danger" @click="confirmingDelete = true">Delete</BButton>
    </template>
    <template v-else>
        <span class="me-2 text-danger">Confirm delete?</span>
        <BButton size="sm" variant="danger" @click="emit('confirmDelete')" :disabled="isDeleting" :loading="isDeleting" :loading-text="'Deleting...'">Yes, delete</BButton>
        <BButton size="sm" variant="secondary" @click="confirmingDelete = false">Cancel</BButton>
    </template>
</template>