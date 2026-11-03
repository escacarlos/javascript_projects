import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Board from '../views/Board.vue'
import { store } from '../store/store.js'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home,
      meta: { title: 'My TODO List : Login', requiresAuth: false }
    },
    {
      path: '/board/:id?',
      name: 'board',
      component: Board,
      meta: { title: 'My TODO List : Board', requiresAuth: true }
    }
  ]
})

router.beforeEach((to, _from, next) => {
  if (to.meta.requiresAuth && store.user === undefined) {
    next({ name: 'home' })
  } else {
    next()
  }
})

export default router
