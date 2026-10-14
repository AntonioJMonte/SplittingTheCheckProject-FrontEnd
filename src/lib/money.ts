const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

/** "1234.50" (API) → "R$ 1.234,50". Só exibição: o Number nunca entra em conta. */
export const formatBRL = (amount: string): string => brl.format(Number(amount))

// Ponto só como separador de milhar, em grupos de 3 ("1.234,56"). "12.5" é recusado em vez de virar 125 (P-7), e
// "0.500" em vez de virar 500: o primeiro grupo de milhar não começa com zero.
const PT_BR_AMOUNT = /^([1-9]\d{0,2}(\.\d{3})+|\d+)(,\d{1,2})?$/

export const isValidAmountInput = (input: string): boolean => PT_BR_AMOUNT.test(input.trim())

/** "1.234,5" (digitado) → "1234.50" (API). Só operações de texto. */
export function toApiAmount(input: string): string {
  const trimmed = input.trim()
  if (!PT_BR_AMOUNT.test(trimmed)) throw new Error('Valor inválido')
  const [integerPart, decimalPart = ''] = trimmed.replace(/\./g, '').split(',')
  const integer = integerPart.replace(/^0+(?=\d)/, '')
  return `${integer}.${decimalPart.padEnd(2, '0')}`
}

export const isZeroApiAmount = (amount: string): boolean => /^-?0+(\.0+)?$/.test(amount)

export type BalanceTone = 'negative' | 'settled' | 'positive'

/** Tom do saldo pelo texto da API, sem Number (spec 2.5). */
export function balanceTone(balance: string): BalanceTone {
  if (isZeroApiAmount(balance)) return 'settled'
  return balance.startsWith('-') ? 'negative' : 'positive'
}

export const absoluteAmount = (amount: string): string => amount.replace(/^-/, '')

export interface BRLParts {
  symbol: string
  integer: string
  cents: string
}

/** Divide o texto de formatBRL para a etiqueta de preço (DESIGN 5.2). Espera valor sem sinal. */
export function splitBRL(amount: string): BRLParts {
  const match = /^(R\$)\s(.+),(\d{2})$/u.exec(formatBRL(amount))
  if (!match) throw new Error(`Valor fora do formato BRL: ${amount}`)
  return { symbol: match[1], integer: match[2], cents: match[3] }
}

/**
 * Prévia da divisão igual (spec, Tela 4). É a única divisão do front: aproximada, só para exibir, nunca vai para a
 * API e não distribui o resto dos centavos.
 */
export function approxEqualShare(amount: string, participants: number): string | null {
  if (participants < 1) return null
  return `≈ ${brl.format(Number(amount) / participants)} cada`
}
