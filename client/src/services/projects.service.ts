import api from './api'
import type { ApiResponse, Project, ProjectDetail, CreateProjectInput, PaginatedResponse, ExecutionMode, ProjectOutput, TaskOutputDetail } from '@/types'

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

  // ==================== Output / Content Retrieval ====================

  async getOutput(projectId: string) {
    const res = await api.get<ApiResponse<ProjectOutput>>(`/projects/${projectId}/output`)
    return res.data
  },

  async getTaskOutput(projectId: string, taskId: string) {
    const res = await api.get<ApiResponse<TaskOutputDetail>>(`/projects/${projectId}/tasks/${taskId}/output`)
    return res.data
  },

  async getDocuments(projectId: string) {
    const res = await api.get<ApiResponse<{ documents: any[]; total: number }>>(`/projects/${projectId}/documents`)
    return res.data
  },
}
