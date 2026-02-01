import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService } from '../services'
import type { User, LoginCredentials, RegisterData } from '../types'

/**
 * Auth Store
 * Manages authentication state using Pinia
 */

const TOKEN_KEY = 'auth_token'
const REFRESH_TOKEN_KEY = 'refresh_token'
const USER_KEY = 'auth_user'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const accessToken = ref<string | null>(null)
  const refreshTokenValue = ref<string | null>(null)
  const isLoading = ref(false)

  // Getters
  const isAuthenticated = computed(() => !!accessToken.value && !!user.value)

  const userFullName = computed(() => {
    if (!user.value) return ''
    return `${user.value.firstName} ${user.value.lastName}`
  })

  const userInitials = computed(() => {
    if (!user.value) return ''
    return `${user.value.firstName.charAt(0)}${user.value.lastName.charAt(0)}`
  })

  // Actions
  const setTokens = (access: string, refresh?: string) => {
    accessToken.value = access
    localStorage.setItem(TOKEN_KEY, access)

    if (refresh) {
      refreshTokenValue.value = refresh
      localStorage.setItem(REFRESH_TOKEN_KEY, refresh)
    }
  }

  const setUser = (userData: User) => {
    user.value = userData
    localStorage.setItem(USER_KEY, JSON.stringify(userData))
  }

  const clearAuth = () => {
    user.value = null
    accessToken.value = null
    refreshTokenValue.value = null
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    isLoading.value = true

    try {
      const response = await authService.login(credentials)
      setTokens(response.accessToken, response.refreshToken)
      setUser(response.user)
      return true
    } catch (error) {
      console.error('Login failed:', error)
      return false
    } finally {
      isLoading.value = false
    }
  }

  const register = async (data: RegisterData): Promise<boolean> => {
    isLoading.value = true

    try {
      const response = await authService.register(data)
      setTokens(response.accessToken, response.refreshToken)
      setUser(response.user)
      return true
    } catch (error) {
      console.error('Registration failed:', error)
      return false
    } finally {
      isLoading.value = false
    }
  }

  const logout = async () => {
    try {
      await authService.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      clearAuth()
    }
  }

  const refreshToken = async (): Promise<boolean> => {
    const refresh = refreshTokenValue.value

    if (!refresh) return false

    try {
      const response = await authService.refreshToken(refresh)
      setTokens(response.accessToken)
      return true
    } catch (error) {
      console.error('Token refresh failed:', error)
      clearAuth()
      return false
    }
  }

  const fetchProfile = async (): Promise<boolean> => {
    try {
      const userData = await authService.getProfile()
      setUser(userData)
      return true
    } catch (error) {
      console.error('Failed to fetch profile:', error)
      return false
    }
  }

  const initializeAuth = () => {
    const storedToken = localStorage.getItem(TOKEN_KEY)
    const storedRefresh = localStorage.getItem(REFRESH_TOKEN_KEY)
    const storedUser = localStorage.getItem(USER_KEY)

    if (storedToken) {
      accessToken.value = storedToken
    }

    if (storedRefresh) {
      refreshTokenValue.value = storedRefresh
    }

    if (storedUser) {
      try {
        user.value = JSON.parse(storedUser)
      } catch {
        localStorage.removeItem(USER_KEY)
      }
    }
  }

  return {
    // State
    user,
    accessToken,
    isLoading,

    // Getters
    isAuthenticated,
    userFullName,
    userInitials,

    // Actions
    login,
    register,
    logout,
    refreshToken,
    fetchProfile,
    initializeAuth,
    clearAuth,
  }
})
