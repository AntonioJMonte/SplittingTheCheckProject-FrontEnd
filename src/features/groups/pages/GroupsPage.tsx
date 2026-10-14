import { Link } from 'react-router'
import { useGetGroups } from '@/api/generated/endpoints/groups/groups'
import { SectionError } from '@/components/section-error'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { toApiError } from '@/lib/api-error'
import { CreateGroupDialog } from '../components/CreateGroupDialog'

function GroupsContent() {
  const { data, isPending, isError, error, refetch } = useGetGroups()

  if (isPending) {
    return (
      <ul className="divide-y">
        {[0, 1, 2].map((row) => (
          <li key={row} className="grid gap-2 p-4">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-64" />
          </li>
        ))}
      </ul>
    )
  }
  // Um refetch em segundo plano que falha mantém `data`: a lista já carregada continua na tela.
  if (isError && !data) return <SectionError message={toApiError(error).message} onRetry={() => void refetch()} />
  if (data.groups.length === 0) {
    return (
      <div className="grid gap-3 p-4">
        <p className="max-w-prose text-sm">
          Você ainda não participa de nenhum grupo. Crie um ou peça para alguém te adicionar pelo seu email.
        </p>
        <div>
          <CreateGroupDialog />
        </div>
      </div>
    )
  }
  return (
    <ul className="divide-y">
      {data.groups.map((group) => (
        <li key={group.id}>
          <Link
            to={`/groups/${group.id}`}
            className="block p-4 outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset"
          >
            <span className="block font-medium">{group.name}</span>
            {group.description ? <span className="block text-sm text-muted-foreground">{group.description}</span> : null}
          </Link>
        </li>
      ))}
    </ul>
  )
}

export function GroupsPage() {
  return (
    <div className="grid w-full max-w-2xl gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Seus grupos</h1>
        <CreateGroupDialog />
      </div>
      <Card className="gap-0 overflow-hidden py-0">
        <GroupsContent />
      </Card>
    </div>
  )
}
