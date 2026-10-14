import { LogOut } from 'lucide-react'
import { useEffect } from 'react'
import { Link, Outlet } from 'react-router'
import { useGetUsersMe } from '@/api/generated/endpoints/users/users'
import { Button } from '@/components/ui/button'
import { useLogout } from '@/features/auth/use-logout'
import { PixKeyDialog } from '@/features/profile/components/PixKeyDialog'
import { toApiError } from '@/lib/api-error'

export function AppLayout() {
  const me = useGetUsersMe()
  const logout = useLogout()
  const userGone = me.isError && toApiError(me.error).status === 404

  // Token válido de um usuário que não existe mais (spec 2.2).
  useEffect(() => {
    if (userGone) void logout()
  }, [userGone, logout])

  return (
    <div className="min-h-svh">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-2 px-4">
          <Link to="/groups" className="mr-auto text-2xl font-semibold">
            splittr
          </Link>
          {me.data ? <span className="hidden text-sm font-medium sm:inline">{me.data.user.name}</span> : null}
          <PixKeyDialog />
          <Button variant="ghost" onClick={() => void logout()}>
            <LogOut aria-hidden="true" />
            Sair
          </Button>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
