import type { QueryClient } from '@tanstack/react-query'

// As query keys do orval começam pela URL; tudo sob /groups/:id é do grupo.
export function isGroupQueryKey(queryKey: readonly unknown[], groupId: string): boolean {
  const [url] = queryKey
  const base = `/groups/${groupId}`
  return typeof url === 'string' && (url === base || url.startsWith(`${base}/`))
}

export function invalidateGroupQueries(queryClient: QueryClient, groupId: string): Promise<void> {
  return queryClient.invalidateQueries({ predicate: (query) => isGroupQueryKey(query.queryKey, groupId) })
}
