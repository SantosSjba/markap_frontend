import { envConfig } from '../../config/env.config'
import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'
export interface HttpSession {
  getAccessToken: () => string | null
  onUnauthorized: () => void
}
let session: HttpSession | undefined
/** La composición de la app aporta la sesión; el transporte no importa stores ni módulos. */
export function configureHttpSession(value: HttpSession): () => void {
  session = value
  return () => {
    if (session === value) session = undefined
  }
}
export const apiClient: AxiosInstance = axios.create({
  baseURL: envConfig.apiBaseUrl,
  timeout: envConfig.apiTimeout,
  headers: { 'Content-Type': 'application/json' },
})
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = session?.getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const config = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined
      if (!config?._retry) {
        if (config) config._retry = true
        session?.onUnauthorized()
      }
    }
    return Promise.reject(error)
  },
)
export default apiClient
