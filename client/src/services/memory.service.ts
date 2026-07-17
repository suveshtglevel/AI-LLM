import api from './api'
import type { ApiResponse, MemoryStatus, LongMemory, LearningMemory, ExecutionLog, ProjectHistory } from '@/types'

export const memoryService = {
  async getStatus() {
    const res = await api.get<ApiResponse<MemoryStatus>>('/memory/status')
    return res.data
  },

  async getLongMemories(params?: { category?: string; limit?: number }) {
    const res = await api.get<ApiResponse<LongMemory[]>>('/memory/long', { params })
    return res.data
  },

  async storeLongMemory(data: { category: string; key: string; value: string; source?: string; importance?: number; tags?: string[] }) {
    const res = await api.post<ApiResponse<LongMemory>>('/memory/long', data)
    return res.data
  },

  async recallLongMemory(key: string) {
    const res = await api.get<ApiResponse<LongMemory>>(`/memory/long/${key}`)
    return res.data
  },

  async getLearningMemories(params?: { employeeType?: string; minConfidence?: number }) {
    const res = await api.get<ApiResponse<LearningMemory[]>>('/memory/learning', { params })
    return res.data
  },

  async getExecutionLogs() {
    const res = await api.get<ApiResponse<ExecutionLog[]>>('/memory/executions')
    return res.data
  },

  async getProjectHistory(projectId: string) {
    const res = await api.get<ApiResponse<ProjectHistory[]>>(`/memory/history/${projectId}`)
    return res.data
  },

  async addProjectHistory(projectId: string, data: { eventType: string; title: string; description?: string; importance?: string }) {
    const res = await api.post<ApiResponse<ProjectHistory>>(`/memory/history/${projectId}`, data)
    return res.data
  },

  async search(params: { query: string; projectId?: string; limit?: number }) {
    const res = await api.get<ApiResponse<unknown[]>>('/memory/search', { params })
    return res.data
  },
}
