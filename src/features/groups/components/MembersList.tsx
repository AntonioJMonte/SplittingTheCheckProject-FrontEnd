import type { GroupMember } from '@/api/types'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { AddMemberForm } from './AddMemberForm'

interface MembersListProps {
  groupId: string
  members: GroupMember[]
  myUserId: string | undefined
}

export function MembersList({ groupId, members, myUserId }: MembersListProps) {
  const iAmOwner = members.some((member) => member.userId === myUserId && member.role === 'OWNER')

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <section aria-labelledby="members-title" className="grid gap-2 p-4">
        <h2 id="members-title" className="text-base font-semibold">
          Membros
        </h2>
        <ul className="-mx-4 divide-y">
          {members.map((member) => (
            <li key={member.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3">
              <span className="font-medium">{member.name}</span>
              {member.userId === myUserId ? <span className="text-xs text-muted-foreground">você</span> : null}
              <span className="text-sm text-muted-foreground">{member.email}</span>
              {member.role === 'OWNER' ? (
                <Badge variant="outline" className="ml-auto">
                  dono
                </Badge>
              ) : null}
            </li>
          ))}
        </ul>
        {members.length === 1 ? (
          <p className="text-sm text-muted-foreground">Adicione alguém pelo email para dividir despesas.</p>
        ) : null}
      </section>
      {iAmOwner ? (
        <div className="border-t p-4">
          <AddMemberForm groupId={groupId} />
        </div>
      ) : null}
    </Card>
  )
}
