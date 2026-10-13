import Axios from 'axios'
import { setToken } from '@/features/auth/auth-store'

export type RefreshSession = () => Promise<string>

// Quando o access token vence, várias requisições recebem 401 juntas; todas esperam o mesmo POST /refresh (D-101).
export function createRefreshSession(
  requestToken: () => Promise<string>,
  storeToken: (token: string) => void,
): RefreshSession {
  let inFlight: Promise<string> | null = null

  return () => {
    inFlight ??= requestToken()
      .then((token) => {
        storeToken(token)
        return token
      })
      .finally(() => {
        inFlight = null
      })
    return inFlight
  }
}

// Axios puro, fora do cliente com interceptors: um 401 aqui não pode disparar outro refresh.
export const refreshSession = createRefreshSession(
  () =>
    Axios.post<{ accessToken: string }>('/refresh', null, {
      baseURL: import.meta.env.VITE_API_URL,
      withCredentials: true,
    }).then((response) => response.data.accessToken),
  setToken,
)
