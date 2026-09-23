import { QueryClientProvider } from '@tanstack/react-query'
import { render, type RenderOptions } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { AuthContext } from '@/auth/auth-context.ts'
import type { AuthContextValue } from '@/auth/types.ts'
import { PcBuildProvider } from '@/builds'
import type { PcBuildDraft } from '@/api/builds.ts'
import { createQueryClient } from '@/query/query-client.ts'

const anonymousAuth: AuthContextValue = {
  user: null,
  accessToken: null,
  isReady: true,
  isAuthenticated: false,
  isAdmin: false,
  isMember: false,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  hasRole: () => false,
  forgotPassword: async () => {},
  resetPassword: async () => {},
  changePassword: async () => {},
}

export function renderWithQuery(
  ui: ReactElement,
  options?: {
    route?: string
    initialBuild?: Partial<PcBuildDraft>
  } & Omit<RenderOptions, 'wrapper'>,
) {
  const { route = '/', initialBuild, ...renderOptions } = options ?? {}
  const queryClient = createQueryClient({ retry: false })

  return {
    queryClient,
    ...render(ui, {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={[route]}>
            <AuthContext.Provider value={anonymousAuth}>
              <PcBuildProvider initialDraft={initialBuild}>{children}</PcBuildProvider>
            </AuthContext.Provider>
          </MemoryRouter>
        </QueryClientProvider>
      ),
      ...renderOptions,
    }),
  }
}
