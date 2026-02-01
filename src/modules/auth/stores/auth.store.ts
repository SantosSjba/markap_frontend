import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService } from '../services'
import type { User, LoginCredentials } from '../types'

/**
 * Auth Store
 * Manages authentication state using Pinia
 * Synchronized with backend response structure
 */

const TOKEN_KEY = 'markap_token'
const USER_KEY = 'markap_user'
const EXPIRES_KEY = 'markap_expires'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const accessToken = ref<string | null>(null)
  const expiresIn = ref<number | null>(null)
  const isLoading = ref(false)

  // Getters
  const isAuthenticated = computed(() => !!accessToken.value && !!user.value)

  const userFullName = computed(() => {
    if (!user.value) return ''
    return user.value.fullName || `${user.value.firstName} ${user.value.lastName}`
  })

  const userInitials = computed(() => {
    if (!user.value) return ''
    return `${user.value.firstName.charAt(0)}${user.value.lastName.charAt(0)}`.toUpperCase()
  })

  // Actions
  const setAuth = (userData: User, token: string, expires: number) => {
    user.value = userData
    accessToken.value = token
    expiresIn.value = expires

    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(userData))
    localStorage.setItem(EXPIRES_KEY, expires.toString())
  }

  const clearAuth = () => {
    user.value = null
    accessToken.value = null
    expiresIn.value = null

    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(EXPIRES_KEY)
  }

  const login = async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
    isLoading.value = true

    try {
      const response = await authService.login(credentials)
      setAuth(response.user, response.accessToken, response.expiresIn)
      return { success: true }
    } catch (error: unknown) {
      console.error('Login failed:', error)
      
      // Extract error message from backend response
      let errorMessage = 'Error al iniciar sesión'
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string }; status?: number } }
        if (axiosError.response?.status === 401) {
          errorMessage = 'Credenciales inválidas'
        } else if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message
        }
      }

      return { success: false, error: errorMessage }
    } finally {
      isLoading.value = false
    }
  }

  const logout = () => {
    authService.logout()
    clearAuth()
  }

  const fetchProfile = async (): Promise<boolean> => {
    try {
      const userData = await authService.getProfile()
      user.value = userData
      localStorage.setItem(USER_KEY, JSON.stringify(userData))
      return true
    } catch (error) {
      console.error('Failed to fetch profile:', error)
      return false
    }
  }

  const initializeAuth = () => {
    const storedToken = localStorage.getItem(TOKEN_KEY)
    const storedUser = localStorage.getItem(USER_KEY)
    const storedExpires = localStorage.getItem(EXPIRES_KEY)

    if (storedToken) {
      accessToken.value = storedToken
    }

    if (storedExpires) {
      expiresIn.value = parseInt(storedExpires, 10)
    }

    if (storedUser) {
      try {
        user.value = JSON.parse(storedUser)
      } catch {
        localStorage.removeItem(USER_KEY)
      }
    }
  }

  // Check if token is expired (optional, for future use)
  const isTokenExpired = computed(() => {
    // This would need the actual token issue time to calculate
    // For now, we rely on backend returning 401 for expired tokens
    return false
  })

  return {
    // State
    user,
    accessToken,
    expiresIn,
    isLoading,

    // Getters
    isAuthenticated,
    userFullName,
    userInitials,
    isTokenExpired,

    // Actions
    login,
    logout,
    fetchProfile,
    initializeAuth,
    clearAuth,
  }
})
