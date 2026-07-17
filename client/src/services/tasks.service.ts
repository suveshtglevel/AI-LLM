import api from './api'
import type { ApiResponse, Task, PaginatedResponse } from '@/types'

export const tasksService = {
  async list(params?: { projectId?: string; status?: string; page?: number; limit?: number }) {
    const res = await api.get<ApiResponse<PaginatedResponse<Task>>>('/tasks', { params })
    return res.data
  },

  async getById(id: string) {
    const res = await api.get<ApiResponse<Task>>(`/tasks/${id}`)
    return res.data
  },
}
