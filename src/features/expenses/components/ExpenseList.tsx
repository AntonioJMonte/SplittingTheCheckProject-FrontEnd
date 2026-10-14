import { keepPreviousData } from '@tanstack/react-query'
import { useState } from 'react'
import { useGetGroupsGroupIdExpenses } from '@/api/generated/endpoints/expenses/expenses'
import type { Expense, GroupMember } from '@/api/types'
import { SectionError } from '@/components/section-error'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { nameByUserId } from '@/features/groups/group-view'
import { toApiError } from '@/lib/api-error'
import { formatDate } from '@/lib/dates'
import { formatBRL } from '@/lib/money'
import { useChangedKeys } from '@/lib/use-changed-keys'
import { cn } from '@/lib/utils'
import { myShareAmount } from '../expense-view'

const PAGE_SIZE = 20

interface ExpenseListProps {
  groupId: string
  members: GroupMember[]
  myMemberId: string | undefined
  onAddExpense?: () => void
}

function ExpenseRows({ expenses, members, myMemberId, loadingPage }: {
  expenses: Expense[]
  members: GroupMember[]
  myMemberId: string | undefined
  loadingPage: boolean
}) {
  // Enquanto a página nova não chega, nada é comparado: trocar de página não é "mudou".
  const changed = useChangedKeys(
    loadingPage ? undefined : expenses.map((e) => [e.id, `${e.amount}|${e.description}|${e.category ?? ''}`] as const),
  )
  return (
    <ul className="divide-y">
      {expenses.map((expense) => {
        const share = myShareAmount(expense.shares, myMemberId)
        return (
          <li
            key={expense.id}
            className={cn(
              'grid gap-1 px-4 py-3 transition-colors duration-700 motion-reduce:transition-none',
              changed.has(expense.id) && 'bg-highlight',
            )}
          >
            <div className="flex items-baseline gap-3">
              <span className="font-medium">{expense.description}</span>
              <Badge variant="secondary">{expense.category ?? 'Categorizando…'}</Badge>
              <span className="ml-auto shrink-0 font-medium tabular-nums">{formatBRL(expense.amount)}</span>
            </div>
            <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
              <span>{formatDate(expense.occurredAt)}</span>
              <span>pago por {nameByUserId(members, expense.payerId)}</span>
              <span>{share ? `sua parte: ${formatBRL(share)}` : 'você não participa'}</span>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export function ExpenseList({ groupId, members, myMemberId, onAddExpense }: ExpenseListProps) {
  const [page, setPage] = useState(1)
  const expenses = useGetGroupsGroupIdExpenses(
    groupId,
    { page, limit: PAGE_SIZE },
    { query: { placeholderData: keepPreviousData } },
  )

  let content
  if (expenses.isPending) {
    content = (
      <div className="grid gap-3 p-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  } else if (!expenses.data) {
    content = <SectionError message={toApiError(expenses.error).message} onRetry={() => void expenses.refetch()} />
  } else if (expenses.data.total === 0) {
    content = (
      <div className="grid gap-3 px-4 pb-4">
        <p className="text-sm text-muted-foreground">Nenhuma despesa ainda.</p>
        {onAddExpense ? (
          <div>
            <Button onClick={onAddExpense}>Adicionar despesa</Button>
          </div>
        ) : null}
      </div>
    )
  } else {
    const { total } = expenses.data
    const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE))
    content = (
      <>
        <ExpenseRows
          key={page}
          expenses={expenses.data.expenses}
          members={members}
          myMemberId={myMemberId}
          loadingPage={expenses.isPlaceholderData}
        />
        <div className="flex items-center gap-2 border-t px-4 py-3 text-sm text-muted-foreground">
          <span className="mr-auto">
            {total} {total === 1 ? 'despesa' : 'despesas'}
          </span>
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
            Anterior
          </Button>
          <Button variant="outline" size="sm" disabled={page >= lastPage} onClick={() => setPage(page + 1)}>
            Próxima
          </Button>
        </div>
      </>
    )
  }

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <h2 className="p-4 text-base font-semibold">Despesas</h2>
      {content}
    </Card>
  )
}
