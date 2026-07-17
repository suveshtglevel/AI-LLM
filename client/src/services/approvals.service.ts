import api from './api'
import type { ApiResponse, Approval, ApprovalDecision } from '@/types'

export const approvalsService = {
  async listPending(params?: { projectId?: string }) {
    const res = await api.get<ApiResponse<{ approvals: Approval[] }>>('/approvals/pending', { params })
    return res.data
  },

  async decide(approvalId: string, data: ApprovalDecision) {
    const res = await api.post<ApiResponse<{ approval: Approval; message: string }>>(`/approvals/${approvalId}/decide`, data)
    return res.data
  },

  async getCount() {
    const res = await api.get<ApiResponse<{ count: number }>>('/approvals/count')
    return res.data
  },
}
