import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Clock, CheckCircle, XCircle,
  Bot, GitBranch, Activity, AlertTriangle, Zap,
  Shield, Loader2, RefreshCw, SkipForward,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge, statusToVariant } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { projectsService } from '@/services/projects.service'
import { approvalsService } from '@/services/approvals.service'
import { useExecutionModeStore } from '@/store/execution-mode.store'
import type { ExecutionMode } from '@/types'
import { cn } from '@/lib/utils'

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { globalMode } = useExecutionModeStore()

  const { data, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectsService.getById(id!),
    enabled: !!id,
  })

  const { data: approvalsData } = useQuery({
    queryKey: ['project-approvals', id],
    queryFn: () => approvalsService.listPending({ projectId: id! }),
    enabled: !!id,
  })

  const executionModeMutation = useMutation({
    mutationFn: ({ mode }: { mode: ExecutionMode | null }) =>
      projectsService.updateExecutionMode(id!, mode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] })
    },
  })

  const decideMutation = useMutation({
    mutationFn: ({ approvalId, approved, comment }: { approvalId: string; approved: boolean; comment?: string }) =>
      approvalsService.decide(approvalId, { approved, comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-approvals', id] })
      queryClient.invalidateQueries({ queryKey: ['project', id] })
      queryClient.invalidateQueries({ queryKey: ['approvals'] })
    },
  })

  const project = data?.data
  const pendingApprovals = approvalsData?.data?.approvals || []

  // Resolve effective execution mode: project override > global default > AUTO
  const projectMode = (project as any)?.executionMode as ExecutionMode | undefined | null
  const effectiveMode: ExecutionMode = projectMode || globalMode || 'AUTO'
  const isManuallyOverridden = projectMode !== null && projectMode !== undefined

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48 bg-white/5" />
        <Skeleton className="h-48 w-full bg-white/5" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-white/30">
        <p className="text-sm">Project not found</p>
        <Link to="/projects">
          <Button variant="ghost" className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Projects
          </Button>
        </Link>
      </div>
    )
  }

  const tasks = (project as any).tasks || []

  return (
    <div className="space-y-6">
      <Link to="/projects" className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/70">
        <ArrowLeft className="w-4 h-4" /> Back to Projects
      </Link>

      {/* Project Header */}
      <Card className={cn(
        'relative overflow-hidden transition-all duration-300',
        effectiveMode === 'MANUAL' ? 'border-orange-500/10' : 'border-emerald-500/10'
      )}>
        <div className={cn(
          'absolute top-0 left-0 right-0 h-1',
          effectiveMode === 'MANUAL' ? 'bg-orange-500' : 'bg-emerald-500'
        )} />
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-2xl font-bold text-white truncate">{project.title}</h1>
                <Badge variant={statusToVariant(project.status)} className="text-sm">
                  {project.status}
                </Badge>
                {/* Execution Mode Badge */}
                <Badge
                  variant={effectiveMode === 'AUTO' ? 'success' : 'warning'}
                  className="text-[10px] px-2"
                >
                  {effectiveMode === 'AUTO' ? (
                    <><Zap className="w-3 h-3 mr-1" /> AUTO</>
                  ) : (
                    <><AlertTriangle className="w-3 h-3 mr-1" /> MANUAL</>
                  )}
                </Badge>
              </div>
              <p className="text-sm text-white/50">{project.goal}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-white/30 flex-wrap">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> Created {new Date(project.createdAt).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1">
              <GitBranch className="w-3 h-3" /> {tasks.length || 0} tasks
            </span>
            <span className="flex items-center gap-1">
              <Shield className="w-3 h-3" />
              Mode: {effectiveMode}
              {isManuallyOverridden && ' (overridden)'}
            </span>
          </div>

          {/* Execution Mode Override */}
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/[0.06]">
            <span className="text-xs text-white/40 flex items-center gap-1">
              <Zap className="w-3 h-3" /> Override Mode:
            </span>
            {(['AUTO', 'MANUAL'] as ExecutionMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => {
                  const newMode = projectMode === mode ? null : mode
                  executionModeMutation.mutate({ mode: newMode })
                }}
                disabled={executionModeMutation.isPending}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                  projectMode === mode
                    ? mode === 'AUTO'
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                      : 'bg-orange-500/15 border-orange-500/30 text-orange-400'
                    : 'bg-white/5 text-white/50 border-white/10 hover:text-white/70'
                )}
              >
                {mode === 'AUTO' ? 'Automatic' : 'Manual'}
                {projectMode === mode && ' ✓'}
                {projectMode === null && mode === globalMode && ' (global)'}
              </button>
            ))}
            {projectMode && (
              <button
                onClick={() => executionModeMutation.mutate({ mode: null })}
                className="text-[10px] text-white/30 hover:text-white/50 underline"
              >
                Reset to global
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pending Approvals (Manual Mode) */}
      {effectiveMode === 'MANUAL' && pendingApprovals.length > 0 && (
        <Card className="border-orange-500/20 bg-orange-500/5">
          <CardHeader>
            <CardTitle className="text-sm text-orange-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Pending Approvals ({pendingApprovals.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingApprovals.map((approval: any) => (
              <div
                key={approval._id}
                className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium capitalize">{approval.employeeType}</p>
                    <p className="text-xs text-white/40">Step: {approval.stepId}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {/* Approve */}
                  <button
                    onClick={() => decideMutation.mutate({ approvalId: approval._id, approved: true })}
                    disabled={decideMutation.isPending}
                    className="p-2 rounded-lg text-white/30 hover:text-green-400 hover:bg-green-500/10 transition-all"
                    title="Approve"
                  >
                    {decideMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                  </button>
                  {/* Reject */}
                  <button
                    onClick={() => decideMutation.mutate({ approvalId: approval._id, approved: false })}
                    disabled={decideMutation.isPending}
                    className="p-2 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    title="Reject"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                  {/* Retry */}
                  <button
                    onClick={() => {
                      // Retry: reject first so task can be retried
                      decideMutation.mutate({ approvalId: approval._id, approved: false, comment: 'Retry requested' })
                    }}
                    disabled={decideMutation.isPending}
                    className="p-2 rounded-lg text-white/30 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
                    title="Retry"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  {/* Skip */}
                  <button
                    onClick={() => {
                      // Skip: approve to continue
                      decideMutation.mutate({ approvalId: approval._id, approved: true, comment: 'Skipped' })
                    }}
                    disabled={decideMutation.isPending}
                    className="p-2 rounded-lg text-white/30 hover:text-purple-400 hover:bg-purple-500/10 transition-all"
                    title="Skip"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Tasks Timeline */}
      {tasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-white/70 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Tasks
              {effectiveMode === 'MANUAL' && (
                <Badge variant="warning" className="text-[10px]">Waiting for approval</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative space-y-0">
              {tasks.sort((a: any, b: any) => a.order - b.order).map((task: any, index: number) => {
                const isPendingApproval = pendingApprovals.some((pa: any) => pa.taskId === task._id)
                return (
                  <div key={task._id} className="flex items-start gap-4 pb-6 last:pb-0">
                    {/* Timeline line */}
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center border-2',
                        task.status === 'COMPLETED' ? 'border-green-500 bg-green-500/10' :
                        task.status === 'FAILED' ? 'border-red-500 bg-red-500/10' :
                        isPendingApproval ? 'border-yellow-500 bg-yellow-500/10' :
                        task.status === 'IN_PROGRESS' ? 'border-blue-500 bg-blue-500/10' :
                        'border-white/10 bg-white/5'
                      )}>
                        {task.status === 'COMPLETED' ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : task.status === 'FAILED' ? (
                          <XCircle className="w-4 h-4 text-red-400" />
                        ) : isPendingApproval ? (
                          <AlertTriangle className="w-4 h-4 text-yellow-400" />
                        ) : (
                          <Bot className="w-4 h-4 text-white/30" />
                        )}
                      </div>
                      {index < tasks.length - 1 && (
                        <div className="w-px flex-1 bg-white/[0.06] mt-1" />
                      )}
                    </div>
                    {/* Task content */}
                    <div className="flex-1 pt-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-white capitalize">
                          {task.employeeType}
                        </h4>
                        <div className="flex items-center gap-2">
                          {isPendingApproval && (
                            <Badge variant="warning" className="text-[10px] animate-pulse">
                              Waiting for you
                            </Badge>
                          )}
                          <Badge variant={statusToVariant(task.status)}>
                            {task.status}
                          </Badge>
                        </div>
                      </div>
                      {task.startedAt && (
                        <p className="text-xs text-white/30 mt-1">
                          Started {new Date(task.startedAt).toLocaleString()}
                        </p>
                      )}
                      {task.completedAt && (
                        <p className="text-xs text-white/30">
                          Completed {new Date(task.completedAt).toLocaleString()}
                        </p>
                      )}
                      {task.error && (
                        <p className="text-xs text-red-400 mt-1">{task.error}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
