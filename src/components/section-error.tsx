import { Button } from '@/components/ui/button'

export function SectionError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="grid gap-3 p-4">
      <p className="text-sm">{message}</p>
      <div>
        <Button variant="outline" size="sm" onClick={onRetry}>
          Tentar de novo
        </Button>
      </div>
    </div>
  )
}
