import { render, screen } from '@testing-library/react'
import { AxiosError } from 'axios'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { GroupsPage } from './GroupsPage'

const groupsQuery = vi.hoisted(() => ({ current: {} as Record<string, unknown> }))

vi.mock('@/api/generated/endpoints/groups/groups', () => ({
  useGetGroups: () => groupsQuery.current,
  usePostGroups: () => ({ mutateAsync: vi.fn() }),
  getGetGroupsQueryKey: () => ['/groups'],
}))
vi.mock('@tanstack/react-query', async (original) => ({
  ...(await original<typeof import('@tanstack/react-query')>()),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}))

describe('GroupsPage', () => {
  it('mantém a lista na tela quando um refetch em segundo plano falha', () => {
    groupsQuery.current = {
      data: { groups: [{ id: 'g1', name: 'Viagem', currency: 'BRL' }] },
      isPending: false,
      isError: true,
      error: new AxiosError('Network Error', 'ERR_NETWORK'),
      refetch: vi.fn(),
    }

    render(<GroupsPage />, { wrapper: MemoryRouter })

    expect(screen.getByText('Viagem')).toBeInTheDocument()
    expect(screen.queryByText('Tentar de novo')).not.toBeInTheDocument()
  })
})
