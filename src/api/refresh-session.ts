import Axios, { isAxiosError } from 'axios'
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

// Axios puro, fora do cliente com interceptors: um 401 aqui não pode disparar outro refresh. Sem corpo (`undefined`, não
// `null`): com `null` o XHR manda Content-Type x-www-form-urlencoded, que o Fastify do back recusa com 415.
export const requestRefreshToken = (): Promise<string> =>
  Axios.post<{ accessToken: string }>('/refresh', undefined, {
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true,
  }).then((response) => response.data.accessToken)

export const refreshSession = createRefreshSession(requestRefreshToken, setToken)

/** Só a recusa do back (401 no /refresh) encerra a sessão; rede, 5xx e 429 não provam que ela acabou. */
export const isSessionRejected = (error: unknown): boolean => isAxiosError(error) && error.response?.status === 401
