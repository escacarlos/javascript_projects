<script setup>
import { ref, onMounted, watch } from 'vue'
import { getLists, updateList } from '../services/listService.js'
import { updateCard } from '../services/cardService.js'
import { BRow, useToast, BButtonGroup } from 'bootstrap-vue-next'
import ListsForm from './ListsForm.vue'
import Lists from './Lists.vue'
import { store } from '../store/store.js'
import SortingForm from './SortingForm.vue'
import { handleError } from '../services/helper.js'

const draggedTaskId = ref(null)
const { create } = useToast()
const dragOverBoardId = ref(null)

const props = defineProps({
    board: { type: Object, required: true },
})

function onDragStart(e, task) {
  draggedTaskId.value = task
  e.target.classList.add('opacity-50')
  e.dataTransfer.effectAllowed = 'move'
}

function onDragEnd(e) {
  if (e?.target) e.target.classList.remove('opacity-50')
  draggedTaskId.value = null
  dragOverBoardId.value = null
}

function onDragOver(e, boardId) {
  e.preventDefault()
  e.dataTransfer.dropEffect = 'move'
  dragOverBoardId.value = boardId
}

function onDragLeave() {
  dragOverBoardId.value = null
}

async function onDrop(e, boardId) {
    e.stopPropagation()
    dragOverBoardId.value = null
    const task = draggedTaskId.value
    if (task) {
      const oldListId = task.listId
      task.listId = boardId;
      await updateCard(task).then(() => {
        if (oldListId !== boardId) {
          store.cards[oldListId] = store.cards[oldListId].filter(c => c.id !== task.id)
        }
      })
    }
    draggedTaskId.value = null
}

async function refreshLists() {
  await getLists(props.board.id).catch((error) => {
    handleError(create, error, 'Error', 'Failed to load lists')
  })
}

onMounted(async () => {
  refreshLists()
})

watch(() => props.board, refreshLists)

const draggedListId = ref(null)

function onListDragStart(e, list) {
  draggedListId.value = list.id
}

function onListDragOver(e, list) {
  e.preventDefault()
  dragOverBoardId.value = list.id
}

async function onListDrop(e, targetList) {
  const fromId = draggedListId.value
  const toId = targetList.id
  if (!fromId || fromId === toId) return

  const fromIndex = store.lists[store.selectedBoard.id].findIndex(l => l.id === fromId)
  const toIndex = store.lists[store.selectedBoard.id].findIndex(l => l.id === toId)

  const moved = store.lists[store.selectedBoard.id].splice(fromIndex, 1)[0]
  store.lists[store.selectedBoard.id].splice(toIndex, 0, moved)

  for (let i = 0; i < store.lists[store.selectedBoard.id].length; i++) {
    const list = store.lists[store.selectedBoard.id][i]
    await updateList(list.id, list.name, i, list.boardId)
  }

  draggedListId.value = null
  dragOverBoardId.value = null
}

</script>

<template>
  <div class="d-flex justify-content-end align-items-center mb-3 gap-2">
    <BButtonGroup>
      <SortingForm />
      <ListsForm :boardId="board.id" />
    </BButtonGroup>
  </div>

  <BRow class="g-4">
    <Lists
        v-for="list in store.lists[board.id]"
        :key="list.id"
        :list="list"
        :is-drag-over="dragOverBoardId === list.id"
        @dragstart="(e, card) => onDragStart(e, card)"
        @dragend="(e) => onDragEnd(e)"
        @dragover="(e) => onDragOver(e, list.id)"
        @dragleave="(e) => onDragLeave(e)"
        @drop="(e) => onDrop(e, list.id)"
        @dragstart-list="onListDragStart($event, list)"
        @dragover-list="onListDragOver($event, list)"
        @drop-list="onListDrop($event, list)"
    />

  </BRow>
</template>