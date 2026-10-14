import { describe, expect, it } from 'vitest'
import type { Settlement } from '@/api/types'
import { pendingAction } from './settlement-view'

const settlement = (pixCopyPaste: string | null): Settlement =>
  ({
    id: 's1',
    fromMemberId: 'm-bruno',
    toMemberId: 'm-ana',
    amount: '50.00',
    status: 'PENDING',
    pixCopyPaste,
    createdAt: '2026-10-13T00:00:00.000Z',
  }) as Settlement

describe('pendingAction', () => {
  it('o credor confirma o recebimento', () => {
    expect(pendingAction(settlement('000201'), 'm-ana')).toBe('acknowledge')
  })

  it('o devedor revê o Pix quando existe código', () => {
    expect(pendingAction(settlement('000201'), 'm-bruno')).toBe('view-pix')
    expect(pendingAction(settlement(null), 'm-bruno')).toBe('none')
  })

  it('quem está de fora só lê', () => {
    expect(pendingAction(settlement('000201'), 'm-carla')).toBe('none')
  })
})
