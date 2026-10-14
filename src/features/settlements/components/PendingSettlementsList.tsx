import type { GroupMember, Settlement } from '@/api/types'
import { Button } from '@/components/ui/button'
import { memberName } from '@/features/groups/group-view'
import { formatBRL } from '@/lib/money'
import { pendingAction } from '../settlement-view'

interface PendingSettlementsListProps {
  pending: Settlement[]
  members: GroupMember[]
  myMemberId: string | undefined
  onAcknowledge: (settlement: Settlement) => void
  onViewPix: (settlement: Settlement) => void
}

export function PendingSettlementsList({ pending, members, myMemberId, onAcknowledge, onViewPix }: PendingSettlementsListProps) {
  if (pending.length === 0) return null

  return (
    <section aria-labelledby="pending-title" className="grid gap-2 border-t p-4">
      <h2 id="pending-title" className="text-base font-semibold">
        Aguardando confirmação
      </h2>
      <ul className="-mx-2 grid">
        {pending.map((settlement) => {
          const action = pendingAction(settlement, myMemberId)
          const from = settlement.fromMemberId === myMemberId ? 'Você' : memberName(members, settlement.fromMemberId)
          const to = settlement.toMemberId === myMemberId ? 'você' : memberName(members, settlement.toMemberId)
          return (
            <li key={settlement.id} className="grid gap-2 px-2 py-3">
              <div className="flex items-baseline gap-3">
                <span>
                  <span className="font-medium">{from}</span> pagou a <span className="font-medium">{to}</span>
                </span>
                <span className="ml-auto shrink-0 font-medium tabular-nums">{formatBRL(settlement.amount)}</span>
              </div>
              {action === 'acknowledge' ? (
                <div className="flex justify-end">
                  <Button size="sm" onClick={() => onAcknowledge(settlement)}>
                    Confirmar recebimento
                  </Button>
                </div>
              ) : null}
              {action === 'view-pix' ? (
                <div className="flex justify-end">
                  <Button size="sm" variant="outline" onClick={() => onViewPix(settlement)}>
                    Ver Pix
                  </Button>
                </div>
              ) : null}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
