import type { GroupMember, Settlement, Transfer } from '@/api/types'
import { Button } from '@/components/ui/button'
import { formatBRL } from '@/lib/money'
import { cn } from '@/lib/utils'
import { memberName, transferAction, transferKey } from '../group-view'

interface TransfersListProps {
  transfers: Transfer[]
  members: GroupMember[]
  pending: Settlement[]
  myMemberId: string | undefined
  highlighted: ReadonlySet<string>
  onPay?: (transfer: Transfer) => void
}

export function TransfersList({ transfers, members, pending, myMemberId, highlighted, onPay }: TransfersListProps) {
  if (transfers.length === 0) return <p className="text-sm text-muted-foreground">Ninguém deve nada. Tudo quitado.</p>

  return (
    <ul className="-mx-2 grid">
      {transfers.map((transfer) => {
        const key = transferKey(transfer)
        const action = transferAction(transfer, myMemberId, pending)
        const from = transfer.fromMemberId === myMemberId ? 'Você' : memberName(members, transfer.fromMemberId)
        const to = transfer.toMemberId === myMemberId ? 'você' : memberName(members, transfer.toMemberId)
        return (
          <li
            key={key}
            className={cn(
              'grid gap-2 rounded-md px-2 py-3 transition-colors duration-700 motion-reduce:transition-none',
              highlighted.has(key) && 'bg-highlight',
            )}
          >
            <div className="flex items-baseline gap-3">
              <span>
                <span className="font-medium">{from}</span> paga <span className="font-medium">{to}</span>
              </span>
              <span className="ml-auto shrink-0 font-medium tabular-nums">{formatBRL(transfer.amount)}</span>
            </div>
            {action === 'pay' && onPay ? (
              <div className="flex justify-end">
                <Button size="sm" onClick={() => onPay(transfer)}>
                  Pagar
                </Button>
              </div>
            ) : null}
            {action === 'awaiting' ? (
              <p className="text-right text-xs text-muted-foreground">Pagamento registrado, aguardando confirmação.</p>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}
