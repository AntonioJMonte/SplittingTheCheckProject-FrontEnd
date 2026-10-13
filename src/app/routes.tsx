import { Navigate, type RouteObject } from 'react-router'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { RegisterPage } from '@/features/auth/pages/RegisterPage'
import { GroupDetailPage } from '@/features/groups/pages/GroupDetailPage'
import { GroupsPage } from '@/features/groups/pages/GroupsPage'

export const routes: RouteObject[] = [
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/groups', element: <GroupsPage /> },
  { path: '/groups/:groupId', element: <GroupDetailPage /> },
  { path: '*', element: <Navigate to="/groups" replace /> },
]
