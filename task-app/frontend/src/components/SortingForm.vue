<script setup>
import { BModal, BFormRadio, BButton } from 'bootstrap-vue-next'
import { store } from '../store/store.js'
import { ref } from 'vue'
import { sortCards } from '../services/cardService.js'

const sortingModal = ref(false)
const selected = ref('')

function openSortingModal() {
    selected.value = store.sorting
    sortingModal.value = true
}

function closeSortingModal() {
    sortingModal.value = false
}

function saveSorting() {
    if (selected.value === 'sortByDate') {
        store.sorting = "sortByDate"
    } else if (selected.value === 'sortByPriority') {
        store.sorting = "sortByPriority"
    }
    Object.entries(store.cards).forEach(([listId, cards]) => {
        sortCards(listId, cards)
    })
}
</script>

<template>
    <BButton variant="secondary" @click="openSortingModal">Sort</BButton>
    <BModal v-model="sortingModal" title="Sort cards" @hidden="closeSortingModal" @ok="saveSorting" :ok-disabled="selected === ''">
        <div class="sorting-modal-content">
            <p class="sorting-modal-label text-muted small text-uppercase mb-3">Choose sort criteria</p>
            <div class="sorting-options">
                <label class="sorting-option">
                    <BFormRadio v-model="selected" class="sorting-checkbox" name="sorting-criteria" value="sortByDate" />
                    <span class="sorting-option-label">Due date</span>
                </label>
                <label class="sorting-option">
                    <BFormRadio v-model="selected" class="sorting-checkbox" name="sorting-criteria" value="sortByPriority" />
                    <span class="sorting-option-label">Priority</span>
                </label>
            </div>
        </div>
    </BModal>
</template>

<style scoped>
.sorting-modal-content {
    padding: 0.25rem 0;
}

.sorting-modal-label {
    letter-spacing: 0.05em;
    font-weight: 600;
}

.sorting-options {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.sorting-option {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: var(--bs-light, #f8f9fa);
    border-radius: 0.5rem;
    border: 1px solid var(--bs-border-color, #dee2e6);
    cursor: pointer;
    transition: background-color 0.15s ease, border-color 0.15s ease;
}

.sorting-option:hover {
    background: var(--bs-gray-100, #e9ecef);
    border-color: var(--bs-primary);
}

.sorting-option-label {
    font-weight: 500;
    flex: 1;
}

.sorting-checkbox {
    margin: 0;
}

.sorting-hint {
    font-style: italic;
}
</style>