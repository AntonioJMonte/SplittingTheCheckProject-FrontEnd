import { io } from 'socket.io-client'
import { refreshSession } from '@/api/refresh-session'
import { getToken } from '@/features/auth/auth-store'
import { expireSession } from '@/features/auth/session-expired'
import { installSocketAuthRecovery } from './socket-auth'

export const socket = io(import.meta.env.VITE_WS_URL, {
  autoConnect: false,
  auth: (cb) => cb({ token: getToken() }),
})

installSocketAuthRecovery(socket, { refresh: refreshSession, onSessionExpired: expireSession })
