import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { invalidateGroupQueries } from '@/lib/invalidate-group'
import { socket } from './socket'

// `settlement_computed` fica de fora: o back emite em todo GET de /settlements/compute, e escutar criaria um ciclo de
// refetch entre as abas (spec 2.4).
export const GROUP_EVENTS = [
  'expense_created',
  'expense_updated',
  'expense_deleted',
  'expense_categorized',
  'balances_updated',
  'member_added',
  'member_removed',
  'settlement_confirmed',
] as const

// Cada mutação no back emite dois eventos (ex.: expense_created e balances_updated). Juntá-los numa janela curta evita
// refazer os GETs do grupo duas vezes, o que somado entre as abas estourava o rate limit do back.
const INVALIDATE_WINDOW_MS = 100

/** O socket só avisa; quem traz os dados é o REST (spec 2.4). */
export function useGroupRealtime(groupId: string): void {
  const queryClient = useQueryClient()

  useEffect(() => {
    let pending: ReturnType<typeof setTimeout> | undefined
    const scheduleInvalidation = () => {
      clearTimeout(pending)
      pending = setTimeout(() => void invalidateGroupQueries(queryClient, groupId), INVALIDATE_WINDOW_MS)
    }
    const join = () => {
      socket.emit('join_group', groupId)
    }
    // Reconexão perde as salas e pode ter perdido eventos: entra de novo e busca tudo.
    const onConnect = () => {
      join()
      scheduleInvalidation()
    }
    const onGroupEvent = (payload?: { groupId?: string }) => {
      if (payload?.groupId !== groupId) return
      scheduleInvalidation()
    }

    socket.on('connect', onConnect)
    GROUP_EVENTS.forEach((event) => socket.on(event, onGroupEvent))
    if (socket.connected) join()
    else if (!socket.active) socket.connect()

    return () => {
      clearTimeout(pending)
      socket.off('connect', onConnect)
      GROUP_EVENTS.forEach((event) => socket.off(event, onGroupEvent))
    }
  }, [groupId, queryClient])
}
