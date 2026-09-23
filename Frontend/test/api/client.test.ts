import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { api, bindAuthBridge, refreshSession } from '@/api/client.ts'
import type { AuthTokens } from '@/auth/types.ts'

const tokens: AuthTokens = {
  accessToken: 'new-token',
  refreshToken: 'refresh',
  expiresInSeconds: 60,
  user: {
    id: '1',
    email: 'a@b.c',
    firstName: 'A',
    lastName: 'B',
    roles: [],
  },
}

const originalAdapter = api.defaults.adapter

afterEach(() => {
  api.defaults.adapter = originalAdapter
  bindAuthBridge({
    getAccessToken: () => null,
    applySession: () => {},
    clearSession: () => {},
  })
  vi.restoreAllMocks()
})

describe('api client', () => {
  it('attaches a bearer token when one is available', async () => {
    bindAuthBridge({
      getAccessToken: () => 'tok',
      applySession: vi.fn(),
      clearSession: vi.fn(),
    })
    const adapter = vi.fn(async (config: InternalAxiosRequestConfig) => ({
      data: { ok: true },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    }))
    api.defaults.adapter = adapter
    await api.get('/catalog')
    expect(adapter.mock.calls[0]?.[0].headers.Authorization).toBe('Bearer tok')
  })

  it('skips refresh on anonymous auth 401s', async () => {
    const refresh = vi.spyOn(axios, 'post')
    api.defaults.adapter = async (config) => {
      const error = new AxiosError('unauth')
      error.config = config
      error.response = {
        status: 401,
        data: {},
        statusText: 'Unauthorized',
        headers: {},
        config,
      }
      throw error
    }
    await expect(api.post('/auth/login', {})).rejects.toBeTruthy()
    expect(refresh).not.toHaveBeenCalled()
  })

  it('refreshes once and retries protected 401s', async () => {
    let token = 'old'
    bindAuthBridge({
      getAccessToken: () => token,
      applySession: (next) => {
        token = next.accessToken
      },
      clearSession: vi.fn(),
    })
    vi.spyOn(axios, 'post').mockResolvedValue({ data: tokens })
    let attempts = 0
    api.defaults.adapter = async (config) => {
      attempts += 1
      const header = String(config.headers.Authorization ?? '')
      if (attempts === 1) {
        const error = new AxiosError('unauth')
        error.config = config
        error.response = {
          status: 401,
          data: {},
          statusText: 'Unauthorized',
          headers: {},
          config,
        }
        throw error
      }
      return {
        data: { ok: true, header },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      }
    }
    const response = await api.get('/catalog/cpu')
    expect(response.data.ok).toBe(true)
    expect(response.data.header).toBe('Bearer new-token')
  })

  it('rethrows 401s when refresh returns no tokens', async () => {
    bindAuthBridge({
      getAccessToken: () => 'old',
      applySession: vi.fn(),
      clearSession: vi.fn(),
    })
    vi.spyOn(axios, 'post').mockResolvedValue({ data: null })
    api.defaults.adapter = async (config) => {
      const error = new AxiosError('unauth')
      error.config = config
      error.response = {
        status: 401,
        data: {},
        statusText: 'Unauthorized',
        headers: {},
        config,
      }
      throw error
    }
    await expect(api.get('/catalog/cpu')).rejects.toBeTruthy()
  })

  it('treats an empty refresh as a guest session', async () => {
    const applySession = vi.fn()
    const clearSession = vi.fn()
    bindAuthBridge({
      getAccessToken: () => null,
      applySession,
      clearSession,
    })
    vi.spyOn(axios, 'post').mockResolvedValue({ data: '', status: 204 })
    await expect(refreshSession()).resolves.toBeNull()
    expect(applySession).not.toHaveBeenCalled()
    expect(clearSession).not.toHaveBeenCalled()
  })

  it('clears the session when refresh fails', async () => {
    const clearSession = vi.fn()
    bindAuthBridge({
      getAccessToken: () => null,
      applySession: vi.fn(),
      clearSession,
    })
    vi.spyOn(axios, 'post').mockRejectedValue(new Error('nope'))
    await expect(refreshSession()).resolves.toBeNull()
    expect(clearSession).toHaveBeenCalled()
  })

  it('parses absolute URLs when deciding whether to skip refresh', async () => {
    api.defaults.adapter = async (config) => {
      const error = new AxiosError('unauth')
      error.config = config
      error.response = {
        status: 401,
        data: {},
        statusText: 'Unauthorized',
        headers: {},
        config,
      }
      throw error
    }
    const refresh = vi.spyOn(axios, 'post')
    await expect(
      api.post('https://example.test/api/auth/login', {}),
    ).rejects.toBeTruthy()
    expect(refresh).not.toHaveBeenCalled()
  })
})
