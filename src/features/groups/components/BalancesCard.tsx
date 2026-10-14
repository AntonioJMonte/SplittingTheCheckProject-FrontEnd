import { useGetGroupsGroupIdBalances } from '@/api/generated/endpoints/groups/groups'
import { useGetGroupsGroupIdSettlements } from '@/api/generated/endpoints/settlements/settlements'
import type { GroupMember, Settlement, Transfer } from '@/api/types'
import { MoneyDisplay } from '@/components/MoneyDisplay'
import { SectionError } from '@/components/section-error'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { PendingSettlementsList } from '@/features/settlements/components/PendingSettlementsList'
import { toApiError } from '@/lib/api-error'
import { absoluteAmount, type BalanceTone, balanceTone } from '@/lib/money'
import { useChangedKeys } from '@/lib/use-changed-keys'
import { cn } from '@/lib/utils'
import { memberName, transferKey } from '../group-view'
import { TransfersList } from './TransfersList'

const TONE_LABEL = { negative: 'deve', positive: 'a receber', settled: 'quitado' } satisfies Record<BalanceTone, string>
const TONE_CLASS = { negative: 'text-negative', positive: 'text-positive', settled: 'text-settled' } satisfies Record<
  BalanceTone,
  string
>

interface BalancesCardProps {
  groupId: string
  members: GroupMember[]
  myMemberId: string | undefined
  onPay?: (transfer: Transfer) => void
  onAcknowledge?: (settlement: Settlement) => void
  onViewPix?: (settlement: Settlement) => void
}

export function BalancesCard({ groupId, members, myMemberId, onPay, onAcknowledge, onViewPix }: BalancesCardProps) {
  const balances = useGetGroupsGroupIdBalances(groupId)
  const pending = useGetGroupsGroupIdSettlements(groupId, { status: 'PENDING' })
  const changedBalances = useChangedKeys(balances.data?.memberBalances.map((b) => [b.memberId, b.balance] as const))
  const changedTransfers = useChangedKeys(balances.data?.transfers.map((t) => [transferKey(t), t.amount] as const))

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <section aria-labelledby="balances-title" className="grid gap-2 p-4">
        <h2 id="balances-title" className="text-base font-semibold">
          Saldos
        </h2>
        {balances.isPending ? (
          <div className="grid gap-3">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
        ) : !balances.data ? (
          <SectionError message={toApiError(balances.error).message} onRetry={() => void balances.refetch()} />
        ) : (
          <ul className="-mx-2 grid">
            {balances.data.memberBalances.map((entry) => {
              const tone = balanceTone(entry.balance)
              return (
                <li
                  key={entry.memberId}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-2 py-3 transition-colors duration-700 motion-reduce:transition-none',
                    changedBalances.has(entry.memberId) && 'bg-highlight',
                  )}
                >
                  <span className="font-medium">{memberName(members, entry.memberId)}</span>
                  {entry.memberId === myMemberId ? <span className="text-xs text-muted-foreground">você</span> : null}
                  <span className={cn('ml-auto text-sm', TONE_CLASS[tone])}>{TONE_LABEL[tone]}</span>
                  {tone === 'settled' ? null : (
                    <MoneyDisplay amount={absoluteAmount(entry.balance)} size="md" className={TONE_CLASS[tone]} />
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>
      <section aria-labelledby="transfers-title" className="grid gap-2 border-t p-4">
        <h2 id="transfers-title" className="text-base font-semibold">
          Quem paga quem
        </h2>
        {balances.isPending ? (
          <Skeleton className="h-6 w-full" />
        ) : !balances.data ? (
          <SectionError message={toApiError(balances.error).message} onRetry={() => void balances.refetch()} />
        ) : (
          <TransfersList
            transfers={balances.data.transfers}
            members={members}
            pending={pending.data?.settlements ?? []}
            myMemberId={myMemberId}
            highlighted={changedTransfers}
            // Sem a lista de pendentes não dá para saber se o pagamento já foi registrado: Pagar espera por ela.
            onPay={pending.data ? onPay : undefined}
          />
        )}
      </section>
      {onAcknowledge && onViewPix ? (
        pending.isError && !pending.data ? (
          // Sem a lista, o credor perderia o Confirmar recebimento em silêncio: a seção mostra o erro (spec, Tela 3).
          <section aria-labelledby="pending-title" className="grid gap-2 border-t p-4">
            <h2 id="pending-title" className="text-base font-semibold">
              Aguardando confirmação
            </h2>
            <SectionError message={toApiError(pending.error).message} onRetry={() => void pending.refetch()} />
          </section>
        ) : (
          <PendingSettlementsList
            pending={pending.data?.settlements ?? []}
            members={members}
            myMemberId={myMemberId}
            onAcknowledge={onAcknowledge}
            onViewPix={onViewPix}
          />
        )
      ) : null}
    </Card>
  )
}
