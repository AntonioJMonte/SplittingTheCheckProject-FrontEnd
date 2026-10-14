import { describe, expect, it } from 'vitest'
import {
  absoluteAmount,
  approxEqualShare,
  balanceTone,
  formatBRL,
  isValidAmountInput,
  isZeroApiAmount,
  splitBRL,
  toApiAmount,
} from './money'

// O Intl põe espaço não separável depois do "R$"; comparar com espaço comum falha sem motivo aparente.
const normalize = (text: string) => text.replace(/\s/g, ' ')

describe('formatBRL', () => {
  it('formata o valor da API em reais', () => {
    expect(normalize(formatBRL('1234.50'))).toBe('R$ 1.234,50')
  })

  it('usa espaço não separável depois do R$', () => {
    expect(formatBRL('1.00')).not.toBe('R$ 1,00')
    expect(normalize(formatBRL('1.00'))).toBe('R$ 1,00')
  })

  it('formata zero', () => {
    expect(normalize(formatBRL('0.00'))).toBe('R$ 0,00')
  })
})

describe('toApiAmount', () => {
  it.each([
    ['12,5', '12.50'],
    ['1.234,56', '1234.56'],
    ['0,01', '0.01'],
    ['1.234', '1234.00'],
    ['10', '10.00'],
    [' 7,5 ', '7.50'],
    ['007,10', '7.10'],
    ['0', '0.00'],
    ['12345678901234567,89', '12345678901234567.89'],
  ])('normaliza %s para %s', (input, expected) => {
    expect(toApiAmount(input)).toBe(expected)
  })

  it.each(['abc', '12,345', '12.5', '1.23', '', '-5', '1,', 'R$ 10', '0.500', '01.234'])('recusa %s', (input) => {
    expect(() => toApiAmount(input)).toThrow('Valor inválido')
  })
})

describe('isValidAmountInput', () => {
  it('aceita o formato brasileiro e recusa ponto decimal', () => {
    expect(isValidAmountInput('1.234,56')).toBe(true)
    expect(isValidAmountInput('12.5')).toBe(false)
  })
})

describe('balanceTone', () => {
  it.each([
    ['-50.00', 'negative'],
    ['50.00', 'positive'],
    ['0.00', 'settled'],
    ['-0.00', 'settled'],
  ])('%s é %s', (balance, tone) => {
    expect(balanceTone(balance)).toBe(tone)
  })
})

describe('isZeroApiAmount e absoluteAmount', () => {
  it('reconhece zero com ou sem sinal', () => {
    expect(isZeroApiAmount('0.00')).toBe(true)
    expect(isZeroApiAmount('-0.00')).toBe(true)
    expect(isZeroApiAmount('0.01')).toBe(false)
  })

  it('tira só o sinal de menos', () => {
    expect(absoluteAmount('-50.00')).toBe('50.00')
    expect(absoluteAmount('50.00')).toBe('50.00')
  })
})

describe('splitBRL', () => {
  it('separa símbolo, parte inteira e centavos para a etiqueta de preço', () => {
    expect(splitBRL('1234.50')).toEqual({ symbol: 'R$', integer: '1.234', cents: '50' })
    expect(splitBRL('50.00')).toEqual({ symbol: 'R$', integer: '50', cents: '00' })
  })
})

describe('approxEqualShare', () => {
  it('mostra a prévia aproximada por pessoa', () => {
    expect(normalize(approxEqualShare('10.00', 3) ?? '')).toBe('≈ R$ 3,33 cada')
    expect(normalize(approxEqualShare('100.00', 2) ?? '')).toBe('≈ R$ 50,00 cada')
  })

  it('não mostra nada sem participantes', () => {
    expect(approxEqualShare('10.00', 0)).toBeNull()
  })
})
