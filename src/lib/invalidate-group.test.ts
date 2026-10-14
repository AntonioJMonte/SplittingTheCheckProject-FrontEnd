import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import { invalidateGroupQueries, isGroupQueryKey } from './invalidate-group'

describe('isGroupQueryKey', () => {
  it('reconhece todas as queries do grupo', () => {
    for (const key of ['/groups/g1', '/groups/g1/balances', '/groups/g1/expenses']) {
      expect(isGroupQueryKey([key], 'g1')).toBe(true)
    }
  })

  it('ignora outros grupos, um id que começa igual e a lista de grupos', () => {
    for (const key of ['/groups', '/groups/g2/balances', '/groups/g10/balances', '/users/me']) {
      expect(isGroupQueryKey([key], 'g1')).toBe(false)
    }
  })
})

describe('invalidateGroupQueries', () => {
  it('marca como desatualizadas só as queries do grupo', async () => {
    const queryClient = new QueryClient()
    queryClient.setQueryData(['/groups/g1/balances'], {})
    queryClient.setQueryData(['/groups/g2/balances'], {})

    await invalidateGroupQueries(queryClient, 'g1')

    expect(queryClient.getQueryState(['/groups/g1/balances'])?.isInvalidated).toBe(true)
    expect(queryClient.getQueryState(['/groups/g2/balances'])?.isInvalidated).toBe(false)
  })
})
