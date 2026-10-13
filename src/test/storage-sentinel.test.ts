import { expect, it } from 'vitest'

it('jsdom localStorage guarda e devolve valores', () => {
  localStorage.setItem('k', 'v')
  expect(localStorage.getItem('k')).toBe('v')
})
