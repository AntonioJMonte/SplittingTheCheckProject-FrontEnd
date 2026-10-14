import type { GroupMember } from '@/api/types'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ExpenseForm } from './ExpenseForm'

interface AddExpenseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  groupId: string
  members: GroupMember[]
  myUserId: string | undefined
}

export function AddExpenseDialog({ open, onOpenChange, groupId, members, myUserId }: AddExpenseDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova despesa</DialogTitle>
          <DialogDescription>A parte exata de cada pessoa é calculada pela API ao salvar.</DialogDescription>
        </DialogHeader>
        <ExpenseForm groupId={groupId} members={members} myUserId={myUserId} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}
