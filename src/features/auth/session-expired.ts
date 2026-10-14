import { clearToken } from './auth-store'

// Recarrega a página de propósito: some com o cache do TanStack Query e com o socket da sessão vencida.
export function expireSession(): void {
  clearToken()
  window.location.assign('/login')
}
