import { reactive } from 'vue'

const localStorageKey = 'utask_user_v2'

function getUser() {
  return JSON.parse(localStorage.getItem(localStorageKey)) || undefined
}

function getToken() {
  return JSON.parse(localStorage.getItem(localStorageKey))?.token || undefined
}

export const store = reactive({
  user: getUser(),
  boards: undefined,
  selectedBoard: undefined,
  lists: [],
  cards: [],
  sorting: "sortByPriority",
  token: getToken(),
  setUser: function(user) {
    localStorage.setItem(localStorageKey, JSON.stringify({ ...user, token: this.token }))
    this.user = user
    this.boards = undefined
    this.selectedBoard = undefined
    this.lists = []
    this.cards = []
    this.sorting = "sortByPriority"
  },
  setToken: function(token) {
    localStorage.setItem(localStorageKey, JSON.stringify({ ...this.user, token }))
    this.token = token
  }

})