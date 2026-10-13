import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'
import { routes } from './routes'

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(<RouterProvider router={router} />)
  return router
}

describe('rotas (spec 2.1)', () => {
  it.each(['/', '/qualquer/coisa'])('redireciona %s para /groups', async (path) => {
    const router = renderAt(path)

    expect(await screen.findByRole('heading', { name: 'Seus grupos' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/groups')
  })

  it('abre o detalhe do grupo pelo id da URL', async () => {
    renderAt('/groups/abc')

    expect(await screen.findByRole('heading', { name: 'Grupo' })).toBeInTheDocument()
  })

  it('abre o login', async () => {
    renderAt('/login')

    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
  })
})
