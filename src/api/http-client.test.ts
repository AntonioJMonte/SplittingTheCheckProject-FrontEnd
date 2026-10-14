import Axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { describe, expect, it, vi } from 'vitest'
import { installAuthInterceptors } from './http-client'

type Reply = { status: number; data?: unknown }

function setup(handler: (config: InternalAxiosRequestConfig) => Reply, refreshResult: () => Promise<string> = async () => 'novo') {
  const session = { token: 'velho' as string | null }
  const seen: InternalAxiosRequestConfig[] = []
  const instance = Axios.create({
    adapter: async (config) => {
      seen.push(config)
      const { status, data = {} } = handler(config)
      const response = { status, data, statusText: String(status), headers: {}, config }
      if (status >= 400) throw new AxiosError(`HTTP ${status}`, 'ERR_BAD_RESPONSE', config, undefined, response)
      return response
    },
  })
  const refresh = vi.fn(async () => {
    session.token = await refreshResult()
    return session.token
  })
  const onSessionExpired = vi.fn()
  installAuthInterceptors(instance, { getToken: () => session.token, refresh, onSessionExpired })
  return { instance, seen, refresh, onSessionExpired }
}

const authorization = (config: InternalAxiosRequestConfig) => config.headers.get('Authorization')

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

describe('installAuthInterceptors', () => {
  it('envia o token atual no Authorization', async () => {
    const { instance, seen } = setup(() => ({ status: 200 }))

    await instance.get('/groups')

    expect(authorization(seen[0])).toBe('Bearer velho')
  })

  it('num 401, renova a sessão uma vez e repete a requisição com o token novo', async () => {
    const { instance, seen, refresh } = setup((config) =>
      authorization(config) === 'Bearer velho' ? { status: 401 } : { status: 200, data: { ok: true } },
    )

    const response = await instance.get('/groups')

    expect(response.data).toEqual({ ok: true })
    expect(refresh).toHaveBeenCalledTimes(1)
    expect(seen).toHaveLength(2)
    expect(authorization(seen[1])).toBe('Bearer novo')
  })

  it.each(['/auth', '/refresh'])('não tenta renovar quando o 401 vem de %s', async (url) => {
    const { instance, refresh, onSessionExpired } = setup(() => ({ status: 401 }))

    await expect(instance.post(url, {})).rejects.toMatchObject({ response: { status: 401 } })
    expect(refresh).not.toHaveBeenCalled()
    expect(onSessionExpired).not.toHaveBeenCalled()
  })

  it('encerra a sessão quando o back recusa o refresh', async () => {
    const { instance, onSessionExpired } = setup(
      () => ({ status: 401 }),
      async () => {
        throw refreshFailure(401)
      },
    )

    await expect(instance.get('/groups')).rejects.toMatchObject({ response: { status: 401 } })
    expect(onSessionExpired).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['rede', () => new AxiosError('Network Error', 'ERR_NETWORK')],
    ['5xx', () => refreshFailure(503)],
    ['429', () => refreshFailure(429)],
  ])('mantém a sessão quando o refresh falha por %s', async (_, failure) => {
    const { instance, onSessionExpired } = setup(
      () => ({ status: 401 }),
      async () => {
        throw failure()
      },
    )

    await expect(instance.get('/groups')).rejects.toMatchObject({ response: { status: 401 } })
    expect(onSessionExpired).not.toHaveBeenCalled()
  })

  it('não entra em laço se a requisição repetida também volta 401', async () => {
    const { instance, seen, refresh } = setup(() => ({ status: 401 }))

    await expect(instance.get('/groups')).rejects.toMatchObject({ response: { status: 401 } })
    expect(refresh).toHaveBeenCalledTimes(1)
    expect(seen).toHaveLength(2)
  })

  it('repassa outros erros sem renovar', async () => {
    const { instance, refresh } = setup(() => ({ status: 403 }))

    await expect(instance.get('/groups/x')).rejects.toMatchObject({ response: { status: 403 } })
    expect(refresh).not.toHaveBeenCalled()
  })
})
