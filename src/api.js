// Base URL: in dev, Vite proxy redirects /api → localhost:3001
// In production, Express serves both API and static files on the same port

const BASE = '/api'

async function fetchJSON(path) {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`API ${path} → ${res.status}: ${text}`)
  }
  return res.json()
}

export const api = {
  getProcesses: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v && v !== 'all')
    ).toString()
    return fetchJSON(`/procesos${qs ? '?' + qs : ''}`)
  },
  getProcess: (id)  => fetchJSON(`/procesos/${id}`),
  getStats:   ()    => fetchJSON('/stats'),
  health:     ()    => fetchJSON('/health'),
}
