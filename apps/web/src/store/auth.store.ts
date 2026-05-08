import { create } from 'zustand'

interface AuthStore {
  accessToken: string | null
  user: any | null
  setTokens: (access: string, refresh: string) => void
  logout: () => void
  init: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  accessToken: null,
  user: null,

  init: () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken')
      if (token) set({ accessToken: token })
    }
  },

  setTokens: (access, refresh) => {
    localStorage.setItem('accessToken', access)
    localStorage.setItem('refreshToken', refresh)
    set({ accessToken: access })
  },

  logout: () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    set({ accessToken: null, user: null })
  },
}))
