import { render, screen } from '@testing-library/react'
import { AxiosError } from 'axios'
import { describe, expect, it, vi } from 'vitest'
import { BalancesCard } from './BalancesCard'

vi.mock('@/api/generated/endpoints/groups/groups', () => ({
  useGetGroupsGroupIdBalances: () => ({
    isPending: false,
    isError: true,
    data: undefined,
    error: new AxiosError('Network Error', 'ERR_NETWORK'),
    refetch: vi.fn(),
  }),
}))
vi.mock('@/api/generated/endpoints/settlements/settlements', () => ({
  useGetGroupsGroupIdSettlements: () => ({ data: undefined }),
}))

describe('BalancesCard', () => {
  it('mostra o erro com nova tentativa também em Quem paga quem quando os saldos falham, em vez de carregar para sempre', () => {
    const { container } = render(<BalancesCard groupId="g1" members={[]} myMemberId={undefined} />)

    expect(screen.getAllByRole('button', { name: 'Tentar de novo' })).toHaveLength(2)
    expect(container.querySelector('[data-slot="skeleton"]')).toBeNull()
  })
})
