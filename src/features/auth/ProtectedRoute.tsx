import { Navigate, Outlet } from 'react-router'
import { getToken } from './auth-store'

export function ProtectedRoute() {
  return getToken() ? <Outlet /> : <Navigate to="/login" replace />
}
