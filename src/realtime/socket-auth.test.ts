import type { Socket } from 'socket.io-client'
import { describe, expect, it, vi } from 'vitest'
import { installSocketAuthRecovery } from './socket-auth'

function setup(refresh: () => Promise<string>) {
  const handlers = new Map<string, (error: Error) => void>()
  const socket = {
    on: vi.fn((event: string, handler: (error: Error) => void) => handlers.set(event, handler)),
    connect: vi.fn(),
  }
  const onSessionExpired = vi.fn()
  installSocketAuthRecovery(socket as unknown as Pick<Socket, 'on' | 'connect'>, { refresh, onSessionExpired })
  const fail = (message: string) => handlers.get('connect_error')?.(new Error(message))
  return { socket, onSessionExpired, fail }
}

describe('installSocketAuthRecovery', () => {
  it('renova a sessão e reconecta quando o back recusa por TOKEN_EXPIRED', async () => {
    const { socket, onSessionExpired, fail } = setup(async () => 'novo')

    fail('TOKEN_EXPIRED')

    await vi.waitFor(() => expect(socket.connect).toHaveBeenCalledTimes(1))
    expect(onSessionExpired).not.toHaveBeenCalled()
  })

  it('encerra a sessão se a renovação falhar', async () => {
    const { socket, onSessionExpired, fail } = setup(async () => {
      throw new Error('refresh recusado')
    })

    fail('TOKEN_EXPIRED')

    await vi.waitFor(() => expect(onSessionExpired).toHaveBeenCalledTimes(1))
    expect(socket.connect).not.toHaveBeenCalled()
  })

  it('encerra a sessão quando o token é inválido', () => {
    const refresh = vi.fn(async () => 'novo')
    const { onSessionExpired, fail } = setup(refresh)

    fail('UNAUTHORIZED')

    expect(onSessionExpired).toHaveBeenCalledTimes(1)
    expect(refresh).not.toHaveBeenCalled()
  })

  it('deixa o socket.io tentar de novo sozinho em falha de rede', () => {
    const refresh = vi.fn(async () => 'novo')
    const { socket, onSessionExpired, fail } = setup(refresh)

    fail('xhr poll error')

    expect(refresh).not.toHaveBeenCalled()
    expect(onSessionExpired).not.toHaveBeenCalled()
    expect(socket.connect).not.toHaveBeenCalled()
  })
})
