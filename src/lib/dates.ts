const dateFormat = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })

export const formatDate = (iso: string): string => dateFormat.format(new Date(iso))

const pad = (value: number) => String(value).padStart(2, '0')

/** Valor do <input type="date"> para o dia local de `now`. */
export function todayInputValue(now: Date = new Date()): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

/** "2026-10-13" → meio-dia local em ISO, para o fuso não trocar o dia da despesa (spec, Tela 4). */
export const toNoonIso = (dateInput: string): string => new Date(`${dateInput}T12:00:00`).toISOString()
