import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { usePostAuth, usePostRegister } from '@/api/generated/endpoints/auth/auth'
import { FormAlert, FormField } from '@/components/form-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { fieldsNamed, reportFormError } from '@/lib/form-errors'
import { setToken } from '../auth-store'
import { AuthLayout } from '../components/AuthLayout'
import { type RegisterValues, registerSchema } from '../schemas'

export function RegisterPage() {
  const navigate = useNavigate()
  const registerUser = usePostRegister()
  const login = usePostAuth()
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', phone: '' },
  })

  const onSubmit = handleSubmit(async ({ name, email, password, phone }) => {
    setFormError(null)
    try {
      await registerUser.mutateAsync({ data: { name, email, password, ...(phone ? { phone } : {}) } })
    } catch (error) {
      setFormError(reportFormError(error, setError, fieldsNamed<RegisterValues>('name', 'email', 'password', 'phone')))
      return
    }
    try {
      const { accessToken } = await login.mutateAsync({ data: { email, password } })
      setToken(accessToken)
      navigate('/groups', { replace: true })
    } catch {
      navigate('/login', { replace: true, state: { notice: 'Conta criada. Entre com seu email e senha.' } })
    }
  })

  return (
    <AuthLayout>
      <form noValidate onSubmit={onSubmit} className="grid gap-4">
        <h1 className="text-base font-semibold">Criar conta</h1>
        <FormAlert message={formError} />
        <FormField label="Nome" htmlFor="name" error={errors.name?.message}>
          <Input id="name" autoComplete="name" aria-invalid={Boolean(errors.name)} {...register('name')} />
        </FormField>
        <FormField label="Email" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" aria-invalid={Boolean(errors.email)} {...register('email')} />
        </FormField>
        <FormField label="Senha" htmlFor="password" hint="Pelo menos 6 caracteres." error={errors.password?.message}>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.password)}
            {...register('password')}
          />
        </FormField>
        <FormField
          label="Telefone"
          htmlFor="phone"
          hint="Opcional. Permite que te adicionem a grupos pelo número."
          error={errors.phone?.message}
        >
          <Input id="phone" type="tel" autoComplete="tel" aria-invalid={Boolean(errors.phone)} {...register('phone')} />
        </FormField>
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Criando conta…' : 'Criar conta'}
        </Button>
        <p className="text-sm text-muted-foreground">
          Já tem conta?{' '}
          <Link to="/login" className="font-medium text-primary underline-offset-4 hover:underline">
            Entrar
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
