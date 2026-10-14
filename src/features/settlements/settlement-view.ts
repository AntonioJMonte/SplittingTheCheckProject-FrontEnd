import type { Settlement } from '@/api/types'

export type PendingAction = 'acknowledge' | 'view-pix' | 'none'

export function pendingAction(settlement: Settlement, myMemberId: string | undefined): PendingAction {
  if (myMemberId !== undefined && settlement.toMemberId === myMemberId) return 'acknowledge'
  if (myMemberId !== undefined && settlement.fromMemberId === myMemberId && settlement.pixCopyPaste) return 'view-pix'
  return 'none'
}
