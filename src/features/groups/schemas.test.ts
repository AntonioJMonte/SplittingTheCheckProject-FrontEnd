import { describe, expect, it } from 'vitest'
import { addMemberSchema, createGroupSchema, toAddMemberBody } from './schemas'

describe('createGroupSchema', () => {
  it('exige nome e aceita descrição vazia', () => {
    expect(createGroupSchema.safeParse({ name: 'Viagem', description: '' }).success).toBe(true)
    expect(createGroupSchema.safeParse({ name: ' ', description: '' }).success).toBe(false)
  })
})

describe('addMemberSchema', () => {
  it('confere o formato só quando a busca é por email', () => {
    expect(addMemberSchema.safeParse({ kind: 'email', contact: 'bruno' }).success).toBe(false)
    expect(addMemberSchema.safeParse({ kind: 'phone', contact: '(11) 98765-4321' }).success).toBe(true)
  })

  it('envia exatamente um entre email e telefone, como o D-77 exige', () => {
    expect(toAddMemberBody({ kind: 'email', contact: 'bruno@example.com' })).toEqual({ email: 'bruno@example.com' })
    expect(toAddMemberBody({ kind: 'phone', contact: '11987654321' })).toEqual({ phone: '11987654321' })
  })
})
