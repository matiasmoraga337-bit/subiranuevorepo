const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

async function request(path, options = {}) {
  const url = `${API_URL}${path}`
  const res = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      ...options.headers,
      'Content-Type': 'application/json',
    },
  })

  if (res.status === 401) {
    throw new Error('Sesión expirada')
  }

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || 'Error en la petición')
  }

  return data
}

export const api = {
  auth: {
    async register(username, password) {
      return request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      })
    },
    async login(username, password) {
      return request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      })
    },
    async me() {
      return request('/auth/me')
    },
    async logout() {
      return request('/auth/logout', { method: 'POST' })
    },
  },

  games: {
    async create() {
      return request('/games', { method: 'POST' })
    },
    async list() {
      return request('/games/user')
    },
    async get(id) {
      return request(`/games/${id}`)
    },
    async start(id) {
      return request(`/games/${id}/start`, { method: 'PUT' })
    },
    async advanceSegment(id) {
      return request(`/games/${id}/advance-segment`, { method: 'PUT' })
    },
    async makeDecision(id, decisionIndex) {
      return request(`/games/${id}/decision`, {
        method: 'PUT',
        body: JSON.stringify({ decisionIndex }),
      })
    },
    async continue(id) {
      return request(`/games/${id}/continue`, { method: 'PUT' })
    },
    async completeMinigame(id, result) {
      return request(`/games/${id}/minigame`, {
        method: 'PUT',
        body: JSON.stringify({ result }),
      })
    },
  },

  dialogue: {
    async generate(context) {
      return request('/dialogue/generate', {
        method: 'POST',
        body: JSON.stringify(context),
      })
    },
    async cacheStats() {
      return request('/dialogue/cache/stats')
    },
  },
}
