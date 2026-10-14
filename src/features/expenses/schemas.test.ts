import { describe, expect, it } from 'vitest'
import { type ExpenseFormValues, expenseFormSchema } from './schemas'

const valid = (overrides: Partial<ExpenseFormValues> = {}): ExpenseFormValues => ({
  description: 'Jantar',
  amount: '100,00',
  payerId: 'u-ana',
  occurredAt: '2026-10-13',
  category: 'auto',
  splitMethod: 'EQUAL',
  participants: [
    { memberId: 'm-ana', selected: true, amount: '', percentage: '' },
    { memberId: 'm-bruno', selected: true, amount: '', percentage: '' },
  ],
  ...overrides,
})

const issuesOf = (values: unknown) => {
  const result = expenseFormSchema.safeParse(values)
  return result.success ? [] : result.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message }))
}

const participants = (...rows: Array<[selected: boolean, amount: string, percentage: string]>) =>
  rows.map(([selected, amount, percentage], index) => ({ memberId: `m-${index}`, selected, amount, percentage }))

describe('expenseFormSchema', () => {
  it('aceita uma divisão igual válida', () => {
    expect(issuesOf(valid())).toEqual([])
  })

  it('exige descrição', () => {
    expect(issuesOf(valid({ description: '  ' }))).toEqual([{ path: 'description', message: 'Descreva a despesa.' }])
  })

  it('recusa ponto decimal em vez de ler 12.5 como 125', () => {
    expect(issuesOf(valid({ amount: '12.5' }))).toEqual([{ path: 'amount', message: 'Valor inválido. Use o formato 1.234,56.' }])
  })

  it('recusa valor zero', () => {
    expect(issuesOf(valid({ amount: '0,00' }))).toEqual([{ path: 'amount', message: 'O valor precisa ser maior que zero.' }])
  })

  it('recusa categoria fora da lista da API', () => {
    expect(issuesOf(valid({ category: 'Bebidas' as ExpenseFormValues['category'] })).map((i) => i.path)).toEqual(['category'])
  })

  it('exige ao menos um participante', () => {
    expect(issuesOf(valid({ participants: participants([false, '', ''], [false, '', '']) }))).toEqual([
      { path: 'participants', message: 'Escolha ao menos um participante.' },
    ])
  })

  it('em Valores, exige a parte só de quem participa', () => {
    const values = valid({ splitMethod: 'FIXED', participants: participants([true, '', ''], [false, '', '']) })

    expect(issuesOf(values)).toEqual([{ path: 'participants.0.amount', message: 'Informe a parte desta pessoa, maior que zero.' }])
  })

  it('em Valores, não confere se as partes fecham o total (regra do back)', () => {
    expect(issuesOf(valid({ splitMethod: 'FIXED', participants: participants([true, '10,00', ''], [true, '10,00', '']) }))).toEqual([])
  })

  it('em Percentual, recusa zero e ponto decimal e aceita vírgula', () => {
    const values = valid({ splitMethod: 'PERCENTAGE', participants: participants([true, '', '0'], [true, '', '33.3'], [true, '', '33,33']) })

    expect(issuesOf(values).map((i) => i.path)).toEqual(['participants.0.percentage', 'participants.1.percentage'])
  })

  it('em Percentual, não confere se soma 100 (regra do back)', () => {
    expect(issuesOf(valid({ splitMethod: 'PERCENTAGE', participants: participants([true, '', '10'], [true, '', '10']) }))).toEqual([])
  })
})
