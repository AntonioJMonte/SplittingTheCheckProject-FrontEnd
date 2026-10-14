import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Input } from '@/components/ui/input'
import { FormField } from './form-field'

describe('FormField', () => {
  it('liga o erro ao campo para o leitor de tela ler o motivo', () => {
    render(
      <FormField label="Email" htmlFor="email" error="Informe um email válido.">
        <Input id="email" />
      </FormField>,
    )

    const input = screen.getByLabelText('Email')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription('Informe um email válido.')
  })

  it('liga a dica ao campo quando não há erro', () => {
    render(
      <FormField label="Senha" htmlFor="password" hint="Pelo menos 6 caracteres.">
        <Input id="password" />
      </FormField>,
    )

    const input = screen.getByLabelText('Senha')
    expect(input).not.toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription('Pelo menos 6 caracteres.')
  })
})
