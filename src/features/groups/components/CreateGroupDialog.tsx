import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { getGetGroupsQueryKey, usePostGroups } from '@/api/generated/endpoints/groups/groups'
import { FormAlert, FormField } from '@/components/form-field'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { fieldsNamed, reportFormError } from '@/lib/form-errors'
import { type CreateGroupValues, createGroupSchema } from '../schemas'

export function CreateGroupDialog() {
  const [open, setOpen] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const createGroup = usePostGroups()
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateGroupValues>({ resolver: zodResolver(createGroupSchema), defaultValues: { name: '', description: '' } })

  function close() {
    setOpen(false)
    reset()
    setFormError(null)
  }

  function changeOpen(next: boolean) {
    if (next) setOpen(true)
    // Fechar no meio do envio deixaria a resposta chegar num formulário já limpo.
    else if (!isSubmitting) close()
  }

  const onSubmit = handleSubmit(async ({ name, description }) => {
    setFormError(null)
    try {
      const { group } = await createGroup.mutateAsync({ data: { name, ...(description ? { description } : {}) } })
      toast.success('Grupo criado')
      void queryClient.invalidateQueries({ queryKey: getGetGroupsQueryKey() })
      close()
      navigate(`/groups/${group.id}`)
    } catch (error) {
      setFormError(reportFormError(error, setError, fieldsNamed<CreateGroupValues>('name', 'description')))
    }
  })

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger asChild>
        <Button>Criar grupo</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo grupo</DialogTitle>
          <DialogDescription>Depois de criar, adicione as pessoas pelo email ou telefone.</DialogDescription>
        </DialogHeader>
        <form noValidate onSubmit={onSubmit} className="grid gap-4">
          <FormAlert message={formError} />
          <FormField label="Nome" htmlFor="group-name" error={errors.name?.message}>
            <Input id="group-name" aria-invalid={Boolean(errors.name)} {...register('name')} />
          </FormField>
          <FormField label="Descrição" htmlFor="group-description" hint="Opcional." error={errors.description?.message}>
            <Input id="group-description" {...register('description')} />
          </FormField>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando…' : 'Criar grupo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
