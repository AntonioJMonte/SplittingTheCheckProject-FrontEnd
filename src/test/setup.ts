import { cleanup } from '@testing-library/react'
import Axios, { AxiosError } from 'axios'
import { afterEach, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'

// Nenhum teste fala com o back de dev: o `.env.local` aponta para localhost:3333. Como o setup roda antes dos módulos
// do app, a instância `api` (criada com Axios.create) herda este adaptador.
Axios.defaults.adapter = async (config) => {
  throw new AxiosError(`Requisição real bloqueada nos testes: ${config.method?.toUpperCase()} ${config.url}`, 'ERR_NETWORK', config)
}

// Nem o socket: telas montadas em teste (o detalhe do grupo) chamariam connect() no socket real. Testes que precisam
// controlar o socket trocam este dublê pelo próprio com vi.mock.
vi.mock('@/realtime/socket', () => ({
  socket: { connected: false, active: false, connect: vi.fn(), disconnect: vi.fn(), emit: vi.fn(), on: vi.fn(), off: vi.fn() },
}))

afterEach(() => {
  cleanup()
  localStorage.clear()
})
