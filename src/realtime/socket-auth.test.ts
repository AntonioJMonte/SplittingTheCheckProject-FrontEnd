import { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import type { Socket } from 'socket.io-client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { installSocketAuthRecovery } from './socket-auth'

function refreshFailure(status: number) {
  const config = { headers: {} } as InternalAxiosRequestConfig
  return new AxiosError(`HTTP ${status}`, 'ERR_BAD_RESPONSE', config, undefined, {
    status,
    data: {},
    statusText: String(status),
    headers: {},
    config,
  })
}

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

  afterEach(() => {
    vi.useRealTimers()
  })

  it('encerra a sessão quando o back recusa a renovação', async () => {
    const { socket, onSessionExpired, fail } = setup(async () => {
      throw refreshFailure(401)
    })

    fail('TOKEN_EXPIRED')

    await vi.waitFor(() => expect(onSessionExpired).toHaveBeenCalledTimes(1))
    expect(socket.connect).not.toHaveBeenCalled()
  })

  it('mantém a sessão e tenta reconectar mais tarde quando a renovação falha por rede ou 5xx', async () => {
    vi.useFakeTimers()
    const { socket, onSessionExpired, fail } = setup(async () => {
      throw refreshFailure(503)
    })

    fail('TOKEN_EXPIRED')
    await vi.advanceTimersByTimeAsync(0)
    expect(socket.connect).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(3000)

    expect(socket.connect).toHaveBeenCalledTimes(1)
    expect(onSessionExpired).not.toHaveBeenCalled()
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
