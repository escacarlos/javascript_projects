<script setup>
import CardItem from './Card.vue'
import { getCards } from '../services/cardService.js'
import { onMounted } from 'vue'
import { BCard, BCardBody, BCol, useToast } from 'bootstrap-vue-next'
import ListsForm from './ListsForm.vue'
import { store } from '../store/store.js'
import { handleError } from '../services/helper.js'

const { create } = useToast()

const props = defineProps({
  list: { type: Object, required: true },
  headerVariant: { type: String, default: 'primary' },
  isDragOver: { type: Boolean, default: false }
})

const emit = defineEmits([
  'dragstart',
  'dragend',
  'dragover',
  'dragleave',
  'drop',
  'dragstart-list',
  'dragover-list',
  'drop-list'
])

function onDragOver(e) {
  emit('dragover', e)
}

function onDrop(e) {
  emit('drop', e)
}

async function loadCards() {
  await getCards(props.list.id).catch((error) => {
    handleError(create, error, 'Error', 'Failed to load cards')
  })
}

onMounted(loadCards)

</script>

<template>
  <BCol
      cols="12"
      md="6"
      xl="4"
      class="mb-3 mb-md-0 rounded-3"
      :class="isDragOver ? 'bg-primary bg-opacity-10 border border-3 border-primary' : ''"
      :id="list.id"
      @dragover.prevent="$emit('dragover-list', $event, list)"
      @drop.prevent="$emit('drop-list', $event, list)"
      @dragover="onDragOver($event)"
      @dragleave="emit('dragleave')"
      @drop="onDrop($event)"
  >

  <BCard class="h-100 border shadow-sm" :header-bg-variant="headerVariant" header-text-variant="white" :no-body="true" >
      <template #header>
        <div class="d-flex align-items-center justify-content-between list-drag-handle w-100" draggable="true" @dragstart="$emit('dragstart-list', $event, list)">
          <div class="d-flex align-items-center gap-2 flex-grow-1 min-w-0">
            <h2
              class="h6 mb-0 fw-semibold"
            >{{ list.name }}</h2>
            <ListsForm :boardId="list.boardId" :list="list" />
          </div>
        </div>
      </template>

      <BCardBody>
        <div v-if="store.cards[list.id]?.length" class="d-flex flex-column gap-2">
          <CardItem
            v-for="card in store.cards[list.id]"
            :key="card.id"
            :card="card"
            @dragstart="$emit('dragstart', $event, card)"
            @dragend="$emit('dragend', $event)"
          />
        </div>
        <div v-else class="text-center">
          <p class="text-muted small mb-0">No cards in this list</p>
        </div>
      </BCardBody>
    </BCard>
  </BCol>
</template>

<style scoped>
.list-drag-handle {
  cursor: grab;
}
.list-drag-handle:active {
  cursor: grabbing;
}
</style>
