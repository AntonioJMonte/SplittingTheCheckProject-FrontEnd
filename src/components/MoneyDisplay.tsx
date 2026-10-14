import { formatBRL, splitBRL } from '@/lib/money'
import { cn } from '@/lib/utils'

interface MoneyDisplayProps {
  amount: string
  size: 'md' | 'lg'
  className?: string
}

const SIZE = { md: 'text-2xl', lg: 'text-4xl tracking-tight' } satisfies Record<MoneyDisplayProps['size'], string>

/** Etiqueta de preço (DESIGN 5.2): "R$" pequeno e centavos elevados. Recebe valor sem sinal. */
export function MoneyDisplay({ amount, size, className }: MoneyDisplayProps) {
  const { symbol, integer, cents } = splitBRL(amount)
  return (
    <span className={cn('inline-flex items-start leading-none font-medium tabular-nums', SIZE[size], className)}>
      <span className="sr-only">{formatBRL(amount)}</span>
      <span aria-hidden="true" className="mr-[0.15em] text-[0.5em] font-normal text-muted-foreground">
        {symbol}
      </span>
      <span aria-hidden="true">{integer}</span>
      <span aria-hidden="true" className="text-[0.55em]">
        ,{cents}
      </span>
    </span>
  )
}
