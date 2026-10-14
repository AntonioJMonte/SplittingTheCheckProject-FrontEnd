import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router'
import { usePostAuth } from '@/api/generated/endpoints/auth/auth'
import { FormAlert, FormField } from '@/components/form-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { fieldsNamed, reportFormError } from '@/lib/form-errors'
import { setToken } from '../auth-store'
import { AuthLayout } from '../components/AuthLayout'
import { type LoginValues, loginSchema } from '../schemas'

export function LoginPage() {
  const navigate = useNavigate()
  const notice = (useLocation().state as { notice?: string } | null)?.notice
  const login = usePostAuth()
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      const { accessToken } = await login.mutateAsync({ data: values })
      setToken(accessToken)
      navigate('/groups', { replace: true })
    } catch (error) {
      setFormError(reportFormError(error, setError, fieldsNamed<LoginValues>('email', 'password')))
    }
  })

  return (
    <AuthLayout>
      <form noValidate onSubmit={onSubmit} className="grid gap-4">
        <h1 className="text-base font-semibold">Entrar</h1>
        {notice ? (
          <p role="status" className="text-sm">
            {notice}
          </p>
        ) : null}
        <FormAlert message={formError} />
        <FormField label="Email" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" aria-invalid={Boolean(errors.email)} {...register('email')} />
        </FormField>
        <FormField label="Senha" htmlFor="password" error={errors.password?.message}>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            aria-invalid={Boolean(errors.password)}
            {...register('password')}
          />
        </FormField>
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Entrando…' : 'Entrar'}
        </Button>
        <p className="text-sm text-muted-foreground">
          Não tem conta?{' '}
          <Link to="/register" className="font-medium text-primary underline-offset-4 hover:underline">
            Criar conta
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
