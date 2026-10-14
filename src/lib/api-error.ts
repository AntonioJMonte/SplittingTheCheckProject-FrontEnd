import { isAxiosError } from 'axios'

export interface ApiIssue {
  path: string
  message: string
}

export interface ApiError {
  status: number | null
  message: string
  issues: ApiIssue[]
}

export const NETWORK_ERROR_MESSAGE = 'Não foi possível falar com o servidor. Tente de novo.'
export const RATE_LIMIT_MESSAGE = 'Muitas tentativas. Aguarde um minuto e tente de novo.'
const FALLBACK_MESSAGE = 'Algo deu errado. Tente de novo.'

const isIssue = (value: unknown): value is ApiIssue =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as ApiIssue).path === 'string' &&
  typeof (value as ApiIssue).message === 'string'

export function toApiError(error: unknown): ApiError {
  if (!isAxiosError(error) || !error.response) return { status: null, message: NETWORK_ERROR_MESSAGE, issues: [] }

  const { status, data } = error.response
  if (status === 429) return { status, message: RATE_LIMIT_MESSAGE, issues: [] }
  if (status >= 500) return { status, message: NETWORK_ERROR_MESSAGE, issues: [] }

  const body = (typeof data === 'object' && data !== null ? data : {}) as { message?: unknown; issues?: unknown }
  return {
    status,
    message: typeof body.message === 'string' ? body.message : FALLBACK_MESSAGE,
    issues: Array.isArray(body.issues) ? body.issues.filter(isIssue) : [],
  }
}
