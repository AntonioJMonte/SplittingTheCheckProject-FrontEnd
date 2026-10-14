import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useChangedKeys } from './use-changed-keys'

type Entries = Array<readonly [string, string]> | undefined

function setup(initial: Entries) {
  return renderHook(({ entries }: { entries: Entries }) => useChangedKeys(entries), { initialProps: { entries: initial } })
}

describe('useChangedKeys', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('não destaca nada na primeira carga', () => {
    const hook = setup(undefined)

    hook.rerender({ entries: [['ana', '50.00']] })

    expect(hook.result.current.size).toBe(0)
  })

  it('destaca a chave cujo valor mudou e apaga depois de 1,2 s', () => {
    const hook = setup([['ana', '0.00'], ['bruno', '0.00']])

    hook.rerender({ entries: [['ana', '50.00'], ['bruno', '0.00']] })
    expect([...hook.result.current]).toEqual(['ana'])

    act(() => {
      vi.advanceTimersByTime(1200)
    })
    expect(hook.result.current.size).toBe(0)
  })

  it('destaca uma linha nova numa lista que já tinha carregado, mesmo vazia', () => {
    const hook = setup([])

    hook.rerender({ entries: [['bruno->ana', '50.00']] })

    expect([...hook.result.current]).toEqual(['bruno->ana'])
  })

  it('não destaca quando só a referência do array muda', () => {
    const hook = setup([['ana', '50.00']])

    hook.rerender({ entries: [['ana', '50.00']] })

    expect(hook.result.current.size).toBe(0)
  })

  it('limpa o destaque quando uma linha apenas some', () => {
    const hook = setup([['a', '1'], ['b', '2']])
    hook.rerender({ entries: [['a', '2'], ['b', '2']] })

    hook.rerender({ entries: [['a', '2']] })

    expect(hook.result.current.size).toBe(0)
  })
})
