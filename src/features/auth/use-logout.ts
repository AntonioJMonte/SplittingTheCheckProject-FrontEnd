import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { useNavigate } from 'react-router'
import { usePostLogout } from '@/api/generated/endpoints/auth/auth'
import { socket } from '@/realtime/socket'
import { clearToken } from './auth-store'

export function useLogout(): () => Promise<void> {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { mutateAsync } = usePostLogout()

  return useCallback(async () => {
    try {
      await mutateAsync()
    } catch {
      // O logout do back é idempotente; a saída local acontece mesmo se ele falhar (spec 2.2).
    }
    clearToken()
    socket.disconnect()
    queryClient.clear()
    navigate('/login', { replace: true })
  }, [mutateAsync, queryClient, navigate])
}
