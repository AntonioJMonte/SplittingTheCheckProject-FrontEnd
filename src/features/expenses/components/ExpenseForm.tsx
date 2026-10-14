import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { usePostGroupsGroupIdExpenses } from '@/api/generated/endpoints/expenses/expenses'
import type { GroupMember } from '@/api/types'
import { FormAlert, FormField } from '@/components/form-field'
import { Button } from '@/components/ui/button'
import { DialogClose, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { memberName } from '@/features/groups/group-view'
import { toApiError } from '@/lib/api-error'
import { todayInputValue } from '@/lib/dates'
import { reportFormError } from '@/lib/form-errors'
import { invalidateGroupQueries } from '@/lib/invalidate-group'
import { approxEqualShare, isValidAmountInput, toApiAmount } from '@/lib/money'
import { AUTO_CATEGORY, EXPENSE_CATEGORIES, type ExpenseFormValues, expenseFormSchema } from '../schemas'
import { fieldForIssuePath, toCreateExpenseBody } from '../to-create-expense-body'
import { NativeSelect } from './NativeSelect'

const SPLIT_OPTIONS = [
  { value: 'EQUAL', label: 'Igual' },
  { value: 'FIXED', label: 'Valores' },
  { value: 'PERCENTAGE', label: 'Percentual' },
] as const

interface ExpenseFormProps {
  groupId: string
  members: GroupMember[]
  myUserId: string | undefined
  onDone: () => void
}

export function ExpenseForm({ groupId, members, myUserId, onDone }: ExpenseFormProps) {
  const queryClient = useQueryClient()
  const createExpense = usePostGroupsGroupIdExpenses()
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      description: '',
      amount: '',
      payerId: myUserId ?? members[0]?.userId ?? '',
      occurredAt: todayInputValue(),
      category: AUTO_CATEGORY,
      splitMethod: 'EQUAL',
      participants: members.map((member) => ({ memberId: member.id, selected: true, amount: '', percentage: '' })),
    },
  })
  const [amount, splitMethod, participants] = useWatch({ control, name: ['amount', 'splitMethod', 'participants'] })
  const selectedCount = participants.filter((participant) => participant.selected).length
  const preview =
    splitMethod === 'EQUAL' && isValidAmountInput(amount) ? approxEqualShare(toApiAmount(amount), selectedCount) : null

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    const { body, shareMemberIds } = toCreateExpenseBody(values)
    try {
      await createExpense.mutateAsync({ groupId, data: body })
      toast.success('Despesa adicionada')
      void invalidateGroupQueries(queryClient, groupId)
      onDone()
    } catch (error) {
      const apiError = toApiError(error)
      if (apiError.status === 403) {
        toast.error(apiError.message)
        onDone()
        return
      }
      const participantMemberIds = values.participants.map((participant) => participant.memberId)
      setFormError(reportFormError(error, setError, (path) => fieldForIssuePath(path, shareMemberIds, participantMemberIds)))
    }
  })

  return (
    <form noValidate onSubmit={onSubmit} className="grid gap-4">
      <FormField label="Descrição" htmlFor="expense-description" error={errors.description?.message}>
        <Input id="expense-description" aria-invalid={Boolean(errors.description)} {...register('description')} />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Valor" htmlFor="expense-amount" hint="Ex.: 1.234,56" error={errors.amount?.message}>
          <Input
            id="expense-amount"
            inputMode="decimal"
            autoComplete="off"
            className="text-right tabular-nums"
            aria-invalid={Boolean(errors.amount)}
            {...register('amount')}
          />
        </FormField>
        <FormField label="Data" htmlFor="expense-date" error={errors.occurredAt?.message}>
          <Input id="expense-date" type="date" aria-invalid={Boolean(errors.occurredAt)} {...register('occurredAt')} />
        </FormField>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Pago por" htmlFor="expense-payer" error={errors.payerId?.message}>
          <NativeSelect id="expense-payer" {...register('payerId')}>
            {members.map((member) => (
              <option key={member.id} value={member.userId}>
                {member.userId === myUserId ? `${member.name} (você)` : member.name}
              </option>
            ))}
          </NativeSelect>
        </FormField>
        <FormField label="Categoria" htmlFor="expense-category" error={errors.category?.message}>
          <NativeSelect id="expense-category" {...register('category')}>
            <option value={AUTO_CATEGORY}>Automática</option>
            {EXPENSE_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </NativeSelect>
        </FormField>
      </div>
      <fieldset className="grid gap-3">
        <legend className="text-sm font-medium">Divisão</legend>
        <FormAlert message={formError} />
        <div className="flex flex-wrap gap-4 text-sm">
          {SPLIT_OPTIONS.map((option) => (
            <label key={option.value} className="flex items-center gap-2">
              <input type="radio" value={option.value} className="accent-primary" {...register('splitMethod')} />
              {option.label}
            </label>
          ))}
        </div>
        <ul className="grid gap-2">
          {/* As linhas vêm do formulário, não da lista viva de membros: um member_added ou member_removed com o diálogo
              aberto não pode trocar a pessoa de uma linha. */}
          {participants.map((participant, index) => {
            const name = memberName(members, participant.memberId)
            const selected = participant.selected
            const rowError =
              errors.participants?.[index]?.amount?.message ?? errors.participants?.[index]?.percentage?.message
            return (
              <li key={participant.memberId} className="grid gap-1">
                <div className="flex min-h-9 items-center gap-3">
                  <label className="flex flex-1 items-center gap-2">
                    <input type="checkbox" className="size-4 accent-primary" {...register(`participants.${index}.selected`)} />
                    {name}
                  </label>
                  {splitMethod === 'FIXED' && selected ? (
                    <Input
                      aria-label={`Parte de ${name}`}
                      inputMode="decimal"
                      className="w-32 text-right tabular-nums"
                      aria-invalid={Boolean(errors.participants?.[index]?.amount)}
                      {...register(`participants.${index}.amount`)}
                    />
                  ) : null}
                  {splitMethod === 'PERCENTAGE' && selected ? (
                    <Input
                      aria-label={`Percentual de ${name}`}
                      inputMode="decimal"
                      className="w-24 text-right tabular-nums"
                      aria-invalid={Boolean(errors.participants?.[index]?.percentage)}
                      {...register(`participants.${index}.percentage`)}
                    />
                  ) : null}
                </div>
                {rowError ? <p className="text-sm text-destructive">{rowError}</p> : null}
              </li>
            )
          })}
        </ul>
        {errors.participants?.message ?? errors.participants?.root?.message ? (
          <p className="text-sm text-destructive">{errors.participants?.message ?? errors.participants?.root?.message}</p>
        ) : null}
        {preview ? <p className="text-xs text-muted-foreground">{preview}</p> : null}
      </fieldset>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline">
            Cancelar
          </Button>
        </DialogClose>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando…' : 'Adicionar despesa'}
        </Button>
      </DialogFooter>
    </form>
  )
}
