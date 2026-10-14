import { describe, expect, it } from 'vitest'
import { formatDate, todayInputValue, toNoonIso } from './dates'

describe('datas (fuso dos testes: America/Sao_Paulo)', () => {
  it('roda no fuso de São Paulo', () => {
    expect(new Date('2026-10-13T12:00:00').getTimezoneOffset()).toBe(180)
  })

  it('formata a data no dia local', () => {
    expect(formatDate('2026-10-13T15:00:00.000Z')).toBe('13/10/2026')
    expect(formatDate('2026-10-14T01:30:00.000Z')).toBe('13/10/2026')
  })

  it('usa o dia local para o padrão do campo de data, mesmo tarde da noite', () => {
    expect(todayInputValue(new Date('2026-10-14T01:30:00.000Z'))).toBe('2026-10-13')
  })

  it('envia o meio-dia local em ISO para o fuso não trocar o dia', () => {
    expect(toNoonIso('2026-10-13')).toBe('2026-10-13T15:00:00.000Z')
    expect(formatDate(toNoonIso('2026-01-01'))).toBe('01/01/2026')
  })
})
