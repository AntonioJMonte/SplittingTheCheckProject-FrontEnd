import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { describe, expect, it } from 'vitest'
import { NETWORK_ERROR_MESSAGE, RATE_LIMIT_MESSAGE, toApiError } from './api-error'

function httpError(status: number, data: unknown) {
  const config = { headers: {} } as InternalAxiosRequestConfig
  const response = { status, data, statusText: '', headers: {}, config } as AxiosResponse
  return new AxiosError('x', 'ERR_BAD_REQUEST', config, undefined, response)
}

describe('toApiError', () => {
  it('lê message e issues do formato D-90', () => {
    const error = httpError(400, { message: 'Dados inválidos.', issues: [{ path: 'name', message: 'Obrigatório' }] })

    expect(toApiError(error)).toEqual({ status: 400, message: 'Dados inválidos.', issues: [{ path: 'name', message: 'Obrigatório' }] })
  })

  it('usa a message da API em erros de regra, sem issues', () => {
    expect(toApiError(httpError(409, { message: 'Já existe um acerto pendente entre esses membros' }))).toEqual({
      status: 409,
      message: 'Já existe um acerto pendente entre esses membros',
      issues: [],
    })
  })

  it('troca 429 por um aviso de espera', () => {
    expect(toApiError(httpError(429, { message: 'Rate limit exceeded' })).message).toBe(RATE_LIMIT_MESSAGE)
  })

  it('trata 5xx e falta de resposta como falha de conexão', () => {
    expect(toApiError(httpError(500, { message: 'Internal server error.' }))).toMatchObject({ status: 500, message: NETWORK_ERROR_MESSAGE })
    expect(toApiError(new AxiosError('Network Error', 'ERR_NETWORK'))).toEqual({ status: null, message: NETWORK_ERROR_MESSAGE, issues: [] })
  })

  it('ignora issues fora do formato', () => {
    expect(toApiError(httpError(400, { message: 'x', issues: [{ campo: 'y' }] })).issues).toEqual([])
  })
})
