import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import type { GroupMember } from '@/api/types'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { ExpenseForm } from './ExpenseForm'

vi.mock('@/api/generated/endpoints/expenses/expenses', () => ({
  usePostGroupsGroupIdExpenses: () => ({ mutateAsync: vi.fn() }),
}))

const member = (id: string, name: string): GroupMember =>
  ({ id: `m-${id}`, userId: `u-${id}`, name, email: `${id}@example.com`, role: 'MEMBER', joinedAt: '2026-10-01T00:00:00.000Z' }) as GroupMember

const queryClient = new QueryClient()
const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <Dialog open>
      <DialogContent>
        <DialogTitle>Nova despesa</DialogTitle>
        {children}
      </DialogContent>
    </Dialog>
  </QueryClientProvider>
)

describe('ExpenseForm', () => {
  it('mantém cada pessoa ligada à sua linha quando a lista de membros muda com o diálogo aberto', () => {
    const ana = member('ana', 'Ana')
    const bruno = member('bruno', 'Bruno')
    const view = render(<ExpenseForm groupId="g1" members={[ana, bruno]} myUserId="u-ana" onDone={vi.fn()} />, { wrapper })

    // Um member_removed chega pelo tempo real e a lista perde a Ana.
    view.rerender(<ExpenseForm groupId="g1" members={[bruno]} myUserId="u-ana" onDone={vi.fn()} />)

    expect(screen.getByRole('checkbox', { name: 'Bruno' })).toHaveAttribute('name', 'participants.1.selected')
  })
})
