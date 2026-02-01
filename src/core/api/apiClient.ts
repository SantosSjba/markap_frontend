import axios, { type AxiosInstance, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@modules/auth/stores/auth.store'

/**
 * API Client - Centralized HTTP client configuration
 * 
 * Features:
 * - Automatic token injection
 * - Request/Response interceptors
 * - Error handling
 * - Base URL configuration
 */

const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const authStore = useAuthStore()
    const token = authStore.accessToken

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - Handle errors globally
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config

    // Handle 401 Unauthorized - Token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      const authStore = useAuthStore()
      
      // Try to refresh token
      const refreshed = await authStore.refreshToken()
      
      if (refreshed) {
        // Retry original request with new token
        return apiClient(originalRequest)
      } else {
        // Redirect to login
        authStore.logout()
        window.location.href = '/auth/login'
      }
    }

    return Promise.reject(error)
  }
)

export { apiClient }
export default apiClient
