import { describe, expect, it } from 'vitest'
import { myShareAmount } from './expense-view'

describe('myShareAmount', () => {
  const shares = [
    { id: 's1', memberId: 'm-ana', amount: '33.34' },
    { id: 's2', memberId: 'm-bruno', amount: '33.33' },
  ]

  it('devolve a minha parte exatamente como veio da API', () => {
    expect(myShareAmount(shares, 'm-bruno')).toBe('33.33')
  })

  it('devolve null quando não participo', () => {
    expect(myShareAmount(shares, 'm-carla')).toBeNull()
    expect(myShareAmount(shares, undefined)).toBeNull()
  })
})
