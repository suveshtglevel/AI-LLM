import api from './api'
import type { ApiResponse, ExecutionModeSettings, ExecutionMode } from '@/types'

export const settingsService = {
  async getExecutionMode() {
    const res = await api.get<ApiResponse<ExecutionModeSettings>>('/settings/execution-mode')
    return res.data
  },

  async updateExecutionMode(executionMode: ExecutionMode) {
    const res = await api.patch<ApiResponse<ExecutionModeSettings>>('/settings/execution-mode', { executionMode })
    return res.data
  },
}
