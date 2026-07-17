import api from './api'
import type { ApiResponse, AuthResponse, LoginInput, RegisterInput, User } from '@/types'

export const authService = {
  async login(data: LoginInput) {
    const res = await api.post<ApiResponse<AuthResponse>>('/auth/login', data)
    return res.data
  },

  async register(data: RegisterInput) {
    const res = await api.post<ApiResponse<AuthResponse>>('/auth/register', data)
    return res.data
  },

  async refreshToken(refreshToken: string) {
    const res = await api.post<ApiResponse<{ accessToken: string; refreshToken: string }>>('/auth/refresh', { refreshToken })
    return res.data
  },

  async getProfile() {
    const res = await api.get<ApiResponse<User>>('/auth/me')
    return res.data
  },
}
