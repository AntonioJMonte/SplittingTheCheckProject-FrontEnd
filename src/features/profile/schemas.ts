import { z } from 'zod'

export const pixKeySchema = z.object({
  pixKey: z.string().trim().min(1, 'Informe a chave Pix.'),
})
export type PixKeyValues = z.infer<typeof pixKeySchema>
