import { io, Socket } from 'socket.io-client'
import { API_BASE_URL } from '@/utils/constants'

let socket: Socket | null = null

export const getSocket = (): Socket => {
  if (!socket) {
    const baseUrl = API_BASE_URL.replace('/api', '')
    socket = io(baseUrl, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
    })
  }
  return socket
}

export const connectSocket = () => {
  const s = getSocket()
  const token = localStorage.getItem('accessToken')
  if (token) {
    s.auth = { token }
  }
  if (!s.connected) {
    s.connect()
  }
  return s
}

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export const subscribeToEvent = (event: string, callback: (...args: unknown[]) => void) => {
  const s = getSocket()
  s.on(event, callback)
  return () => {
    s.off(event, callback)
  }
}
