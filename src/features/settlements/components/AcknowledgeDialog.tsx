import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { usePatchSettlementsSettlementIdAcknowledge } from '@/api/generated/endpoints/settlements/settlements'
import type { GroupMember, Settlement } from '@/api/types'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { memberName } from '@/features/groups/group-view'
import { toApiError } from '@/lib/api-error'
import { invalidateGroupQueries } from '@/lib/invalidate-group'
import { formatBRL } from '@/lib/money'

interface AcknowledgeDialogProps {
  groupId: string
  settlement: Settlement | null
  members: GroupMember[]
  onClose: () => void
}

export function AcknowledgeDialog({ groupId, settlement, members, onClose }: AcknowledgeDialogProps) {
  const queryClient = useQueryClient()
  const acknowledge = usePatchSettlementsSettlementIdAcknowledge()

  async function confirm(target: Settlement) {
    try {
      await acknowledge.mutateAsync({ settlementId: target.id })
      toast.success('Recebimento confirmado')
    } catch (error) {
      // 409 (alterado, já confirmado ou cancelado) e 403: a tela relê o estado atual.
      toast.error(toApiError(error).message)
    }
    void invalidateGroupQueries(queryClient, groupId)
    onClose()
  }

  return (
    <Dialog open={settlement !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        {settlement ? (
          <>
            <DialogHeader>
              <DialogTitle>Confirmar recebimento</DialogTitle>
              <DialogDescription>
                Confirmar que você recebeu {formatBRL(settlement.amount)} de {memberName(members, settlement.fromMemberId)}?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button disabled={acknowledge.isPending} onClick={() => void confirm(settlement)}>
                {acknowledge.isPending ? 'Confirmando…' : 'Confirmar recebimento'}
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
