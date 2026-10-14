import { describe, expect, it } from 'vitest'
import { loginSchema, registerSchema } from './schemas'

const messages = (result: { success: boolean; error?: { issues: { message: string }[] } }) =>
  result.success ? [] : (result.error?.issues.map((issue) => issue.message) ?? [])

describe('loginSchema', () => {
  it('pede email válido e senha com pelo menos 6 caracteres, como o back', () => {
    expect(messages(loginSchema.safeParse({ email: 'ana', password: '123' }))).toEqual([
      'Informe um email válido.',
      'A senha tem pelo menos 6 caracteres.',
    ])
  })
})

describe('registerSchema', () => {
  it('aceita telefone em branco', () => {
    expect(registerSchema.safeParse({ name: 'Ana', email: 'ana@example.com', password: '123456', phone: '' }).success).toBe(true)
  })

  it('recusa nome só com espaços', () => {
    expect(messages(registerSchema.safeParse({ name: '  ', email: 'ana@example.com', password: '123456', phone: '' }))).toEqual([
      'Informe seu nome.',
    ])
  })
})
