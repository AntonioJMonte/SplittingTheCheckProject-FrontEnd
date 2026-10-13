import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'
import { setToken } from './auth-store'
import { GuestRoute } from './GuestRoute'
import { ProtectedRoute } from './ProtectedRoute'

function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<p>tela de login</p>} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route path="/groups" element={<p>tela de grupos</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('guardas de rota', () => {
  it('manda para o login quem abre uma tela protegida sem sessão', () => {
    renderAt('/groups')
    expect(screen.getByText('tela de login')).toBeInTheDocument()
  })

  it('deixa entrar quem tem sessão', () => {
    setToken('t')
    renderAt('/groups')
    expect(screen.getByText('tela de grupos')).toBeInTheDocument()
  })

  it('manda para os grupos quem já está logado e abre o login', () => {
    setToken('t')
    renderAt('/login')
    expect(screen.getByText('tela de grupos')).toBeInTheDocument()
  })

  it('mostra o login para quem não tem sessão', () => {
    renderAt('/login')
    expect(screen.getByText('tela de login')).toBeInTheDocument()
  })
})
