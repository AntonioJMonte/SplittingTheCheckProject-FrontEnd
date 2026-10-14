import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { usePostGroupsGroupIdSettlements } from '@/api/generated/endpoints/settlements/settlements'
import type { GroupMember, Settlement, Transfer } from '@/api/types'
import { FormAlert } from '@/components/form-field'
import { MoneyDisplay } from '@/components/MoneyDisplay'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { memberName } from '@/features/groups/group-view'
import { toApiError } from '@/lib/api-error'
import { invalidateGroupQueries } from '@/lib/invalidate-group'
import { PixCopyButton } from './PixCopyButton'

export type SettleTarget = { mode: 'pay'; transfer: Transfer } | { mode: 'view'; settlement: Settlement }

type PixSettlement = { amount: string; pixCopyPaste?: string | null }

interface SettleDialogProps {
  groupId: string
  target: SettleTarget | null
  members: GroupMember[]
  onClose: () => void
}

export function SettleDialog({ groupId, target, members, onClose }: SettleDialogProps) {
  return (
    <Dialog open={target !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        {target ? <SettleContent groupId={groupId} target={target} members={members} onClose={onClose} /> : null}
      </DialogContent>
    </Dialog>
  )
}

function SettleContent({ groupId, target, members, onClose }: SettleDialogProps & { target: SettleTarget }) {
  const queryClient = useQueryClient()
  const registerPayment = usePostGroupsGroupIdSettlements()
  const [settlement, setSettlement] = useState<PixSettlement | null>(target.mode === 'view' ? target.settlement : null)
  const [error, setError] = useState<string | null>(null)
  const pair = target.mode === 'pay' ? target.transfer : target.settlement
  const creditor = memberName(members, pair.toMemberId)

  async function register(transfer: Transfer) {
    setError(null)
    try {
      const { settlement: created } = await registerPayment.mutateAsync({
        groupId,
        data: { fromMemberId: transfer.fromMemberId, toMemberId: transfer.toMemberId, amount: transfer.amount },
      })
      setSettlement(created)
      toast.success('Pagamento registrado')
      void invalidateGroupQueries(queryClient, groupId)
    } catch (err) {
      const apiError = toApiError(err)
      if (apiError.status === 403) {
        toast.error(apiError.message)
        onClose()
        return
      }
      if (apiError.status === null || apiError.status >= 500) {
        toast.error(apiError.message)
        return
      }
      // 409 (pendente com outro valor) e 422 (excede a dívida): o saldo mudou com o diálogo aberto.
      setError(apiError.message)
      void invalidateGroupQueries(queryClient, groupId)
    }
  }

  if (settlement === null && target.mode === 'pay') {
    return (
      <>
        <DialogHeader>
          <DialogTitle>Registrar pagamento</DialogTitle>
          <DialogDescription>
            O pagamento fica pendente até {creditor} confirmar que recebeu.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-1">
          <MoneyDisplay amount={target.transfer.amount} size="lg" />
          <p className="text-sm text-muted-foreground">para {creditor}</p>
        </div>
        <FormAlert message={error} />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button disabled={registerPayment.isPending} onClick={() => void register(target.transfer)}>
            {registerPayment.isPending ? 'Registrando…' : 'Registrar pagamento'}
          </Button>
        </DialogFooter>
      </>
    )
  }

  if (settlement === null) return null
  return (
    <>
      <DialogHeader>
        <DialogTitle>Pagar com Pix</DialogTitle>
        <DialogDescription>
          Pague com Pix copia-e-cola no app do seu banco. O acerto fica pendente até {creditor} confirmar o recebimento.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-1">
        <MoneyDisplay amount={settlement.amount} size="lg" />
        <p className="text-sm text-muted-foreground">para {creditor}</p>
      </div>
      {settlement.pixCopyPaste ? (
        <PixCopyButton code={settlement.pixCopyPaste} />
      ) : (
        <p className="max-w-prose text-sm">
          {creditor} não cadastrou chave Pix. Combine o pagamento por fora. O acerto fica pendente até {creditor} confirmar.
        </p>
      )}
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Fechar
        </Button>
      </DialogFooter>
    </>
  )
}
