import api from './api'
import type { ApiResponse, Employee, EmployeeDetail, Department, DepartmentDetail } from '@/types'

import type { InspectorSnapshot, InspectorLogEntry, InspectorHistoryEntry, InspectorPerformance } from '@/types'

export const employeesService = {
  async list(params?: { department?: string; skill?: string }) {
    const res = await api.get<ApiResponse<Employee[]>>('/employees', { params })
    return res.data
  },

  async getByType(type: string) {
    const res = await api.get<ApiResponse<EmployeeDetail>>(`/employees/${type}`)
    return res.data
  },

  // ==================== Inspector ====================

  async getInspector(type: string) {
    const res = await api.get<ApiResponse<InspectorSnapshot>>(`/employees/${type}/inspector`)
    return res.data
  },

  async getLogs(type: string, params?: { limit?: number; offset?: number; status?: string }) {
    const res = await api.get<ApiResponse<{ logs: InspectorLogEntry[]; total: number; limit: number; offset: number }>>(`/employees/${type}/logs`, { params })
    return res.data
  },

  async getHistory(type: string, params?: { limit?: number; offset?: number }) {
    const res = await api.get<ApiResponse<{ sessions: InspectorHistoryEntry[]; total: number; limit: number; offset: number }>>(`/employees/${type}/history`, { params })
    return res.data
  },

  async getPerformance(type: string, params?: { days?: number }) {
    const res = await api.get<ApiResponse<InspectorPerformance>>(`/employees/${type}/performance`, { params })
    return res.data
  },
}

export const departmentsService = {
  async list() {
    const res = await api.get<ApiResponse<Department[]>>('/departments')
    return res.data
  },

  async getById(id: string) {
    const res = await api.get<ApiResponse<DepartmentDetail>>(`/departments/${id}`)
    return res.data
  },

  async getEmployees(id: string) {
    const res = await api.get<ApiResponse<Employee[]>>(`/departments/${id}/employees`)
    return res.data
  },
}
