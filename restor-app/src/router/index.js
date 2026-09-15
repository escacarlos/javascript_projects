import { createRouter, createWebHistory } from 'vue-router'
import Home from '../pages/Home.vue'
import Restaurant from '../pages/Restaurant.vue'
import User from '../pages/User.vue'
import Login from '../pages/Login.vue'
import { store } from '@/store/store'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: {
      requiresAuth: false,
      requiresAnonymous: false,
    },
  },
  {
    path: '/restaurant/:id',
    name: 'Restaurant',
    component: Restaurant,
    meta: {
      requiresAuth: false,
      requiresAnonymous: false,
    },
  },
  {
    path: '/user/:id',
    name: 'User',
    component: User,
    meta: {
      requiresAuth: true,
      requiresAnonymous: false,
    },
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: {
      requiresAuth: false,
      requiresAnonymous: true,
    },
  },
]

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach((to, from, next) => {
  if (to.meta.requiresAnonymous && store.user) {
    next('/')
  } else if (to.meta.requiresAuth && !store.user) {
    next('/login')
  } else {
    next()
  }
})
