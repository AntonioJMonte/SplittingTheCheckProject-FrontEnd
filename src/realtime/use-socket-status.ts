import { useSyncExternalStore } from 'react'
import { socket } from './socket'

function subscribe(onChange: () => void) {
  socket.on('connect', onChange)
  socket.on('disconnect', onChange)
  return () => {
    socket.off('connect', onChange)
    socket.off('disconnect', onChange)
  }
}

export const useSocketConnected = (): boolean => useSyncExternalStore(subscribe, () => socket.connected)
