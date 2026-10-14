import { Navigate, type RouteObject } from 'react-router'
import { AppLayout } from '@/app/AppLayout'
import { GuestRoute } from '@/features/auth/GuestRoute'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { RegisterPage } from '@/features/auth/pages/RegisterPage'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { GroupDetailPage } from '@/features/groups/pages/GroupDetailPage'
import { GroupsPage } from '@/features/groups/pages/GroupsPage'

export const routes: RouteObject[] = [
  {
    element: <GuestRoute />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/groups', element: <GroupsPage /> },
          { path: '/groups/:groupId', element: <GroupDetailPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/groups" replace /> },
]
