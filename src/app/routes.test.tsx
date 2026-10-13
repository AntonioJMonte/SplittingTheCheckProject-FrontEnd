import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'
import { setToken } from '@/features/auth/auth-store'
import { routes } from './routes'

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(<RouterProvider router={router} />)
  return router
}

describe('rotas (spec 2.1)', () => {
  it.each(['/', '/qualquer/coisa'])('redireciona %s para /groups quando há sessão', async (path) => {
    setToken('t')
    const router = renderAt(path)

    expect(await screen.findByRole('heading', { name: 'Seus grupos' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/groups')
  })

  it('leva ao login quem abre / sem sessão', async () => {
    const router = renderAt('/')

    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
  })

  it('abre o detalhe do grupo pelo id da URL', async () => {
    setToken('t')
    renderAt('/groups/abc')

    expect(await screen.findByRole('heading', { name: 'Grupo' })).toBeInTheDocument()
  })

  it('leva aos grupos quem já está logado e abre o cadastro', async () => {
    setToken('t')
    const router = renderAt('/register')

    expect(await screen.findByRole('heading', { name: 'Seus grupos' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/groups')
  })
})
