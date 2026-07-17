import api from './api'
import type { ApiResponse, Project, ProjectDetail, CreateProjectInput, PaginatedResponse, ExecutionMode } from '@/types'

export const projectsService = {
  async list(params?: { page?: number; limit?: number; status?: string }) {
    const res = await api.get<ApiResponse<PaginatedResponse<Project>>>('/projects', { params })
    return res.data
  },

  async getById(id: string) {
    const res = await api.get<ApiResponse<ProjectDetail>>(`/projects/${id}`)
    return res.data
  },

  async delete(id: string) {
    const res = await api.delete<ApiResponse<null>>(`/projects/${id}`)
    return res.data
  },

  async delegate(data: CreateProjectInput) {
    const res = await api.post<ApiResponse<{ project: Project; tasks: unknown[]; message: string }>>('/ceo/delegate', data)
    return res.data
  },

  async getStatus(projectId: string) {
    const res = await api.get<ApiResponse<ProjectDetail>>(`/ceo/status/${projectId}`)
    return res.data
  },

  async updateExecutionMode(projectId: string, executionMode: ExecutionMode | null) {
    const res = await api.patch<ApiResponse<{ project: Project }>>(`/projects/${projectId}/execution-mode`, {
      executionMode: executionMode || '',
    })
    return res.data
  },
}
