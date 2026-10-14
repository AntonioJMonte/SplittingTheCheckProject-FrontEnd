import { describe, expect, it } from 'vitest'
import type { ExpenseFormValues } from './schemas'
import { fieldForIssuePath, toCreateExpenseBody } from './to-create-expense-body'

const base: ExpenseFormValues = {
  description: 'Mercado',
  amount: '1.234,56',
  payerId: 'u-ana',
  occurredAt: '2026-10-13',
  category: 'auto',
  splitMethod: 'EQUAL',
  participants: [
    { memberId: 'm-ana', selected: true, amount: '', percentage: '' },
    { memberId: 'm-bruno', selected: false, amount: '', percentage: '' },
    { memberId: 'm-carla', selected: true, amount: '', percentage: '' },
  ],
}

describe('toCreateExpenseBody', () => {
  it('em Igual, envia só os participantes, o valor em string e o meio-dia local, sem categoria automática', () => {
    const { body, shareMemberIds } = toCreateExpenseBody(base)

    expect(body).toEqual({
      description: 'Mercado',
      amount: '1234.56',
      payerId: 'u-ana',
      occurredAt: '2026-10-13T15:00:00.000Z',
      splitMethod: 'EQUAL',
      shares: [{ memberId: 'm-ana' }, { memberId: 'm-carla' }],
    })
    expect(shareMemberIds).toEqual(['m-ana', 'm-carla'])
  })

  it('em Valores, envia cada parte como string da API', () => {
    const participants = base.participants.map((p) => ({ ...p, amount: p.memberId === 'm-ana' ? '1.000,00' : '234,56' }))

    const { body } = toCreateExpenseBody({ ...base, splitMethod: 'FIXED', participants })

    expect(body.shares).toEqual([
      { memberId: 'm-ana', amount: '1000.00' },
      { memberId: 'm-carla', amount: '234.56' },
    ])
  })

  it('em Percentual, envia o percentual como number, porque não é dinheiro', () => {
    const participants = base.participants.map((p) => ({ ...p, percentage: p.memberId === 'm-ana' ? '66,67' : '33,33' }))

    const { body } = toCreateExpenseBody({ ...base, splitMethod: 'PERCENTAGE', participants })

    expect(body.shares).toEqual([
      { memberId: 'm-ana', percentage: 66.67 },
      { memberId: 'm-carla', percentage: 33.33 },
    ])
  })

  it('envia a categoria escolhida', () => {
    expect(toCreateExpenseBody({ ...base, category: 'Compras' }).body.category).toBe('Compras')
  })
})

describe('fieldForIssuePath', () => {
  const shareMemberIds = ['m-ana', 'm-carla']
  const participantMemberIds = ['m-ana', 'm-bruno', 'm-carla']

  it('leva o erro da parte à linha da pessoa certa, não à posição do array enviado', () => {
    expect(fieldForIssuePath('shares.1.amount', shareMemberIds, participantMemberIds)).toBe('participants.2.amount')
    expect(fieldForIssuePath('shares.0.percentage', shareMemberIds, participantMemberIds)).toBe('participants.0.percentage')
  })

  it('mantém os campos de topo', () => {
    expect(fieldForIssuePath('amount', shareMemberIds, participantMemberIds)).toBe('amount')
  })

  it('devolve null para o que não tem campo', () => {
    expect(fieldForIssuePath('shares.5.amount', shareMemberIds, participantMemberIds)).toBeNull()
    expect(fieldForIssuePath('shares', shareMemberIds, participantMemberIds)).toBeNull()
    expect(fieldForIssuePath('groupId', shareMemberIds, participantMemberIds)).toBeNull()
  })
})
