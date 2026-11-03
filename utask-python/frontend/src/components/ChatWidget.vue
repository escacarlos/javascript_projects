<script setup>
import { ref, watch, nextTick, onBeforeUnmount, computed, onMounted } from 'vue'
import { store } from '../store/store.js'
import { connectChatWebSocket, getChatServerUrl } from '../services/chatSocket.js'
import {
  BAlert,
  BButton,
  BCard,
  BCardBody,
  BCardFooter,
  BCardHeader,
  BCardText,
  BCardTitle,
  BForm,
  BFormInput,
  BInputGroup,
  BListGroup,
  BListGroupItem,
} from 'bootstrap-vue-next'

const serverUrl = getChatServerUrl()

const isOpen = ref(false)
const unreadCount = ref(0)
const messages = ref([])
const text = ref('')
const status = ref({ state: 'idle', message: '' })
const endAnchor = ref(null)

let chat = null

const inputDisabled = computed(
  () => status.value.state === 'error' && !serverUrl,
)

function addMessage(textToAdd) {
  messages.value.push({
    id: `${Date.now()}-${Math.random()}`,
    text: textToAdd,
  })
}

function scrollToBottom() {
  nextTick(() => {
    endAnchor.value?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  })
}

watch(
  () => messages.value.length,
  () => scrollToBottom(),
)

function ensureConnection() {
  if (chat || !store.user || !store.token) return
  const username = store.user?.username
  chat = connectChatWebSocket({
    token: store.token,
    username,
    onStatus: (s) => {
      status.value = s
      if (s?.state === 'error' && !serverUrl) {
        addMessage(
          'Erreur: définis VITE_CHAT_SERVER_URL (ex. http://localhost:3001) pour Socket.IO.',
        )
      }
    },
    onMessage: (msg) => {
      if (!msg?.text) return
      addMessage(msg.text)
      if (!isOpen.value) {
        unreadCount.value += 1
      }
    },
  })
}

watch(
  () => [store.user?.username, store.token],
  () => {
    chat?.close?.()
    chat = null
    if (store.user && store.token) {
      ensureConnection()
    }
  },
)

function toggleOpen() {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    unreadCount.value = 0
    scrollToBottom()
  }
}

function sendMessage() {
  const content = text.value.trim()
  if (!content) return
  ensureConnection()

  addMessage(store.user?.username ? `${store.user.username}: ${content}` : content)
  text.value = ''
  chat?.send(content)
}

onBeforeUnmount(() => {
  chat?.close?.()
  chat = null
})

onMounted(() => {
  ensureConnection()
})
</script>

<template>
  <Teleport to="body">
    <div class="chat-widget-root">
      <Transition name="chat-pop">
        <BCard
          v-show="isOpen"
          no-body
          class="chat-panel shadow-lg border-0"
        >
          <BCardHeader
            class="chat-panel-header d-flex align-items-center justify-content-between border-0"
          >
            <BCardTitle tag="h6" class="mb-0 fw-semibold text-white">
              Chat
            </BCardTitle>
            <div class="d-flex align-items-center gap-2">
              <BCardText
                v-if="status?.message && status.state !== 'error'"
                tag="span"
                class="mb-0 small text-white-50 text-truncate chat-status-line"
              >
                {{ status.message }}
              </BCardText>
              <BButton
                variant="light"
                size="sm"
                class="rounded-circle p-0 chat-icon-btn"
                aria-label="Fermer le chat"
                @click="isOpen = false"
              >
                <i class="bi bi-chevron-down" aria-hidden="true" />
              </BButton>
            </div>
          </BCardHeader>

          <BAlert
            v-if="status.state === 'error' && status.message"
            variant="danger"
            class="py-1 px-2 mx-2 mt-2 mb-0 small"
            show
          >
            {{ status.message }}
          </BAlert>

          <BCardBody class="chat-messages border-0 p-3">
            <BCardText
              v-if="messages.length === 0"
              class="text-muted text-center small mb-0 py-4"
            >
              Waiting for messages...
            </BCardText>
            <BListGroup v-else flush>
              <BListGroupItem
                v-for="m in messages"
                :key="m.id"
                class="border-0 bg-transparent px-0 py-1"
              >
                <BCardText class="chat-bubble mb-0 small">
                  {{ m.text }}
                </BCardText>
              </BListGroupItem>
            </BListGroup>
            <div ref="endAnchor" />
          </BCardBody>

          <BCardFooter class="chat-input border-0 bg-white">
            <BForm @submit.prevent="sendMessage">
              <BInputGroup size="sm">
                <BFormInput
                  v-model="text"
                  placeholder="Your message..."
                  :disabled="inputDisabled"
                />
                <BButton
                  type="submit"
                  variant="primary"
                  :disabled="inputDisabled"
                >
                  Send
                </BButton>
              </BInputGroup>
            </BForm>
          </BCardFooter>
        </BCard>
      </Transition>

      <BButton
        variant="primary"
        class="chat-fab rounded-circle shadow border-0 position-relative"
        :class="{ 'chat-fab--open': isOpen }"
        :aria-label="
          isOpen
            ? 'Fermer le chat'
            : unreadCount > 0
              ? `Ouvrir le chat, ${unreadCount} message${unreadCount > 1 ? 's' : ''} non lu${unreadCount > 1 ? 's' : ''}`
              : 'Ouvrir le chat'
        "
        @click="toggleOpen"
      >
        <span
          v-if="unreadCount > 0 && !isOpen"
          class="chat-fab-badge"
          aria-hidden="true"
        >
          {{ unreadCount > 99 ? '99+' : unreadCount }}
        </span>
        <i
          v-if="!isOpen"
          class="bi bi-chat-dots-fill fs-5"
          aria-hidden="true"
        />
        <i v-else class="bi bi-x-lg fs-5" aria-hidden="true" />
      </BButton>
    </div>
  </Teleport>
</template>

<style scoped>
.chat-widget-root {
  position: fixed;
  right: 1.25rem;
  bottom: 1.25rem;
  z-index: 1050;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.75rem;
  pointer-events: none;
}

.chat-widget-root > * {
  pointer-events: auto;
}

.chat-panel {
  width: min(100vw - 2rem, 380px);
  height: min(70vh, 480px);
  background: #fff;
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transform-origin: bottom right;
}

.chat-panel-header {
  padding: 0.75rem 1rem;
  background: #5c6b7a;
  color: #fff;
}

.chat-status-line {
  max-width: 140px;
  display: inline-block;
}

.chat-icon-btn {
  width: 2rem;
  height: 2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.chat-messages {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  background: #f8f9fb;
}

.chat-bubble {
  background: #fff;
  padding: 8px 12px;
  border-radius: 10px;
  white-space: pre-wrap;
  word-break: break-word;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
}

.chat-input {
  padding: 0.5rem;
  border-top: 1px solid var(--bs-border-color, rgba(0, 0, 0, 0.1));
}

.chat-fab {
  width: 3.5rem;
  height: 3.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chat-fab--open {
  background-color: #4a5662 !important;
  border-color: #4a5662 !important;
}

.chat-fab-badge {
  position: absolute;
  top: -0.15rem;
  right: -0.15rem;
  min-width: 1.25rem;
  height: 1.25rem;
  padding: 0 0.35rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
  font-weight: 700;
  line-height: 1;
  color: #fff;
  background: #ff3b30;
  border-radius: 999px;
  box-shadow: 0 0 0 2px #fff;
  pointer-events: none;
}

.chat-pop-enter-active,
.chat-pop-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.chat-pop-enter-from,
.chat-pop-leave-to {
  opacity: 0;
  transform: scale(0.92) translateY(8px);
}
</style>
