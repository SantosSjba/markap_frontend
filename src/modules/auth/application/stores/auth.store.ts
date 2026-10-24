import { defineStore } from 'pinia'
import { queryClient } from '@core/plugins/vue-query'
import { ref, computed } from 'vue'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'
import { authApiRepository } from '../../infrastructure/repositories/auth.api.repository'
import type { User, LoginCredentials } from '../../domain/auth.types'

const TOKEN_KEY = 'markap_token'
const USER_KEY = 'markap_user'
const EXPIRES_KEY = 'markap_expires'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const accessToken = ref<string | null>(null)
  const expiresIn = ref<number | null>(null)
  const isLoading = ref(false)

  const isAuthenticated = computed(() => !!accessToken.value && !!user.value)

  const userFullName = computed(() => {
    if (!user.value) return ''
    return user.value.fullName || `${user.value.firstName} ${user.value.lastName}`
  })

  const userInitials = computed(() => {
    if (!user.value) return ''
    return `${user.value.firstName.charAt(0)}${user.value.lastName.charAt(0)}`.toUpperCase()
  })

  const isAdmin = computed(() => {
    const roles = user.value?.roles ?? []
    return roles.some((r) => r.code === 'ADMIN')
  })

  const setAuth = (userData: User, token: string, expires: number) => {
    queryClient.clear()
    user.value = userData
    accessToken.value = token
    expiresIn.value = expires

    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(userData))
    localStorage.setItem(EXPIRES_KEY, expires.toString())
  }

  const clearAuth = () => {
    queryClient.clear()
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
      const response = await authApiRepository.login(credentials)
      setAuth(response.user, response.accessToken, response.expiresIn)
      return { success: true }
    } catch (error: unknown) {
      console.error('Login failed:', error)

      const status = (error as { response?: { status?: number } })?.response?.status
      const errorMessage =
        status === 401
          ? 'Credenciales inválidas'
          : getApiErrorMessage(error, 'No se pudo iniciar sesión')

      return { success: false, error: errorMessage }
    } finally {
      isLoading.value = false
    }
  }

  const logout = () => {
    authApiRepository.logout()
    clearAuth()
  }

  const fetchProfile = async (): Promise<boolean> => {
    try {
      const userData = await authApiRepository.getProfile()
      user.value = userData
      localStorage.setItem(USER_KEY, JSON.stringify(userData))
      return true
    } catch (error) {
      console.error('Failed to fetch profile:', error)
      return false
    }
  }

  const updateCurrentUser = (updates: Partial<User>) => {
    if (!user.value) return

    user.value = {
      ...user.value,
      ...updates,
      fullName: `${updates.firstName ?? user.value.firstName} ${updates.lastName ?? user.value.lastName}`,
    }
    localStorage.setItem(USER_KEY, JSON.stringify(user.value))
  }

  const initializeAuth = async () => {
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
        if (!(await fetchProfile())) clearAuth()
      } catch {
        clearAuth()
      }
    }
  }

  const isTokenExpired = computed(() => false)

  return {
    user,
    accessToken,
    expiresIn,
    isLoading,
    isAuthenticated,
    userFullName,
    userInitials,
    isAdmin,
    isTokenExpired,
    login,
    logout,
    fetchProfile,
    initializeAuth,
    clearAuth,
    updateCurrentUser,
  }
})
