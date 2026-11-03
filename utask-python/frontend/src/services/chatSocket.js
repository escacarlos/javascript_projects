import { io } from 'socket.io-client'

export function getChatServerUrl() {
  const direct = import.meta.env.VITE_CHAT_SERVER_URL
  if (typeof direct === 'string' && direct.trim()) return direct.trim()

  const legacy = import.meta.env.VITE_CHAT_WS_URL
  if (typeof legacy === 'string' && legacy.trim()) {
    const raw = legacy.trim()
    try {
      const normalized = raw.replace(/^ws:/i, 'http:').replace(/^wss:/i, 'https:')
      return new URL(normalized).origin
    } catch {
      return raw
        .replace(/^wss:\/\//i, 'https://')
        .replace(/^ws:\/\//i, 'http://')
    }
  }

  return undefined
}

function formatIncomingMessage(payload) {
  if (payload == null) return ''
  if (typeof payload === 'string') return payload
  if (typeof payload === 'object') {
    if (typeof payload.username === 'string' && typeof payload.text === 'string') {
      return `${payload.username}: ${payload.text}`
    }
    if (typeof payload.text === 'string') return payload.text
    if (typeof payload.message === 'string') return payload.message
  }
  try {
    return JSON.stringify(payload)
  } catch {
    return String(payload)
  }
}

export function connectChatWebSocket({ token, username, onMessage, onStatus }) {
  const serverUrl = getChatServerUrl()

  if (!serverUrl) {
    onStatus?.({
      state: 'error',
      message: 'URL du serveur de chat non configurée',
    })
    return {
      send: () => {},
      close: () => {},
      socket: null,
    }
  }

  if (!token) {
    onStatus?.({
      state: 'error',
      message: 'Connexion au chat impossible sans jeton (connecte-toi).',
    })
    return {
      send: () => {},
      close: () => {},
      socket: null,
    }
  }

  const socket = io(serverUrl, {
    auth: { token },
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  })

  socket.on('connect', () => {
    onStatus?.({ state: 'connected', message: 'Connected to chat' })
  })

  socket.on('disconnect', (reason) => {
    onStatus?.({
      state: 'disconnected',
      message: reason === 'io client disconnect' ? 'Disconnected' : `Disconnected (${reason})`,
    })
  })

  socket.on('connect_error', (err) => {
    onStatus?.({
      state: 'error',
      message: err?.message || 'Connection error',
    })
  })

  socket.on('chat:message', (payload) => {
    const text = formatIncomingMessage(payload)
    if (!text) return
    onMessage?.({
      id: crypto.randomUUID?.() ?? String(Date.now() + Math.random()),
      text,
      raw: payload,
    })
  })

  function sendText(text) {
    if (!socket.connected) return
    const u =
      typeof username === 'string' && username.trim().length > 0
        ? username.trim()
        : 'Anonyme'
    socket.emit('chat:message', { username: u, text })
  }

  return {
    send: sendText,
    close: () => {
      socket.removeAllListeners()
      socket.disconnect()
    },
    socket,
  }
}
