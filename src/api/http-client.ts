import Axios, { type AxiosError, type AxiosInstance, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios'
import { getToken } from '@/features/auth/auth-store'
import { expireSession } from '@/features/auth/session-expired'
import { refreshSession } from './refresh-session'

export interface AuthInterceptorDeps {
  getToken: () => string | null
  refresh: () => Promise<string>
  onSessionExpired: () => void
}

// 401 nestas rotas não é token vencido: é senha errada (/auth) ou o próprio refresh recusado.
const NO_REFRESH_URLS = new Set(['/auth', '/refresh'])

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean }

export function installAuthInterceptors(instance: AxiosInstance, deps: AuthInterceptorDeps): void {
  instance.interceptors.request.use((config) => {
    const token = deps.getToken()
    if (token) config.headers.set('Authorization', `Bearer ${token}`)
    return config
  })

  instance.interceptors.response.use(undefined, async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined
    const canRefresh =
      error.response?.status === 401 && config !== undefined && !config._retried && !NO_REFRESH_URLS.has(config.url ?? '')
    if (!canRefresh) throw error

    config._retried = true
    try {
      await deps.refresh()
    } catch {
      deps.onSessionExpired()
      throw error
    }
    return instance(config)
  })
}

export const api = Axios.create({ baseURL: import.meta.env.VITE_API_URL, withCredentials: true })

installAuthInterceptors(api, { getToken, refresh: refreshSession, onSessionExpired: expireSession })

export const httpClient = <T>(config: AxiosRequestConfig, options?: AxiosRequestConfig): Promise<T> =>
  api({ ...config, ...options }).then(({ data }) => data as T)
