import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { describe, expect, it, vi } from 'vitest'
import { PixCopyButton } from './PixCopyButton'

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }))

const CODE = '00020126580014br.gov.bcb.pix0136ana@example.com5204000053039865406100.005802BR6304ABCD'

function mockClipboard(implementation: (text: string) => Promise<void>) {
  const writeText = vi.fn(implementation)
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
  return writeText
}

describe('PixCopyButton', () => {
  it('copia o código e confirma com "Copiado!"', async () => {
    const user = userEvent.setup()
    const writeText = mockClipboard(async () => {})
    render(<PixCopyButton code={CODE} />)

    await user.click(screen.getByRole('button', { name: 'Copiar código Pix' }))

    expect(writeText).toHaveBeenCalledWith(CODE)
    expect(await screen.findByRole('button', { name: 'Copiado!' })).toBeInTheDocument()
  })

  it('seleciona o código e avisa quando a cópia falha', async () => {
    const user = userEvent.setup()
    mockClipboard(async () => {
      throw new Error('sem permissão')
    })
    render(<PixCopyButton code={CODE} />)

    await user.click(screen.getByRole('button', { name: 'Copiar código Pix' }))

    const field = screen.getByLabelText<HTMLTextAreaElement>('Código Pix copia-e-cola')
    expect([field.selectionStart, field.selectionEnd]).toEqual([0, CODE.length])
    expect(toast.error).toHaveBeenCalledWith('Não foi possível copiar. Selecione o código e copie manualmente.')
  })
})
