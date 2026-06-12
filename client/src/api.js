const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001/api'

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

async function apiRequest(path, options = {}) {
  const { body, headers, ...fetchOptions } = options
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    ...fetchOptions,
  })
  const text = await response.text()
  const data = text ? JSON.parse(text) : undefined

  if (!response.ok) {
    throw new ApiError(
      data?.error ?? 'Request failed',
      response.status,
      data,
    )
  }

  return data
}

export function getInstructions() {
  return apiRequest('/instructions')
}

export function getCurrentSession() {
  return apiRequest('/sessions/current')
}

export function loginSession(credentials) {
  return apiRequest('/sessions', {
    method: 'POST',
    body: credentials,
  })
}

export function logoutSession() {
  return apiRequest('/sessions/current', {
    method: 'DELETE',
  })
}
