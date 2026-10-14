import type { Socket } from 'socket.io-client'
import { isSessionRejected } from '@/api/refresh-session'

interface SocketAuthDeps {
  refresh: () => Promise<string>
  onSessionExpired: () => void
}

const RETRY_AFTER_MS = 3000

/**
 * Recusa no middleware do back não reconecta sozinha. Com TOKEN_EXPIRED, renovamos e reconectamos (a função `auth` do
 * socket relê o token). Só a recusa da renovação (401) ou UNAUTHORIZED encerram a sessão (D-101); rede, 5xx e 429
 * deixam a sessão como está e reconectam mais tarde.
 */
export function installSocketAuthRecovery(socket: Pick<Socket, 'on' | 'connect'>, deps: SocketAuthDeps): void {
  socket.on('connect_error', (error: Error) => {
    if (error.message === 'TOKEN_EXPIRED') {
      deps.refresh().then(
        () => socket.connect(),
        (refreshError: unknown) => {
          if (isSessionRejected(refreshError)) deps.onSessionExpired()
          else setTimeout(() => socket.connect(), RETRY_AFTER_MS)
        },
      )
      return
    }
    if (error.message === 'UNAUTHORIZED') deps.onSessionExpired()
  })
}
