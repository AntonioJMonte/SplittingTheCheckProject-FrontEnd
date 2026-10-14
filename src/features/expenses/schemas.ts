import { z } from 'zod'
import { isValidAmountInput, toApiAmount } from '@/lib/money'

// Mesmas categorias da API (EXPENSE_CATEGORIES do back). O tsc acusa divergência quando o corpo gerado não aceitar.
export const EXPENSE_CATEGORIES = [
  'Alimentação',
  'Transporte',
  'Moradia',
  'Lazer',
  'Assinaturas',
  'Saúde',
  'Compras',
  'Outros',
] as const
export const AUTO_CATEGORY = 'auto'
export const CATEGORY_OPTIONS = [AUTO_CATEGORY, ...EXPENSE_CATEGORIES] as const
export const SPLIT_METHODS = ['EQUAL', 'FIXED', 'PERCENTAGE'] as const

const PERCENTAGE_INPUT = /^\d{1,3}(,\d{1,2})?$/

export const isPositiveAmountInput = (input: string) => isValidAmountInput(input) && toApiAmount(input) !== '0.00'
const isPositivePercentageInput = (input: string) => {
  const trimmed = input.trim()
  return PERCENTAGE_INPUT.test(trimmed) && !/^0+(,0+)?$/.test(trimmed)
}

const participantSchema = z.object({
  memberId: z.string(),
  selected: z.boolean(),
  amount: z.string(),
  percentage: z.string(),
})

/**
 * Valida só formato. Se as partes fecham o total ou se os percentuais somam 100 é regra de domínio: o back responde
 * 400 e a mensagem aparece no formulário.
 */
export const expenseFormSchema = z
  .object({
    description: z.string().trim().min(1, 'Descreva a despesa.'),
    amount: z
      .string()
      .trim()
      .min(1, 'Informe o valor.')
      .refine((value) => value === '' || isValidAmountInput(value), 'Valor inválido. Use o formato 1.234,56.')
      .refine((value) => !isValidAmountInput(value) || toApiAmount(value) !== '0.00', 'O valor precisa ser maior que zero.'),
    payerId: z.string().min(1, 'Escolha quem pagou.'),
    occurredAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe a data.'),
    category: z.enum(CATEGORY_OPTIONS),
    splitMethod: z.enum(SPLIT_METHODS),
    participants: z.array(participantSchema),
  })
  .superRefine((values, ctx) => {
    const selected = values.participants.flatMap((participant, index) => (participant.selected ? [{ participant, index }] : []))
    if (selected.length === 0) {
      ctx.addIssue({ code: 'custom', path: ['participants'], message: 'Escolha ao menos um participante.' })
    }
    for (const { participant, index } of selected) {
      if (values.splitMethod === 'FIXED' && !isPositiveAmountInput(participant.amount)) {
        ctx.addIssue({
          code: 'custom',
          path: ['participants', index, 'amount'],
          message: 'Informe a parte desta pessoa, maior que zero.',
        })
      }
      if (values.splitMethod === 'PERCENTAGE' && !isPositivePercentageInput(participant.percentage)) {
        ctx.addIssue({
          code: 'custom',
          path: ['participants', index, 'percentage'],
          message: 'Informe um percentual maior que zero, como 33,33.',
        })
      }
    }
  })

export type ExpenseFormValues = z.infer<typeof expenseFormSchema>
