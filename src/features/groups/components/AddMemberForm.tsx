import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { usePostGroupsGroupIdMembers } from '@/api/generated/endpoints/groups/groups'
import { FormField } from '@/components/form-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { reportFormError } from '@/lib/form-errors'
import { invalidateGroupQueries } from '@/lib/invalidate-group'
import { type AddMemberValues, addMemberSchema, toAddMemberBody } from '../schemas'

export function AddMemberForm({ groupId }: { groupId: string }) {
  const queryClient = useQueryClient()
  const addMember = usePostGroupsGroupIdMembers()
  const {
    register,
    handleSubmit,
    setError,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<AddMemberValues>({ resolver: zodResolver(addMemberSchema), defaultValues: { kind: 'email', contact: '' } })
  const kind = useWatch({ control, name: 'kind' })

  const onSubmit = handleSubmit(async (values) => {
    try {
      await addMember.mutateAsync({ groupId, data: toAddMemberBody(values) })
      toast.success('Membro adicionado')
      reset({ kind: values.kind, contact: '' })
      void invalidateGroupQueries(queryClient, groupId)
    } catch (error) {
      // 404 (ninguém com esse contato) e 400 (já é membro) também ficam no campo (spec, Tela 3).
      const message = reportFormError(error, setError, (path) => (path === 'email' || path === 'phone' ? 'contact' : null))
      if (message) setError('contact', { type: 'server', message })
    }
  })

  return (
    <form noValidate onSubmit={onSubmit} className="grid gap-3">
      <h3 className="text-sm font-medium">Adicionar membro</h3>
      <fieldset className="flex gap-4 text-sm">
        <legend className="sr-only">Buscar por</legend>
        <label className="flex items-center gap-2">
          <input type="radio" value="email" className="accent-primary" {...register('kind', { deps: 'contact' })} />
          Email
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" value="phone" className="accent-primary" {...register('kind', { deps: 'contact' })} />
          Telefone
        </label>
      </fieldset>
      <FormField label={kind === 'email' ? 'Email' : 'Telefone'} htmlFor="member-contact" error={errors.contact?.message}>
        <Input
          id="member-contact"
          type={kind === 'email' ? 'email' : 'tel'}
          aria-invalid={Boolean(errors.contact)}
          {...register('contact')}
        />
      </FormField>
      <div className="flex justify-end">
        <Button type="submit" variant="outline" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando…' : 'Adicionar membro'}
        </Button>
      </div>
    </form>
  )
}
