import { describe, expect, it } from 'vitest'
import type { GroupMember } from '@/api/types'
import { FORMER_MEMBER, findMyMember, memberName, nameByUserId, transferAction, transferKey } from './group-view'

const members = [
  { id: 'm-ana', userId: 'u-ana', name: 'Ana', email: 'ana@example.com', role: 'OWNER', joinedAt: '2026-10-01T00:00:00.000Z' },
  { id: 'm-bruno', userId: 'u-bruno', name: 'Bruno', email: 'bruno@example.com', role: 'MEMBER', joinedAt: '2026-10-02T00:00:00.000Z' },
] as GroupMember[]

describe('nomes', () => {
  it('acha o nome pelo membro e pelo usuário', () => {
    expect(memberName(members, 'm-bruno')).toBe('Bruno')
    expect(nameByUserId(members, 'u-ana')).toBe('Ana')
  })

  it('chama de ex-membro quem já saiu do grupo', () => {
    expect(memberName(members, 'm-saiu')).toBe(FORMER_MEMBER)
    expect(nameByUserId(members, 'u-saiu')).toBe(FORMER_MEMBER)
  })

  it('acha o meu membro pelo meu usuário', () => {
    expect(findMyMember(members, 'u-bruno')?.id).toBe('m-bruno')
    expect(findMyMember(members, undefined)).toBeUndefined()
  })
})

describe('transferAction', () => {
  const bruno2ana = { fromMemberId: 'm-bruno', toMemberId: 'm-ana' }

  it('oferece Pagar só para quem deve', () => {
    expect(transferAction(bruno2ana, 'm-bruno', [])).toBe('pay')
    expect(transferAction(bruno2ana, 'm-ana', [])).toBe('none')
    expect(transferAction(bruno2ana, undefined, [])).toBe('none')
  })

  it('mostra aguardando quando já existe acerto pendente do mesmo par', () => {
    expect(transferAction(bruno2ana, 'm-bruno', [bruno2ana])).toBe('awaiting')
    expect(transferAction(bruno2ana, 'm-ana', [bruno2ana])).toBe('awaiting')
  })

  it('não confunde com o par invertido', () => {
    expect(transferAction(bruno2ana, 'm-bruno', [{ fromMemberId: 'm-ana', toMemberId: 'm-bruno' }])).toBe('pay')
  })

  it('gera uma chave estável por par', () => {
    expect(transferKey(bruno2ana)).toBe('m-bruno->m-ana')
  })
})
