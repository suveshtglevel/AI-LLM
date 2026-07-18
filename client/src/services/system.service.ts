import api from './api'
import type { ApiResponse, SystemStatus, ProvidersResponse, Tool, Workflow } from '@/types'

export const systemService = {
  async getStatus() {
    const res = await api.get<ApiResponse<SystemStatus>>('/system/status')
    return res.data
  },

  async getProviders() {
    const res = await api.get<ApiResponse<ProvidersResponse>>('/providers')
    return res.data
  },

  async getTools() {
    const res = await api.get<ApiResponse<Tool[]>>('/tools')
    return res.data
  },

  async getWorkflows() {
    const res = await api.get<ApiResponse<Workflow[]>>('/workflows')
    return res.data
  },
}
