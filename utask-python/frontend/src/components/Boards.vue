<script setup>
import Board from './Board.vue'
import { getBoards } from '../services/boardService.js'
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { BNav, BNavItem, BRow, useToast } from 'bootstrap-vue-next'
import BoardForm from './BoardForm.vue'
import { store } from '../store/store.js'
import { handleError } from '../services/helper.js'

const router = useRouter()
const { create } = useToast()

onMounted(async () => {
  await getBoards().catch((error) => {
    handleError(create, error, 'Error', 'Failed to load boards')
  })
  if (router.currentRoute.value.params?.id) {
    store.selectedBoard = store.boards?.find(board => board.id === router.currentRoute.value.params.id)
  } else if (store.boards?.length > 0) {
    store.selectedBoard = store.boards[0]
    router.push(`/board/${store.selectedBoard.id}`)
  }
})

</script>

<template>
  <BNav tabs>
    <BNavItem v-for="board in (store.boards ?? [])" :key="board.id" :to="`/board/${board.id}`" :active="store.selectedBoard?.id === board.id" @click="store.selectedBoard = board">
      <span class="me-2">{{ board.name }}</span>
      <BoardForm :board="board" />
    </BNavItem>
    <BoardForm />
  </BNav>
  <BRow class="g-4 mt-0">
    <Board :board="store.selectedBoard" v-if="store.selectedBoard" />
  </BRow>  
</template>
