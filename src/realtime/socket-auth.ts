import type { Socket } from 'socket.io-client'

interface SocketAuthDeps {
  refresh: () => Promise<string>
  onSessionExpired: () => void
}

/**
 * Recusa no middleware do back não reconecta sozinha. Com TOKEN_EXPIRED, renovamos e reconectamos (a função `auth` do
 * socket relê o token). Com UNAUTHORIZED, a sessão acabou (D-101).
 */
export function installSocketAuthRecovery(socket: Pick<Socket, 'on' | 'connect'>, deps: SocketAuthDeps): void {
  socket.on('connect_error', (error: Error) => {
    if (error.message === 'TOKEN_EXPIRED') {
      deps.refresh().then(
        () => socket.connect(),
        () => deps.onSessionExpired(),
      )
      return
    }
    if (error.message === 'UNAUTHORIZED') deps.onSessionExpired()
  })
}
