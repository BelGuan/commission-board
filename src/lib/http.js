const BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000').replace(/\/$/, '')
const TOKEN_KEY = 'cb.token'

export class ApiError extends Error {
  constructor(message, { status = 0, code = 'network_error', errors = [] } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code

    this.errors = errors
  }

  get userMessage() {
    if (this.errors.length) {
      const first = this.errors[0]
      const field = String(first.field ?? '').split('.').pop()
      return field ? `${field}: ${first.message}` : first.message
    }
    return this.message
  }
}

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {

  }
}

export const clearToken = () => setToken(null)

let onUnauthorized = null
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler
}

function buildQuery(params) {
  const search = new URLSearchParams()
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value == null || value === '' || value === false) return
    if (Array.isArray(value)) {
      if (value.length) search.set(key, value.join(','))
      return
    }
    search.set(key, String(value))
  })
  const qs = search.toString()
  return qs ? `?${qs}` : ''
}

async function parseBody(response) {
  if (response.status === 204) return null
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

export async function request(path, { method = 'GET', body, params, auth = true, signal } = {}) {
  const headers = {}
  const token = auth ? getToken() : null
  if (token) headers.Authorization = `Bearer ${token}`

  const isForm = typeof FormData !== 'undefined' && body instanceof FormData
  if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json'

  let response
  try {
    response = await fetch(`${BASE_URL}${path}${buildQuery(params)}`, {
      method,
      headers,
      signal,
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    })
  } catch (cause) {
    if (cause?.name === 'AbortError') throw cause
    throw new ApiError(
      'Could not reach the server. Is the API running on ' + BASE_URL + '?',
      { code: 'network_error' },
    )
  }

  const payload = await parseBody(response)

  if (response.ok) return payload

  if (response.status === 401) {

    clearToken()
    onUnauthorized?.()
  }

  throw new ApiError(payload?.detail ?? `Request failed (${response.status})`, {
    status: response.status,
    code: payload?.code ?? 'error',
    errors: payload?.errors ?? [],
  })
}

export const http = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
  patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
  delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
}

export { BASE_URL }
