import type { GroupMember } from '@/api/types'

export const FORMER_MEMBER = 'ex-membro'

export const memberName = (members: GroupMember[], memberId: string): string =>
  members.find((member) => member.id === memberId)?.name ?? FORMER_MEMBER

export const nameByUserId = (members: GroupMember[], userId: string): string =>
  members.find((member) => member.userId === userId)?.name ?? FORMER_MEMBER

export const findMyMember = (members: GroupMember[], userId: string | undefined): GroupMember | undefined =>
  userId === undefined ? undefined : members.find((member) => member.userId === userId)

export type Pair = { fromMemberId: string; toMemberId: string }

export const samePair = (a: Pair, b: Pair): boolean => a.fromMemberId === b.fromMemberId && a.toMemberId === b.toMemberId

export const transferKey = (pair: Pair): string => `${pair.fromMemberId}->${pair.toMemberId}`

export type TransferAction = 'pay' | 'awaiting' | 'none'

/** O que a linha de "Quem paga quem" oferece (spec, Tela 3). */
export function transferAction(transfer: Pair, myMemberId: string | undefined, pending: Pair[]): TransferAction {
  if (pending.some((settlement) => samePair(settlement, transfer))) return 'awaiting'
  return transfer.fromMemberId === myMemberId ? 'pay' : 'none'
}
