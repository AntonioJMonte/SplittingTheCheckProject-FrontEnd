import Axios, { type InternalAxiosRequestConfig } from 'axios'
import { describe, expect, it, vi } from 'vitest'
import { createRefreshSession, requestRefreshToken } from './refresh-session'

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

describe('createRefreshSession', () => {
  it('faz um único POST /refresh para chamadas simultâneas e entrega o mesmo token a todas', async () => {
    const pending = deferred<string>()
    const requestToken = vi.fn(() => pending.promise)
    const storeToken = vi.fn()
    const refresh = createRefreshSession(requestToken, storeToken)

    const calls = [refresh(), refresh(), refresh()]
    pending.resolve('novo-token')

    await expect(Promise.all(calls)).resolves.toEqual(['novo-token', 'novo-token', 'novo-token'])
    expect(requestToken).toHaveBeenCalledTimes(1)
    expect(storeToken).toHaveBeenCalledExactlyOnceWith('novo-token')
  })

  it('pede um token novo na expiração seguinte, depois que a anterior terminou', async () => {
    const requestToken = vi.fn().mockResolvedValueOnce('t1').mockResolvedValueOnce('t2')
    const refresh = createRefreshSession(requestToken, vi.fn())

    await refresh()

    await expect(refresh()).resolves.toBe('t2')
    expect(requestToken).toHaveBeenCalledTimes(2)
  })

  it('rejeita todas as chamadas quando o refresh falha, sem gravar token, e tenta de novo na próxima', async () => {
    const requestToken = vi.fn().mockRejectedValueOnce(new Error('401')).mockResolvedValueOnce('t2')
    const storeToken = vi.fn()
    const refresh = createRefreshSession(requestToken, storeToken)

    await expect(Promise.all([refresh(), refresh()])).rejects.toThrow('401')
    expect(storeToken).not.toHaveBeenCalled()
    await expect(refresh()).resolves.toBe('t2')
  })
})

describe('requestRefreshToken', () => {
  it('pede o token novo sem corpo, para o XHR não mandar o Content-Type que o back recusa com 415', async () => {
    const seen: InternalAxiosRequestConfig[] = []
    const original = Axios.defaults.adapter
    Axios.defaults.adapter = async (config) => {
      seen.push(config)
      return { data: { accessToken: 'novo' }, status: 200, statusText: 'OK', headers: {}, config }
    }
    try {
      await expect(requestRefreshToken()).resolves.toBe('novo')
    } finally {
      Axios.defaults.adapter = original
    }

    expect(seen[0]).toMatchObject({ url: '/refresh', method: 'post', withCredentials: true })
    // Com `null`, o adaptador XHR mantém Content-Type x-www-form-urlencoded e o Fastify responde 415.
    expect(seen[0].data).toBeUndefined()
  })
})
