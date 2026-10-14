import { z } from 'zod'

export const createGroupSchema = z.object({
  name: z.string().trim().min(1, 'Dê um nome ao grupo.'),
  description: z.string().trim(),
})
export type CreateGroupValues = z.infer<typeof createGroupSchema>

export const addMemberSchema = z
  .object({
    kind: z.enum(['email', 'phone']),
    contact: z.string().trim().min(1, 'Informe o contato.'),
  })
  .superRefine((values, ctx) => {
    if (values.kind === 'email' && !z.email().safeParse(values.contact).success) {
      ctx.addIssue({ code: 'custom', path: ['contact'], message: 'Informe um email válido.' })
    }
  })
export type AddMemberValues = z.infer<typeof addMemberSchema>

export function toAddMemberBody({ kind, contact }: AddMemberValues): { email: string } | { phone: string } {
  return kind === 'email' ? { email: contact } : { phone: contact }
}
