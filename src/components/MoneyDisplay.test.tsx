import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MoneyDisplay } from './MoneyDisplay'

describe('MoneyDisplay', () => {
  it('lê o valor completo para leitores de tela e esconde as partes visuais', () => {
    const { container } = render(<MoneyDisplay amount="1234.50" size="md" />)

    expect(screen.getByText((text) => text.replace(/\s/g, ' ') === 'R$ 1.234,50')).toHaveClass('sr-only')
    expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(3)
  })
})
