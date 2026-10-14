import { useState } from 'react'
import { useParams } from 'react-router'
import { useGetGroupsGroupId } from '@/api/generated/endpoints/groups/groups'
import { useGetUsersMe } from '@/api/generated/endpoints/users/users'
import type { Settlement } from '@/api/types'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AddExpenseDialog } from '@/features/expenses/components/AddExpenseDialog'
import { ExpenseList } from '@/features/expenses/components/ExpenseList'
import { AcknowledgeDialog } from '@/features/settlements/components/AcknowledgeDialog'
import { type SettleTarget, SettleDialog } from '@/features/settlements/components/SettleDialog'
import { toApiError } from '@/lib/api-error'
import { useGroupRealtime } from '@/realtime/use-group-realtime'
import { useSocketConnected } from '@/realtime/use-socket-status'
import { BalancesCard } from '../components/BalancesCard'
import { GroupHeader } from '../components/GroupHeader'
import { GroupUnavailable } from '../components/GroupUnavailable'
import { MembersList } from '../components/MembersList'
import { findMyMember } from '../group-view'

export function GroupDetailPage() {
  const { groupId = '' } = useParams()
  const group = useGetGroupsGroupId(groupId)
  const me = useGetUsersMe()
  const connected = useSocketConnected()
  const [addingExpense, setAddingExpense] = useState(false)
  const [settleTarget, setSettleTarget] = useState<SettleTarget | null>(null)
  const [acknowledging, setAcknowledging] = useState<Settlement | null>(null)
  useGroupRealtime(groupId)

  // Sem acesso, inexistente ou id inválido valem mesmo com dados em cache: quem foi removido com a tela aberta vê o 403
  // no próximo refetch (spec, Tela 3). Rede e 5xx num refetch mantêm a tela.
  const lostAccess = group.isError && [400, 403, 404].includes(toApiError(group.error).status ?? 0)
  if (group.isError && (lostAccess || !group.data)) {
    return <GroupUnavailable error={group.error} onRetry={() => void group.refetch()} />
  }
  if (group.isPending) {
    return (
      <div className="grid gap-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  const { name, description, members } = group.data.group
  const myUserId = me.data?.user.id
  const myMemberId = findMyMember(members, myUserId)?.id
  const openAddExpense = () => setAddingExpense(true)

  return (
    <div className="grid gap-6">
      <GroupHeader
        name={name}
        description={description}
        connected={connected}
        actions={<Button onClick={openAddExpense}>Adicionar despesa</Button>}
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
        <BalancesCard
          groupId={groupId}
          members={members}
          myMemberId={myMemberId}
          onPay={(transfer) => setSettleTarget({ mode: 'pay', transfer })}
          onAcknowledge={setAcknowledging}
          onViewPix={(settlement) => setSettleTarget({ mode: 'view', settlement })}
        />
        <div className="grid gap-6">
          <ExpenseList groupId={groupId} members={members} myMemberId={myMemberId} onAddExpense={openAddExpense} />
          <MembersList groupId={groupId} members={members} myUserId={myUserId} />
        </div>
      </div>
      <AddExpenseDialog
        open={addingExpense}
        onOpenChange={setAddingExpense}
        groupId={groupId}
        members={members}
        myUserId={myUserId}
      />
      <SettleDialog groupId={groupId} target={settleTarget} members={members} onClose={() => setSettleTarget(null)} />
      <AcknowledgeDialog groupId={groupId} settlement={acknowledging} members={members} onClose={() => setAcknowledging(null)} />
    </div>
  )
}
