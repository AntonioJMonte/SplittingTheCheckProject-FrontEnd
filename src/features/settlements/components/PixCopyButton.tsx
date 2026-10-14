import { Check, Copy } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export function PixCopyButton({ code }: { code: string }) {
  const fieldRef = useRef<HTMLTextAreaElement>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [copied])

  async function copy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
    } catch {
      // Sem permissão ou fora de HTTPS: o código fica selecionado para copiar à mão.
      fieldRef.current?.select()
      toast.error('Não foi possível copiar. Selecione o código e copie manualmente.')
    }
  }

  return (
    <div className="grid gap-2">
      <Label htmlFor="pix-code">Código Pix copia-e-cola</Label>
      <Textarea id="pix-code" ref={fieldRef} readOnly rows={4} value={code} className="resize-none bg-muted text-sm break-all" />
      <Button type="button" className="w-full" onClick={() => void copy()}>
        {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
        {copied ? 'Copiado!' : 'Copiar código Pix'}
      </Button>
    </div>
  )
}
