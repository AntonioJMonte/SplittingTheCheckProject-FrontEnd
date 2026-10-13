import { describe, expect, it, vi } from 'vitest'
import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { toast } from 'sonner'
import { fieldsNamed, reportFormError } from './form-errors'

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }))

type Values = { email: string; password: string }

function httpError(status: number, data: unknown) {
  const config = { headers: {} } as InternalAxiosRequestConfig
  return new AxiosError('x', 'ERR', config, undefined, { status, data, statusText: '', headers: {}, config } as AxiosResponse)
}

describe('reportFormError', () => {
  it('põe cada issue no campo correspondente e não devolve mensagem de topo', () => {
    const setError = vi.fn()
    const error = httpError(400, { message: 'Dados inválidos.', issues: [{ path: 'email', message: 'Email inválido' }] })

    expect(reportFormError<Values>(error, setError, fieldsNamed<Values>('email', 'password'))).toBeNull()
    expect(setError).toHaveBeenCalledWith('email', { type: 'server', message: 'Email inválido' })
  })

  it('devolve para o topo as issues sem campo no formulário', () => {
    const setError = vi.fn()
    const error = httpError(400, { message: 'Dados inválidos.', issues: [{ path: 'groupId', message: 'UUID inválido' }] })

    expect(reportFormError<Values>(error, setError, fieldsNamed<Values>('email'))).toBe('UUID inválido')
    expect(setError).not.toHaveBeenCalled()
  })

  it('devolve a message da API quando é erro de regra', () => {
    expect(reportFormError<Values>(httpError(401, { message: 'Email ou senha incorretos.' }), vi.fn(), fieldsNamed<Values>('email'))).toBe(
      'Email ou senha incorretos.',
    )
  })

  it('mostra toast e não devolve nada em falha de conexão', () => {
    expect(reportFormError<Values>(new AxiosError('Network Error', 'ERR_NETWORK'), vi.fn(), fieldsNamed<Values>('email'))).toBeNull()
    expect(toast.error).toHaveBeenCalledWith('Não foi possível falar com o servidor. Tente de novo.')
  })
})
