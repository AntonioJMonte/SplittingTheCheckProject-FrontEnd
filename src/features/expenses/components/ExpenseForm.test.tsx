import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

  it('tira os erros das partes quando a divisão muda e os campos somem', async () => {
    const user = userEvent.setup()
    render(<ExpenseForm groupId="g1" members={[member('ana', 'Ana'), member('bruno', 'Bruno')]} myUserId="u-ana" onDone={vi.fn()} />, {
      wrapper,
    })
    await user.type(screen.getByRole('textbox', { name: 'Descrição' }), 'Jantar')
    await user.type(screen.getByRole('textbox', { name: 'Valor' }), '100,00')
    await user.click(screen.getByRole('radio', { name: 'Valores' }))
    await user.click(screen.getByRole('button', { name: 'Adicionar despesa' }))
    expect(await screen.findAllByText('Informe a parte desta pessoa, maior que zero.')).toHaveLength(2)

    await user.click(screen.getByRole('radio', { name: 'Igual' }))

    expect(screen.queryAllByText('Informe a parte desta pessoa, maior que zero.')).toHaveLength(0)
  })

  it('não mostra prévia de divisão para valor zero', async () => {
    const user = userEvent.setup()
    render(<ExpenseForm groupId="g1" members={[member('ana', 'Ana'), member('bruno', 'Bruno')]} myUserId="u-ana" onDone={vi.fn()} />, {
      wrapper,
    })

    await user.type(screen.getByRole('textbox', { name: 'Valor' }), '0,00')

    expect(screen.queryByText(/cada$/)).not.toBeInTheDocument()
  })
})
