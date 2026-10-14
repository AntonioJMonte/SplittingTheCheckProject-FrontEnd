import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { AddMemberForm } from './AddMemberForm'

vi.mock('@/api/generated/endpoints/groups/groups', () => ({
  usePostGroupsGroupIdMembers: () => ({ mutateAsync: vi.fn() }),
}))

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
)

describe('AddMemberForm', () => {
  it('revalida o contato ao trocar de Email para Telefone, sem deixar o erro de email embaixo do telefone', async () => {
    const user = userEvent.setup()
    render(<AddMemberForm groupId="g1" />, { wrapper })

    await user.type(screen.getByRole('textbox', { name: 'Email' }), 'bruno')
    await user.click(screen.getByRole('button', { name: 'Adicionar membro' }))
    expect(await screen.findByText('Informe um email válido.')).toBeInTheDocument()

    await user.click(screen.getByRole('radio', { name: 'Telefone' }))

    expect(screen.queryByText('Informe um email válido.')).not.toBeInTheDocument()
  })
})
