import { render, screen } from '@testing-library/react'
import { AxiosError } from 'axios'
import { describe, expect, it, vi } from 'vitest'
import { BalancesCard } from './BalancesCard'

const queries = vi.hoisted(() => ({ balances: {} as Record<string, unknown>, pending: {} as Record<string, unknown> }))

vi.mock('@/api/generated/endpoints/groups/groups', () => ({
  useGetGroupsGroupIdBalances: () => queries.balances,
}))
vi.mock('@/api/generated/endpoints/settlements/settlements', () => ({
  useGetGroupsGroupIdSettlements: () => queries.pending,
}))

const networkError = () => new AxiosError('Network Error', 'ERR_NETWORK')
const failed = () => ({ isPending: false, isError: true, data: undefined, error: networkError(), refetch: vi.fn() })

describe('BalancesCard', () => {
  it('mostra o erro com nova tentativa também em Quem paga quem quando os saldos falham, em vez de carregar para sempre', () => {
    queries.balances = failed()
    queries.pending = { data: undefined }

    const { container } = render(<BalancesCard groupId="g1" members={[]} myMemberId={undefined} />)

    expect(screen.getAllByRole('button', { name: 'Tentar de novo' })).toHaveLength(2)
    expect(container.querySelector('[data-slot="skeleton"]')).toBeNull()
  })

  it('mostra o erro dos pendentes na seção Aguardando confirmação, em vez de sumir com ela', () => {
    queries.balances = {
      isPending: false,
      isError: false,
      data: { memberBalances: [], transfers: [{ fromMemberId: 'm-bruno', toMemberId: 'm-ana', amount: '50.00' }] },
      refetch: vi.fn(),
    }
    queries.pending = failed()

    render(
      <BalancesCard groupId="g1" members={[]} myMemberId="m-bruno" onPay={vi.fn()} onAcknowledge={vi.fn()} onViewPix={vi.fn()} />,
    )

    expect(screen.getByRole('heading', { name: 'Aguardando confirmação' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tentar de novo' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Pagar' })).not.toBeInTheDocument()
  })
})
