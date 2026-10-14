import { cleanup } from '@testing-library/react'
import Axios, { AxiosError } from 'axios'
import { afterEach } from 'vitest'
import '@testing-library/jest-dom/vitest'

// Nenhum teste fala com o back de dev: o `.env.local` aponta para localhost:3333. Como o setup roda antes dos módulos
// do app, a instância `api` (criada com Axios.create) herda este adaptador.
Axios.defaults.adapter = async (config) => {
  throw new AxiosError(`Requisição real bloqueada nos testes: ${config.method?.toUpperCase()} ${config.url}`, 'ERR_NETWORK', config)
}

afterEach(() => {
  cleanup()
  localStorage.clear()
})
