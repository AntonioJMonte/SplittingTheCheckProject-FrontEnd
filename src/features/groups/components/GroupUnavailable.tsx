import { Link } from 'react-router'
import { SectionError } from '@/components/section-error'
import { toApiError } from '@/lib/api-error'

export function GroupUnavailable({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const { status, message } = toApiError(error)
  const title =
    status === 403 ? 'Você não faz parte deste grupo.' : status === 404 || status === 400 ? 'Grupo não encontrado.' : null

  if (title === null) return <SectionError message={message} onRetry={onRetry} />
  return (
    <div className="grid gap-3">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <Link to="/groups" className="w-fit text-sm font-medium text-primary underline-offset-4 hover:underline">
        Voltar para seus grupos
      </Link>
    </div>
  )
}
