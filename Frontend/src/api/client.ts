import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import type { AuthTokens } from '../auth/types'

type AuthBridge = {
  getAccessToken: () => string | null
  applySession: (tokens: AuthTokens) => void
  clearSession: () => void
}

const anonymousAuthPath =
  /\/auth\/(login|register|refresh|logout|forgot-password|reset-password)(?:\?|$)/

let bridge: AuthBridge = {
  getAccessToken: () => null,
  applySession: () => {},
  clearSession: () => {},
}

let refreshPromise: Promise<AuthTokens | null> | null = null
const retriedRequests = new WeakSet<InternalAxiosRequestConfig>()

export function bindAuthBridge(next: AuthBridge) {
  bridge = next
}

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const token = bridge.getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config
    if (!original || error.response?.status !== 401) {
      throw error
    }

    if (shouldSkipRefresh(original) || retriedRequests.has(original)) {
      throw error
    }

    retriedRequests.add(original)

    const tokens = await refreshSession()
    if (!tokens) {
      throw error
    }

    original.headers.Authorization = `Bearer ${tokens.accessToken}`
    return api(original)
  },
)

export async function refreshSession(): Promise<AuthTokens | null> {
  refreshPromise ??= (async () => {
    try {
      const { data, status } = await axios.post<AuthTokens>(
        '/api/auth/refresh',
        {},
        { withCredentials: true },
      )
      if (status === 204 || !data?.accessToken) {
        return null
      }
      bridge.applySession(data)
      return data
    } catch {
      bridge.clearSession()
      return null
    }
  })().finally(() => {
    refreshPromise = null
  })

  return refreshPromise
}

function shouldSkipRefresh(config: InternalAxiosRequestConfig): boolean {
  return anonymousAuthPath.test(requestPath(config))
}

function requestPath(config: InternalAxiosRequestConfig): string {
  const url = config.url ?? ''
  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      return new URL(url).pathname
    } catch {
      return url
    }
  }

  return `${config.baseURL ?? ''}${url}`
}
