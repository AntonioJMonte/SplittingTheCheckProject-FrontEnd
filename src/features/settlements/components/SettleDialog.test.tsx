import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import type { GroupMember, Settlement } from '@/api/types'
import { SettleDialog } from './SettleDialog'

const registerPayment = vi.hoisted(() => ({ mutateAsync: vi.fn(), isPending: false }))
vi.mock('@/api/generated/endpoints/settlements/settlements', () => ({
  usePostGroupsGroupIdSettlements: () => registerPayment,
}))

const members = [
  { id: 'm-ana', userId: 'u-ana', name: 'Ana', email: 'ana@example.com', role: 'OWNER', joinedAt: '2026-10-01T00:00:00.000Z' },
  { id: 'm-bruno', userId: 'u-bruno', name: 'Bruno', email: 'bruno@example.com', role: 'MEMBER', joinedAt: '2026-10-01T00:00:00.000Z' },
] as GroupMember[]

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
)

function httpError(status: number, message: string) {
  const config = { headers: {} } as InternalAxiosRequestConfig
  const response = { status, data: { message }, statusText: '', headers: {}, config } as AxiosResponse
  return new AxiosError('x', 'ERR_BAD_REQUEST', config, undefined, response)
}

describe('SettleDialog', () => {
  it('depois de um 422 mostra a mensagem e não oferece reenviar o valor antigo', async () => {
    const user = userEvent.setup()
    registerPayment.mutateAsync.mockRejectedValueOnce(httpError(422, 'O valor excede a dívida.'))
    const transfer = { fromMemberId: 'm-bruno', toMemberId: 'm-ana', amount: '50.00' }
    render(<SettleDialog groupId="g1" target={{ mode: 'pay', transfer }} members={members} onClose={vi.fn()} />, { wrapper })

    await user.click(screen.getByRole('button', { name: 'Registrar pagamento' }))

    expect(await screen.findByText('O valor excede a dívida.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Registrar pagamento' })).not.toBeInTheDocument()
  })

  it('sem chave Pix do credor, não fala em pagar com Pix', () => {
    const settlement = {
      id: 's1',
      fromMemberId: 'm-bruno',
      toMemberId: 'm-ana',
      amount: '50.00',
      status: 'PENDING',
      pixCopyPaste: null,
      createdAt: '2026-10-13T00:00:00.000Z',
    } as Settlement
    render(<SettleDialog groupId="g1" target={{ mode: 'view', settlement }} members={members} onClose={vi.fn()} />, { wrapper })

    expect(screen.getByRole('heading', { name: 'Pagamento registrado' })).toBeInTheDocument()
    expect(screen.queryByText(/Pague com Pix/)).not.toBeInTheDocument()
  })
})
