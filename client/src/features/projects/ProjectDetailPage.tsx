import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Clock, CheckCircle, XCircle,
  Bot, GitBranch, Activity, AlertTriangle, Zap,
  Shield, Loader2, RefreshCw, SkipForward,
  FileText, Download, ChevronDown, ChevronRight,
  Eye, ListTree, Maximize2, ExternalLink,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge, statusToVariant } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { projectsService } from '@/services/projects.service'
import { approvalsService } from '@/services/approvals.service'
import { useExecutionModeStore } from '@/store/execution-mode.store'
import type { ExecutionMode, TaskWithOutput, OutputDocument } from '@/types'
import { cn } from '@/lib/utils'

// ─── Tab configuration ───────────────────────────────────────────────

type ViewTab = 'timeline' | 'output'

// ─── Download helpers ────────────────────────────────────────────────

function downloadContent(content: string, filename: string, format: string) {
  const mimeTypes: Record<string, string> = {
    markdown: 'text/markdown',
    md: 'text/markdown',
    html: 'text/html',
    json: 'application/json',
    text: 'text/plain',
    txt: 'text/plain',
  }
  const mime = mimeTypes[format] || 'text/plain'
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function downloadTaskOutput(task: TaskWithOutput) {
  const content = JSON.stringify(task.output, null, 2)
  downloadContent(content, `${task.assignedEmployee}-output.json`, 'json')
}

function downloadDocument(doc: OutputDocument) {
  const ext = doc.format === 'markdown' ? 'md' : doc.format === 'text' ? 'txt' : doc.format
  downloadContent(doc.content, `${doc.employeeType}-v${doc.version}.${ext}`, doc.format)
}

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { globalMode } = useExecutionModeStore()

  const [viewTab, setViewTab] = useState<ViewTab>('timeline')
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set())
  const [expandedOutputs, setExpandedOutputs] = useState<Set<string>>(new Set())

  const { data, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectsService.getById(id!),
    enabled: !!id,
  })

  // Fetch output data for the project
  const { data: outputData, isLoading: outputLoading } = useQuery({
    queryKey: ['project-output', id],
    queryFn: () => projectsService.getOutput(id!),
    enabled: !!id,
    refetchInterval: 10000, // Poll for output as tasks complete
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
  const output = outputData?.data
  const pendingApprovals = approvalsData?.data?.approvals || []

  // Resolve effective execution mode: project override > global default > AUTO
  const projectMode = (project as any)?.executionMode as ExecutionMode | undefined | null
  const effectiveMode: ExecutionMode = projectMode || globalMode || 'AUTO'
  const isManuallyOverridden = projectMode !== null && projectMode !== undefined

  const toggleTask = (taskId: string) => {
    setExpandedTasks(prev => {
      const next = new Set(prev)
      if (next.has(taskId)) next.delete(taskId)
      else next.add(taskId)
      return next
    })
  }

  const toggleOutput = (taskId: string) => {
    setExpandedOutputs(prev => {
      const next = new Set(prev)
      if (next.has(taskId)) next.delete(taskId)
      else next.add(taskId)
      return next
    })
  }

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

      {/* View Toggle: Timeline / Output */}
      {tasks.length > 0 && (
        <>
          <div className="flex items-center gap-1 border-b border-white/[0.06] pb-1">
            <button
              onClick={() => setViewTab('timeline')}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all relative',
                viewTab === 'timeline'
                  ? 'text-blue-400 bg-blue-500/10'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/5'
              )}
            >
              <ListTree className="w-4 h-4" />
              Timeline
              {viewTab === 'timeline' && (
                <motion.div layoutId="project-view-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
              )}
            </button>
            <button
              onClick={() => setViewTab('output')}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all relative',
                viewTab === 'output'
                  ? 'text-blue-400 bg-blue-500/10'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/5'
              )}
            >
              <FileText className="w-4 h-4" />
              Output
              {output?.summary.hasOutput && (
                <Badge variant="success" className="ml-1 text-[10px] px-1.5 py-0">
                  {output.summary.completedTasks}/{output.summary.totalTasks}
                </Badge>
              )}
              {viewTab === 'output' && (
                <motion.div layoutId="project-view-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
              )}
            </button>
          </div>

          {/* Timeline View */}
          {viewTab === 'timeline' && (
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

          {/* Output View */}
          {viewTab === 'output' && (
            <AnimatePresence mode="wait">
              <motion.div
                key="output-view"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-4"
              >
                {outputLoading ? (
                  <Card>
                    <CardContent className="p-8">
                      <div className="flex flex-col items-center justify-center text-white/20">
                        <Loader2 className="w-8 h-8 animate-spin mb-2" />
                        <p className="text-sm">Loading output...</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : !output || !output.summary.hasOutput ? (
                  <Card>
                    <CardContent className="p-8">
                      <div className="flex flex-col items-center justify-center text-white/20">
                        <FileText className="w-10 h-10 mb-3" />
                        <p className="text-sm">No output generated yet</p>
                        <p className="text-xs mt-1 text-white/20">
                          Output will appear here as tasks complete
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {/* Output Summary Bar */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <Card className="bg-green-500/5 border-green-500/10">
                        <CardContent className="p-3">
                          <p className="text-[10px] text-green-400/60">Completed</p>
                          <p className="text-lg font-bold text-green-400">{output.summary.completedTasks}</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-blue-500/5 border-blue-500/10">
                        <CardContent className="p-3">
                          <p className="text-[10px] text-blue-400/60">In Progress</p>
                          <p className="text-lg font-bold text-blue-400">{output.summary.inProgressTasks}</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-red-500/5 border-red-500/10">
                        <CardContent className="p-3">
                          <p className="text-[10px] text-red-400/60">Failed</p>
                          <p className="text-lg font-bold text-red-400">{output.summary.failedTasks}</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-purple-500/5 border-purple-500/10">
                        <CardContent className="p-3">
                          <p className="text-[10px] text-purple-400/60">Documents</p>
                          <p className="text-lg font-bold text-purple-400">{output.summary.totalDocuments}</p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Task Output Cards */}
                    {output.tasks.map((task) => {
                      const hasContent = task.output !== null || task.documents.length > 0
                      const isExpanded = expandedTasks.has(task._id)
                      const isOutputExpanded = expandedOutputs.has(task._id)

                      return (
                        <Card
                          key={task._id}
                          className={cn(
                            'transition-all duration-200',
                            task.status === 'COMPLETED' && 'border-green-500/20',
                            task.status === 'FAILED' && 'border-red-500/20',
                          )}
                        >
                          {/* Task Header — click to expand */}
                          <div
                            onClick={() => toggleTask(task._id)}
                            className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                'w-8 h-8 rounded-lg flex items-center justify-center',
                                task.status === 'COMPLETED' ? 'bg-green-500/10' :
                                task.status === 'FAILED' ? 'bg-red-500/10' : 'bg-white/5'
                              )}>
                                {task.status === 'COMPLETED' ? (
                                  <CheckCircle className="w-4 h-4 text-green-400" />
                                ) : task.status === 'FAILED' ? (
                                  <XCircle className="w-4 h-4 text-red-400" />
                                ) : (
                                  <Bot className="w-4 h-4 text-white/30" />
                                )}
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold text-white capitalize flex items-center gap-2">
                                  {task.assignedEmployee}
                                  {task.title && task.title !== task.assignedEmployee && (
                                    <span className="text-xs font-normal text-white/40">— {task.title}</span>
                                  )}
                                </h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <Badge variant={statusToVariant(task.status)} className="text-[10px]">
                                    {task.status}
                                  </Badge>
                                  {task.documents.length > 0 && (
                                    <span className="text-[10px] text-white/30">
                                      {task.documents.length} document{task.documents.length > 1 ? 's' : ''}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <ChevronDown className={cn(
                              'w-4 h-4 text-white/30 transition-transform',
                              isExpanded && 'rotate-180'
                            )} />
                          </div>

                          {/* Expanded Content */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="px-4 pb-4 space-y-3 border-t border-white/[0.06] pt-3">
                                  {/* Task Description */}
                                  {task.description && (
                                    <p className="text-xs text-white/40">{task.description}</p>
                                  )}

                                  {/* Task Dates */}
                                  <div className="flex items-center gap-4 text-[11px] text-white/30">
                                    {task.startedAt && (
                                      <span>Started: {new Date(task.startedAt).toLocaleString()}</span>
                                    )}
                                    {task.completedAt && (
                                      <span>Completed: {new Date(task.completedAt).toLocaleString()}</span>
                                    )}
                                  </div>

                                  {/* Error display */}
                                  {task.error && (
                                    <div className="p-2 rounded-lg bg-red-500/5 border border-red-500/10">
                                      <p className="text-xs text-red-400/80 font-mono">{task.error}</p>
                                    </div>
                                  )}

                                  {/* Output Section */}
                                  {hasContent && (
                                    <div>
                                      <div
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          toggleOutput(task._id)
                                        }}
                                        className="flex items-center justify-between p-2 rounded-lg bg-white/5 cursor-pointer hover:bg-white/10 transition-colors"
                                      >
                                        <div className="flex items-center gap-2">
                                          <Eye className="w-3.5 h-3.5 text-blue-400" />
                                          <span className="text-xs font-medium text-white/70">View Generated Content</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          {/* Download buttons */}
                                          {task.output && (
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                downloadTaskOutput(task)
                                              }}
                                              className="p-1.5 rounded-md text-white/30 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
                                              title="Download output as JSON"
                                            >
                                              <Download className="w-3.5 h-3.5" />
                                            </button>
                                          )}
                                          {task.documents.map((doc) => (
                                            <button
                                              key={doc._id}
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                downloadDocument(doc)
                                              }}
                                              className="p-1.5 rounded-md text-white/30 hover:text-green-400 hover:bg-green-500/10 transition-all"
                                              title={`Download ${doc.format} document`}
                                            >
                                              <Download className="w-3.5 h-3.5" />
                                            </button>
                                          ))}
                                          <ChevronRight className={cn(
                                            'w-3.5 h-3.5 text-white/30 transition-transform',
                                            isOutputExpanded && 'rotate-90'
                                          )} />
                                        </div>
                                      </div>

                                      {/* Content Viewer */}
                                      <AnimatePresence>
                                        {isOutputExpanded && (
                                          <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="overflow-hidden mt-2"
                                          >
                                            <div className="rounded-lg bg-black/40 border border-white/[0.06] p-4 max-h-[600px] overflow-y-auto">
                                              {/* Output object */}
                                              {task.output && (
                                                <div className="mb-4">
                                                  <h5 className="text-[10px] text-white/30 uppercase tracking-wider mb-2">
                                                    Task Output
                                                  </h5>
                                                  <pre className="text-xs text-white/60 font-mono whitespace-pre-wrap leading-relaxed">
                                                    {typeof task.output === 'object'
                                                      ? JSON.stringify(task.output, null, 2).slice(0, 10000)
                                                      : String(task.output).slice(0, 10000)}
                                                    {JSON.stringify(task.output, null, 2).length > 10000 && (
                                                      <span className="text-yellow-400/50 block mt-2">
                                                        … truncated (download for full output)
                                                      </span>
                                                    )}
                                                  </pre>
                                                </div>
                                              )}

                                              {/* Documents */}
                                              {task.documents.map((doc, i) => (
                                                <div key={doc._id} className={cn(
                                                  'rounded-lg border border-white/[0.06]',
                                                  i > 0 && 'mt-3'
                                                )}>
                                                  <div className="flex items-center justify-between px-3 py-2 bg-white/[0.02] border-b border-white/[0.06] rounded-t-lg">
                                                    <div className="flex items-center gap-2">
                                                      <FileText className="w-3 h-3 text-blue-400" />
                                                      <span className="text-xs text-white/50 font-medium">
                                                        {doc.employeeType} — Document v{doc.version}
                                                      </span>
                                                      <Badge variant="default" className="text-[10px] bg-white/5 text-white/40">
                                                        {doc.format}
                                                      </Badge>
                                                    </div>
                                                    <button
                                                      onClick={() => downloadDocument(doc)}
                                                      className="p-1.5 rounded-md text-white/30 hover:text-green-400 hover:bg-green-500/10 transition-all"
                                                      title="Download"
                                                    >
                                                      <Download className="w-3.5 h-3.5" />
                                                    </button>
                                                  </div>
                                                  <div className="p-3 max-h-[400px] overflow-y-auto">
                                                    <pre className="text-xs text-white/60 font-mono whitespace-pre-wrap leading-relaxed">
                                                      {doc.content.slice(0, 15000)}
                                                      {doc.content.length > 15000 && (
                                                        <span className="text-yellow-400/50 block mt-2">
                                                          … truncated (download for full content)
                                                        </span>
                                      )}
                                                    </pre>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </Card>
                      )
                    })}

                    {/* Project Documents Download All */}
                    {output.documents.length > 1 && (
                      <div className="flex justify-end">
                        <button
                          onClick={() => {
                            // Download all documents as a concatenated file
                            const allContent = output.documents
                              .map(d => `--- ${d.employeeType} v${d.version} (${d.format}) ---\n\n${d.content}\n\n`)
                              .join('\n')
                            downloadContent(
                              allContent,
                              `${output.project.title}-all-output.md`,
                              'markdown'
                            )
                          }}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all border border-blue-500/20"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download All ({output.documents.length} documents)
                        </button>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </>
      )}
    </div>
  )
}
