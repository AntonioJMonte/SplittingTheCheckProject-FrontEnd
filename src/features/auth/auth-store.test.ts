import { describe, expect, it } from 'vitest'
import { clearToken, getToken, setToken } from './auth-store'

describe('auth-store', () => {
  it('devolve null quando não há sessão', () => {
    expect(getToken()).toBeNull()
  })

  it('guarda o token sob uma chave própria do splittr', () => {
    setToken('abc.def.ghi')

    expect(getToken()).toBe('abc.def.ghi')
    expect(localStorage.getItem('splittr:token')).toBe('abc.def.ghi')
  })

  it('substitui o token anterior quando a sessão é renovada', () => {
    setToken('velho')
    setToken('novo')

    expect(getToken()).toBe('novo')
  })

  it('apaga só o token do splittr ao sair', () => {
    localStorage.setItem('outra-app', 'x')
    setToken('abc')

    clearToken()

    expect(getToken()).toBeNull()
    expect(localStorage.getItem('outra-app')).toBe('x')
  })
})
