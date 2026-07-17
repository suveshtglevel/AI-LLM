import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Clock, MessageSquare, Send } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { approvalsService } from '@/services/approvals.service'
import { cn } from '@/lib/utils'

function ApprovalCard({ approval }: { approval: any }) {
  const queryClient = useQueryClient()
  const [showComment, setShowComment] = useState(false)
  const [comment, setComment] = useState('')
  const [isRejecting, setIsRejecting] = useState(false)

  const decideMutation = useMutation({
    mutationFn: ({ id, approved, comment }: { id: string; approved: boolean; comment?: string }) =>
      approvalsService.decide(id, { approved, comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] })
      queryClient.invalidateQueries({ queryKey: ['approvals-count'] })
    },
  })

  const handleAction = (approved: boolean) => {
    if (!approved && !showComment) {
      setIsRejecting(true)
      setShowComment(true)
      return
    }
    decideMutation.mutate({ id: approval._id, approved, comment: comment || undefined })
    setShowComment(false)
    setComment('')
    setIsRejecting(false)
  }

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
              <Clock className="w-4 h-4 text-yellow-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white capitalize">
                {approval.employeeType} Review
              </h3>
              <p className="text-xs text-white/40">
                Project: {approval.projectId}
              </p>
            </div>
          </div>
          <Badge variant="warning">Pending</Badge>
        </div>

        {/* Content Preview */}
        {approval.content && (
          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] mb-4">
            <pre className="text-xs text-white/50 line-clamp-3 whitespace-pre-wrap font-sans">
              {JSON.stringify(approval.content, null, 2)}
            </pre>
          </div>
        )}

        {/* Comment Input */}
        {showComment && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4"
          >
            <div className="flex items-start gap-2">
              <div className="flex-1">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={isRejecting ? 'Reason for rejection...' : 'Optional comment...'}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/[0.08] text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                />
              </div>
              <button
                onClick={() => handleAction(isRejecting ? false : true)}
                className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => handleAction(false)}
            isLoading={decideMutation.isPending && !decideMutation.variables?.approved}
          >
            <XCircle className="w-4 h-4" />
            Reject
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            onClick={() => handleAction(true)}
            isLoading={decideMutation.isPending && decideMutation.variables?.approved}
          >
            <CheckCircle className="w-4 h-4" />
            Approve
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function ApprovalsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['approvals'],
    queryFn: () => approvalsService.listPending(),
  })

  const { data: countData } = useQuery({
    queryKey: ['approvals-count'],
    queryFn: () => approvalsService.getCount(),
  })

  const approvals = data?.data?.approvals || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Approvals</h1>
          <p className="text-sm text-white/50 mt-1">
            {countData?.data?.count || 0} pending approvals
          </p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-3"
      >
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full bg-white/5" />
          ))
        ) : approvals.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-white/30">
              <CheckCircle className="w-12 h-12 mb-3" />
              <p className="text-sm">No pending approvals</p>
              <p className="text-xs text-white/20 mt-1">All caught up!</p>
            </CardContent>
          </Card>
        ) : (
          approvals.map((approval: any) => (
            <ApprovalCard key={approval._id} approval={approval} />
          ))
        )}
      </motion.div>
    </div>
  )
}
