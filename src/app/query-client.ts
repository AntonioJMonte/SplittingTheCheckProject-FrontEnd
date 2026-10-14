import { QueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'

// 4xx não muda tentando de novo (403, 404, 409); só rede e 5xx ganham novas tentativas.
function shouldRetry(failureCount: number, error: unknown): boolean {
  const status = isAxiosError(error) ? error.response?.status : undefined
  if (status !== undefined && status < 500) return false
  return failureCount < 2
}

export const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: shouldRetry } },
})
