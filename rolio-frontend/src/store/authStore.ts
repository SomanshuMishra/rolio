import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authAPI } from '@/lib/api'

export interface User {
  id: string
  email: string
  full_name: string
  avatar_url: string | null
  created_at: string
  is_active: boolean
}

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  isHydrated: boolean

  register: (email: string, password: string, fullName: string) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  setUser: (user: User) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      isHydrated: false,

      register: async (email: string, password: string, fullName: string) => {
        try {
          set({ isLoading: true, error: null })
          const response = await authAPI.register({
            email,
            password,
            full_name: fullName,
          })

          const { user, access_token, refresh_token } = response.data

          // Store tokens in localStorage for axios interceptor
          if (typeof window !== 'undefined') {
            localStorage.setItem(
              'rolio_tokens',
              JSON.stringify({
                accessToken: access_token,
                refreshToken: refresh_token,
              })
            )
          }

          set({
            user,
            accessToken: access_token,
            refreshToken: refresh_token,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (err: any) {
          const errorMsg = err.response?.data?.detail || 'Registration failed'
          set({ error: errorMsg, isLoading: false })
          throw err
        }
      },

      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null })
          const response = await authAPI.login({ email, password })

          const { access_token, refresh_token } = response.data

          // Store tokens first so API interceptor can use them
          if (typeof window !== 'undefined') {
            localStorage.setItem(
              'rolio_tokens',
              JSON.stringify({
                accessToken: access_token,
                refreshToken: refresh_token,
              })
            )
          }

          // Update state with tokens
          set({
            accessToken: access_token,
            refreshToken: refresh_token,
            isAuthenticated: true,
          })

          // Fetch user profile using the new tokens
          try {
            const { profileAPI } = await import('@/lib/api')
            const profileResponse = await profileAPI.get()
            const userData = profileResponse.data.user

            set({
              user: userData,
              isLoading: false,
            })
          } catch (profileErr) {
            console.error('Failed to fetch profile after login:', profileErr)
            set({ isLoading: false })
            // Continue anyway - user is authenticated even if we can't fetch profile
          }
        } catch (err: any) {
          const errorMsg = err.response?.data?.detail || 'Login failed'
          set({ error: errorMsg, isLoading: false })
          throw err
        }
      },

      logout: async () => {
        try {
          const { refreshToken } = get()
          if (refreshToken) {
            await authAPI.logout(refreshToken)
          }
        } catch (err) {
          console.error('Logout error:', err)
        } finally {
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
          })
          if (typeof window !== 'undefined') {
            localStorage.removeItem('rolio_tokens')
          }
        }
      },

      setUser: (user: User) => {
        set({ user })
      },

      clearAuth: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null,
        })
        if (typeof window !== 'undefined') {
          localStorage.removeItem('rolio_tokens')
        }
      },
    }),
    {
      name: 'rolio-auth-store',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isHydrated = true
        }
      },
    }
  )
)
