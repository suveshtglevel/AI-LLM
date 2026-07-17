import api from './api'
import type { ApiResponse, Employee, EmployeeDetail, Department, DepartmentDetail } from '@/types'

export const employeesService = {
  async list(params?: { department?: string; skill?: string }) {
    const res = await api.get<ApiResponse<Employee[]>>('/employees', { params })
    return res.data
  },

  async getByType(type: string) {
    const res = await api.get<ApiResponse<EmployeeDetail>>(`/employees/${type}`)
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
