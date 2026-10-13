import { Navigate, Outlet } from 'react-router'
import { getToken } from './auth-store'

export function GuestRoute() {
  return getToken() ? <Navigate to="/groups" replace /> : <Outlet />
}
