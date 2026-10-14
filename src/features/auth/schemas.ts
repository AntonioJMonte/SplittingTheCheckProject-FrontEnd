import { z } from 'zod'

export const loginSchema = z.object({
  email: z.email('Informe um email válido.'),
  password: z.string().min(6, 'A senha tem pelo menos 6 caracteres.'),
})
export type LoginValues = z.infer<typeof loginSchema>

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'Informe seu nome.'),
  email: z.email('Informe um email válido.'),
  password: z.string().min(6, 'Use pelo menos 6 caracteres.'),
  phone: z.string().trim(),
})
export type RegisterValues = z.infer<typeof registerSchema>
