import { ChevronLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { cn } from '@/lib/utils'

interface GroupHeaderProps {
  name: string
  description?: string
  connected: boolean
  actions?: ReactNode
}

export function GroupHeader({ name, description, connected, actions }: GroupHeaderProps) {
  return (
    <div className="grid gap-3">
      <Link to="/groups" className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft aria-hidden="true" className="size-4" />
        Grupos
      </Link>
      <div className="flex flex-wrap items-start gap-4">
        <div className="mr-auto grid gap-1">
          <h1 className="text-2xl font-semibold">{name}</h1>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
        <p role="status" className="flex items-center gap-2 self-center text-xs text-muted-foreground">
          <span aria-hidden="true" className={cn('size-2 rounded-full', connected ? 'bg-positive' : 'bg-settled')} />
          {connected ? 'ao vivo' : 'reconectando…'}
        </p>
        {actions}
      </div>
    </div>
  )
}
