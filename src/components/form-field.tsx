import { cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react'
import { Label } from '@/components/ui/label'

interface FormFieldProps {
  label: string
  htmlFor: string
  error?: string
  hint?: string
  children: ReactNode
}

type DescribableProps = { 'aria-describedby'?: string; 'aria-invalid'?: boolean }

export function FormField({ label, htmlFor, error, hint, children }: FormFieldProps) {
  const errorId = `${htmlFor}-error`
  const hintId = `${htmlFor}-hint`
  const describedBy = error ? errorId : hint ? hintId : undefined
  // O campo aponta para a mensagem que está na tela, para o leitor de tela ler o motivo do erro (DESIGN 10).
  const field = isValidElement(children)
    ? cloneElement(children as ReactElement<DescribableProps>, {
        'aria-describedby': describedBy,
        'aria-invalid': Boolean(error),
      })
    : children

  return (
    <div className="grid gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {field}
      {error ? (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

export function FormAlert({ message }: { message: string | null | undefined }) {
  return message ? (
    <p role="alert" className="text-sm text-destructive">
      {message}
    </p>
  ) : null
}
