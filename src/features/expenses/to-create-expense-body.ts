import type { Path } from 'react-hook-form'
import type { postGroupsGroupIdExpenses } from '@/api/generated/endpoints/expenses/expenses'
import { toNoonIso } from '@/lib/dates'
import { toApiAmount } from '@/lib/money'
import { AUTO_CATEGORY, type ExpenseFormValues } from './schemas'

export type CreateExpenseBody = Parameters<typeof postGroupsGroupIdExpenses>[1]

// Percentual não é dinheiro: segue como number, como a API espera (o D-98 só mudou os campos de valor).
const toApiPercentage = (input: string): number => Number(input.trim().replace(',', '.'))

export function toCreateExpenseBody(values: ExpenseFormValues): { body: CreateExpenseBody; shareMemberIds: string[] } {
  const selected = values.participants.filter((participant) => participant.selected)
  const shares = selected.map((participant) => {
    if (values.splitMethod === 'FIXED') return { memberId: participant.memberId, amount: toApiAmount(participant.amount) }
    if (values.splitMethod === 'PERCENTAGE') {
      return { memberId: participant.memberId, percentage: toApiPercentage(participant.percentage) }
    }
    return { memberId: participant.memberId }
  })

  return {
    body: {
      description: values.description,
      amount: toApiAmount(values.amount),
      payerId: values.payerId,
      occurredAt: toNoonIso(values.occurredAt),
      splitMethod: values.splitMethod,
      shares,
      ...(values.category === AUTO_CATEGORY ? {} : { category: values.category }),
    },
    shareMemberIds: selected.map((participant) => participant.memberId),
  }
}

const TOP_LEVEL_FIELDS = new Set(['description', 'amount', 'payerId', 'occurredAt', 'category', 'splitMethod'])

/** Leva o caminho de uma issue da API ("shares.1.amount") ao campo do formulário ("participants.2.amount"). */
export function fieldForIssuePath(
  path: string,
  shareMemberIds: string[],
  participantMemberIds: string[],
): Path<ExpenseFormValues> | null {
  const share = /^shares\.(\d+)\.(amount|percentage)$/.exec(path)
  if (share) {
    const memberId = shareMemberIds[Number(share[1])]
    const participantIndex = memberId === undefined ? -1 : participantMemberIds.indexOf(memberId)
    return participantIndex === -1 ? null : (`participants.${participantIndex}.${share[2]}` as Path<ExpenseFormValues>)
  }
  return TOP_LEVEL_FIELDS.has(path) ? (path as Path<ExpenseFormValues>) : null
}
