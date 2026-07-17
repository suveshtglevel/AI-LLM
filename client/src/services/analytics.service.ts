import api from './api'
import type { ApiResponse, AnalyticsSummary, EmployeePerformance, CostTrend, PerformanceTrend } from '@/types'

export const analyticsService = {
  async getSummary() {
    const res = await api.get<ApiResponse<AnalyticsSummary>>('/analytics/summary')
    return res.data
  },

  async getEmployeePerformance() {
    const res = await api.get<ApiResponse<EmployeePerformance[]>>('/analytics/employees')
    return res.data
  },

  async getCostTrends(days = 30) {
    const res = await api.get<ApiResponse<CostTrend[]>>('/analytics/costs', { params: { days } })
    return res.data
  },

  async getPerformanceTrends(days = 7) {
    const res = await api.get<ApiResponse<PerformanceTrend[]>>('/analytics/performance', { params: { days } })
    return res.data
  },
}
