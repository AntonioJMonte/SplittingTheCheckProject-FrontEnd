import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { getGetUsersMeQueryKey, useGetUsersMe, usePatchUsersPixKey } from '@/api/generated/endpoints/users/users'
import { FormField } from '@/components/form-field'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { fieldsNamed, reportFormError } from '@/lib/form-errors'
import { type PixKeyValues, pixKeySchema } from '../schemas'

export function PixKeyDialog() {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const me = useGetUsersMe()
  const updatePixKey = usePatchUsersPixKey()
  const current = me.data?.user.pixKey ?? ''
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<PixKeyValues>({ resolver: zodResolver(pixKeySchema), values: { pixKey: current } })

  async function save(pixKey: string | null) {
    try {
      await updatePixKey.mutateAsync({ data: { pixKey } })
      toast.success(pixKey ? 'Chave Pix salva' : 'Chave Pix removida')
      await queryClient.invalidateQueries({ queryKey: getGetUsersMeQueryKey() })
      // Só fecha: a prop `values` já leva o formulário à chave nova, e um reset aqui usaria a chave antiga.
      setOpen(false)
    } catch (error) {
      const message = reportFormError(error, setError, fieldsNamed<PixKeyValues>('pixKey'))
      if (message) setError('pixKey', { type: 'server', message })
    }
  }

  // O cabeçalho nunca desmonta: ao fechar, o formulário volta para a chave salva, sem rascunho nem erro antigo.
  function changeOpen(next: boolean) {
    setOpen(next)
    if (!next) reset({ pixKey: current })
  }

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost">
          Chave Pix
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Minha chave Pix</DialogTitle>
          <DialogDescription>Quem te pagar num acerto recebe um código Pix copia-e-cola com esta chave.</DialogDescription>
        </DialogHeader>
        <form noValidate onSubmit={handleSubmit(({ pixKey }) => save(pixKey))} className="grid gap-4">
          <FormField label="Chave Pix" htmlFor="pix-key" hint="Email, telefone, CPF ou chave aleatória." error={errors.pixKey?.message}>
            <Input id="pix-key" autoComplete="off" aria-invalid={Boolean(errors.pixKey)} {...register('pixKey')} />
          </FormField>
          <DialogFooter className="sm:justify-between">
            {current ? (
              <Button
                type="button"
                variant="ghost"
                className="text-destructive"
                disabled={updatePixKey.isPending}
                onClick={() => void save(null)}
              >
                Remover chave
              </Button>
            ) : (
              <span />
            )}
            <Button type="submit" disabled={updatePixKey.isPending}>
              {updatePixKey.isPending ? 'Salvando…' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
