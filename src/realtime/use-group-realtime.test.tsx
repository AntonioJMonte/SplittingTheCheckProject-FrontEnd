import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useGroupRealtime } from './use-group-realtime'

const fake = vi.hoisted(() => {
  const handlers = new Map<string, Set<(payload?: unknown) => void>>()
  return {
    handlers,
    socket: {
      connected: false,
      active: false,
      connect: vi.fn(),
      disconnect: vi.fn(),
      emit: vi.fn(),
      on: vi.fn((event: string, handler: (payload?: unknown) => void) => {
        if (!handlers.has(event)) handlers.set(event, new Set())
        handlers.get(event)!.add(handler)
      }),
      off: vi.fn((event: string, handler: (payload?: unknown) => void) => {
        handlers.get(event)?.delete(handler)
      }),
    },
    fire(event: string, payload?: unknown) {
      handlers.get(event)?.forEach((handler) => handler(payload))
    },
  }
})

vi.mock('./socket', () => ({ socket: fake.socket }))

const G1_BALANCES = ['/groups/g1/balances']
const G2_BALANCES = ['/groups/g2/balances']

function setup(groupId = 'g1') {
  const queryClient = new QueryClient()
  queryClient.setQueryData(G1_BALANCES, { memberBalances: [] })
  queryClient.setQueryData(G2_BALANCES, { memberBalances: [] })
  const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  const hook = renderHook(({ id }: { id: string }) => useGroupRealtime(id), { wrapper, initialProps: { id: groupId } })
  const invalidated = (key: string[]) => queryClient.getQueryState(key)?.isInvalidated
  return { hook, queryClient, invalidated, invalidate }
}

// As invalidações esperam uma janela curta para juntar os eventos de uma mesma mutação.
const flush = () =>
  act(() => {
    vi.advanceTimersByTime(100)
  })

describe('useGroupRealtime', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    fake.handlers.clear()
    fake.socket.connected = false
    fake.socket.active = false
    vi.clearAllMocks()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('entra na sala na hora quando o socket já está conectado', () => {
    fake.socket.connected = true
    fake.socket.active = true

    setup()

    expect(fake.socket.emit).toHaveBeenCalledWith('join_group', 'g1')
    expect(fake.socket.connect).not.toHaveBeenCalled()
  })

  it('conecta quando está desconectado e entra na sala no connect, buscando tudo de novo', () => {
    const { invalidated } = setup()
    expect(fake.socket.connect).toHaveBeenCalledTimes(1)
    expect(fake.socket.emit).not.toHaveBeenCalled()

    fake.fire('connect')
    flush()

    expect(fake.socket.emit).toHaveBeenCalledWith('join_group', 'g1')
    expect(invalidated(G1_BALANCES)).toBe(true)
  })

  it('não pede outra conexão enquanto uma já está em andamento', () => {
    fake.socket.active = true

    setup()

    expect(fake.socket.connect).not.toHaveBeenCalled()
  })

  it('reentra na sala e busca tudo de novo a cada reconexão', () => {
    const { invalidate } = setup()

    fake.fire('connect')
    flush()
    fake.fire('connect')
    flush()

    expect(fake.socket.emit).toHaveBeenCalledTimes(2)
    expect(invalidate).toHaveBeenCalledTimes(2)
  })

  it('invalida só as queries do grupo ao receber um evento dele', () => {
    const { invalidated } = setup()

    fake.fire('expense_created', { groupId: 'g1' })
    flush()

    expect(invalidated(G1_BALANCES)).toBe(true)
    expect(invalidated(G2_BALANCES)).toBe(false)
  })

  it('junta os eventos de uma mesma mutação numa única invalidação', () => {
    const { invalidate } = setup()

    fake.fire('expense_created', { groupId: 'g1' })
    fake.fire('balances_updated', { groupId: 'g1' })
    flush()

    expect(invalidate).toHaveBeenCalledTimes(1)
  })

  it('ignora evento de outro grupo', () => {
    const { invalidated } = setup()

    fake.fire('balances_updated', { groupId: 'g2' })
    flush()

    expect(invalidated(G1_BALANCES)).toBe(false)
  })

  it('nunca escuta settlement_computed', () => {
    setup()

    expect(fake.handlers.has('settlement_computed')).toBe(false)
  })

  it('nunca grava o payload do evento no cache', () => {
    const { queryClient } = setup()
    const before = queryClient.getQueryData(G1_BALANCES)

    fake.fire('balances_updated', { groupId: 'g1', memberBalances: [{ memberId: 'x', balance: '999.00' }] })
    flush()

    expect(queryClient.getQueryData(G1_BALANCES)).toBe(before)
  })

  it('remove os mesmos listeners ao desmontar, sem evento de saída e sem desconectar', () => {
    const { hook } = setup()

    hook.unmount()

    for (const handlers of fake.handlers.values()) expect(handlers.size).toBe(0)
    expect(fake.socket.emit).not.toHaveBeenCalled()
    expect(fake.socket.disconnect).not.toHaveBeenCalled()
  })

  it('não invalida depois de desmontar', () => {
    const { hook, invalidate } = setup()

    fake.fire('expense_created', { groupId: 'g1' })
    hook.unmount()
    flush()

    expect(invalidate).not.toHaveBeenCalled()
  })

  it('troca de sala quando o grupo muda', () => {
    fake.socket.connected = true
    fake.socket.active = true
    const { hook } = setup('g1')

    hook.rerender({ id: 'g2' })

    expect(fake.socket.emit).toHaveBeenLastCalledWith('join_group', 'g2')
    expect([...fake.handlers.get('expense_created')!]).toHaveLength(1)
  })
})
