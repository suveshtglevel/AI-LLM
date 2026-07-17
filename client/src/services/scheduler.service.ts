import api from './api'
import type { ApiResponse, ScheduledJob, CreateSchedulerInput } from '@/types'

export const schedulerService = {
  async list(params?: { isActive?: boolean }) {
    const res = await api.get<ApiResponse<ScheduledJob[]>>('/scheduler', { params })
    return res.data
  },

  async getById(id: string) {
    const res = await api.get<ApiResponse<ScheduledJob>>(`/scheduler/${id}`)
    return res.data
  },

  async create(data: CreateSchedulerInput) {
    const res = await api.post<ApiResponse<ScheduledJob>>('/scheduler', data)
    return res.data
  },

  async pause(id: string) {
    const res = await api.post<ApiResponse<ScheduledJob>>(`/scheduler/${id}/pause`)
    return res.data
  },

  async resume(id: string) {
    const res = await api.post<ApiResponse<ScheduledJob>>(`/scheduler/${id}/resume`)
    return res.data
  },

  async delete(id: string) {
    const res = await api.delete<ApiResponse<null>>(`/scheduler/${id}`)
    return res.data
  },
}
