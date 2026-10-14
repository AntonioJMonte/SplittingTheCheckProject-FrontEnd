import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { PixKeyDialog } from './PixKeyDialog'

vi.mock('@/api/generated/endpoints/users/users', () => ({
  useGetUsersMe: () => ({ data: { user: { id: 'u-ana', name: 'Ana', email: 'ana@example.com', phone: null, pixKey: 'ana@pix.com' } } }),
  usePatchUsersPixKey: () => ({ mutateAsync: vi.fn(), isPending: false }),
  getGetUsersMeQueryKey: () => ['/users/me'],
}))

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
)

describe('PixKeyDialog', () => {
  it('reabre mostrando a chave salva, sem o rascunho de antes', async () => {
    const user = userEvent.setup()
    render(<PixKeyDialog />, { wrapper })

    await user.click(screen.getByRole('button', { name: 'Chave Pix' }))
    const field = screen.getByRole('textbox', { name: 'Chave Pix' })
    await user.clear(field)
    await user.type(field, 'rascunho')
    await user.keyboard('{Escape}')

    await user.click(screen.getByRole('button', { name: 'Chave Pix' }))

    expect(screen.getByRole('textbox', { name: 'Chave Pix' })).toHaveValue('ana@pix.com')
  })
})
