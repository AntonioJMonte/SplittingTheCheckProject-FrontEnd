import type {
  GetGroupsGroupIdBalancesQueryResult,
  GetGroupsGroupIdQueryResult,
} from '@/api/generated/endpoints/groups/groups'
import type { GetGroupsGroupIdExpensesQueryResult } from '@/api/generated/endpoints/expenses/expenses'
import type { GetGroupsGroupIdSettlementsQueryResult } from '@/api/generated/endpoints/settlements/settlements'

// Derivados das respostas para não depender dos nomes internos que o orval dá aos tipos aninhados.
export type GroupMember = GetGroupsGroupIdQueryResult['group']['members'][number]
export type MemberBalance = GetGroupsGroupIdBalancesQueryResult['memberBalances'][number]
export type Transfer = GetGroupsGroupIdBalancesQueryResult['transfers'][number]
export type Expense = GetGroupsGroupIdExpensesQueryResult['expenses'][number]
export type Settlement = GetGroupsGroupIdSettlementsQueryResult['settlements'][number]
