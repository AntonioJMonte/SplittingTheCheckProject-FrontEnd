import { expect, it, vi } from 'vitest'
import { socket } from '@/realtime/socket'

it('troca o socket real por um dublê, para nenhum teste abrir conexão com o back de dev', () => {
  expect(vi.isMockFunction(socket.connect)).toBe(true)
  expect(socket.connected).toBe(false)
})
