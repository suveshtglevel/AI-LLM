import api from './api'
import type { ApiResponse, ProviderConfig, CreateProviderInput, UpdateProviderInput } from '@/types'

export const providerConfigService = {
  async listConfigs() {
    const res = await api.get<ApiResponse<ProviderConfig[]>>('/providers/configs')
    return res.data
  },

  async getConfig(name: string) {
    const res = await api.get<ApiResponse<ProviderConfig>>(`/providers/configs/${name}`)
    return res.data
  },

  async createConfig(data: CreateProviderInput) {
    const res = await api.post<ApiResponse<ProviderConfig>>('/providers/configs', data)
    return res.data
  },

  async updateConfig(name: string, data: UpdateProviderInput) {
    const res = await api.put<ApiResponse<ProviderConfig>>(`/providers/configs/${name}`, data)
    return res.data
  },

  async deleteConfig(name: string) {
    const res = await api.delete<ApiResponse<{ message: string }>>(`/providers/configs/${name}`)
    return res.data
  },

  async addApiKey(name: string, key: string) {
    const res = await api.post<ApiResponse<ProviderConfig>>(`/providers/configs/${name}/keys`, { key })
    return res.data
  },

  async deleteApiKey(name: string, keyId: string) {
    const res = await api.delete<ApiResponse<ProviderConfig>>(`/providers/configs/${name}/keys/${keyId}`)
    return res.data
  },

  async testConnection(name: string) {
    const res = await api.post<ApiResponse<{ latency: number; message: string }>>(`/providers/configs/${name}/test`)
    return res.data
  },
}
