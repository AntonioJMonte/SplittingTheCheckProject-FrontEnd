import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import { toast } from 'sonner'
import { toApiError } from './api-error'

/**
 * Leva o erro da API ao formulário (spec 2.3): issues vão para os campos, rede e 5xx viram toast, e o que não tem
 * campo volta como mensagem para o topo do formulário. `ruleErrorField` recebe o 400 de regra (sem issues) quando a
 * tela sabe de que campo ele vem, como o telefone inválido do cadastro.
 */
export function reportFormError<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  resolveField: (path: string) => Path<T> | null,
  ruleErrorField?: Path<T>,
): string | null {
  const apiError = toApiError(error)
  if (apiError.status === null || apiError.status >= 500) {
    toast.error(apiError.message)
    return null
  }
  if (apiError.issues.length === 0) {
    if (apiError.status === 400 && ruleErrorField) {
      setError(ruleErrorField, { type: 'server', message: apiError.message })
      return null
    }
    return apiError.message
  }

  const unmapped: string[] = []
  for (const issue of apiError.issues) {
    const field = resolveField(issue.path)
    if (field) setError(field, { type: 'server', message: issue.message })
    else unmapped.push(issue.message)
  }
  return unmapped.length > 0 ? unmapped.join(' ') : null
}

export function fieldsNamed<T extends FieldValues>(...names: Path<T>[]): (path: string) => Path<T> | null {
  return (path) => names.find((name) => name === path) ?? null
}
