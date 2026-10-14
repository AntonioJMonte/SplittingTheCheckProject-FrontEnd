import { expect, it } from 'vitest'
import { api } from '@/api/http-client'

it('bloqueia requisições reais nos testes, para nenhum teste falar com o back de dev', async () => {
  await expect(api.get('/users/me')).rejects.toMatchObject({ code: 'ERR_NETWORK', message: expect.stringContaining('bloqueada') })
})
