import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { authService } from '@/services/auth.service'
import { useAuthStore } from '@/store/auth.store'
import type { LoginInput, RegisterInput } from '@/types'

const DEV_EMAIL = 'suveshpagam07@gmail.com'
const DEV_PASSWORD = 'suvesh@123'

export function useLogin() {
  const setUser = useAuthStore((s) => s.setUser)
  const navigate = useNavigate()

  return useMutation({
    mutationFn: async (data: LoginInput) => {
      // Try real API first
      try {
        const response = await authService.login(data)
        return response
      } catch (error) {
        // If backend is not available, fall back to dev mode
        if (data.email === DEV_EMAIL && data.password === DEV_PASSWORD) {
          return {
            success: true,
            data: {
              user: {
                id: 'dev-user',
                email: DEV_EMAIL,
                name: 'Suvesh Pagam',
                role: 'admin' as const,
                createdAt: new Date().toISOString(),
              },
              accessToken: 'dev-access-token',
              refreshToken: 'dev-refresh-token',
              expiresIn: 86400,
            },
          }
        }
        throw error
      }
    },
    onSuccess: (response) => {
      const { user, accessToken, refreshToken } = response.data
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
      setUser(user)
      navigate('/')
    },
  })
}

export function useRegister() {
  const setUser = useAuthStore((s) => s.setUser)
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (data: RegisterInput) => authService.register(data),
    onSuccess: (response) => {
      const { user, accessToken, refreshToken } = response.data
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
      setUser(user)
      navigate('/')
    },
  })
}

export function useLogout() {
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  return () => {
    logout()
    navigate('/login')
  }
}
