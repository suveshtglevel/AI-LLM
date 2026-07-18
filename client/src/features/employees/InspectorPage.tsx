import { useState, useEffect, useRef, createElement } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Bot, Activity, Clock, Zap, Brain, Wrench,
  Cpu, DollarSign, BarChart3, FileText, Terminal, ListTree,
  AlertCircle, CheckCircle, XCircle, RefreshCw, Play,
  Pause, Search, Filter, Download, Maximize2, Minimize2,
  ChevronDown, ChevronRight, ExternalLink, Info, Eye,
  Shield, Target, GitBranch, Layers,
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Area, AreaChart,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge, statusToVariant } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { employeesService } from '@/services/employees.service'
import { getSocket } from '@/services/socket.service'
import { cn } from '@/lib/utils'
import type { InspectorSnapshot, InspectorLogEntry, InspectorPerformance } from '@/types'

// ─── Helpers ──────────────────────────────────────────────────────────

const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  const min = Math.floor(ms / 60000)
  const sec = Math.round((ms % 60000) / 1000)
  return `${min}m ${sec}s`
}

const formatCost = (cost: number): string => {
  if (cost === 0) return '$0.00'
  if (cost < 0.001) return `$${cost.toFixed(6)}`
  if (cost < 0.01) return `$${cost.toFixed(5)}`
  return `$${cost.toFixed(4)}`
}

const formatNumber = (n: number): string => {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return n.toString()
}

const logColors: Record<string, string> = {
  completed: 'text-green-400',
  failed: 'text-red-400',
  running: 'text-blue-400',
  started: 'text-blue-400',
  retried: 'text-yellow-400',
}

// ─── Tab Configuration ──────────────────────────────────────────────────

type TabId = 'overview' | 'logs' | 'output' | 'timeline' | 'performance' | 'history'

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: Eye },
  { id: 'logs', label: 'Live Logs', icon: Terminal },
  { id: 'output', label: 'Output', icon: FileText },
  { id: 'timeline', label: 'Timeline', icon: ListTree },
  { id: 'performance', label: 'Performance', icon: BarChart3 },
  { id: 'history', label: 'History', icon: Clock },
]

// ─── Sub-Components ────────────────────────────────────────────────────

function StatusPulse({ status }: { status: string }) {
  const colors: Record<string, string> = {
    IDLE: 'bg-green-500 shadow-green-500/50',
    BUSY: 'bg-blue-500 shadow-blue-500/50',
    ERROR: 'bg-red-500 shadow-red-500/50',
    OFFLINE: 'bg-gray-500 shadow-gray-500/50',
  }

  return (
    <span className="relative flex h-3 w-3">
      {status === 'BUSY' && (
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
      )}
      <span className={`relative inline-flex rounded-full h-3 w-3 ${colors[status] || 'bg-gray-500'}`} />
    </span>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  valueColor,
  trend,
}: {
  icon: React.ElementType
  label: string
  value: string
  valueColor?: string
  trend?: { value: number; positive: boolean }
}) {
  return (
    <Card className="group hover:border-white/[0.12] transition-all duration-300">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-blue-500/10 transition-colors">
              <Icon className="w-4 h-4 text-white/50 group-hover:text-blue-400 transition-colors" />
            </div>
            <span className="text-xs text-white/40">{label}</span>
          </div>
          {trend && (
            <span className={cn(
              'text-[10px] font-medium px-1.5 py-0.5 rounded',
              trend.positive ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'
            )}>
              {trend.positive ? '+' : ''}{trend.value}%
            </span>
          )}
        </div>
        <p className={cn('text-lg font-semibold mt-2', valueColor || 'text-white')}>{value}</p>
      </CardContent>
    </Card>
  )
}

function LogEntry({ log }: { log: InspectorLogEntry }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="group"
    >
      <div
        onClick={() => setExpanded(!expanded)}
        className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-white/[0.03] cursor-pointer transition-colors border border-transparent hover:border-white/[0.06]"
      >
        <div className={cn(
          'w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5',
          log.status === 'completed' ? 'bg-green-500/10' :
          log.status === 'failed' ? 'bg-red-500/10' :
          log.status === 'running' ? 'bg-blue-500/10' : 'bg-white/5'
        )}>
          {log.status === 'completed' ? <CheckCircle className="w-3.5 h-3.5 text-green-400" /> :
           log.status === 'failed' ? <XCircle className="w-3.5 h-3.5 text-red-400" /> :
           log.status === 'running' ? <Activity className="w-3.5 h-3.5 text-blue-400 animate-pulse" /> :
           <Clock className="w-3.5 h-3.5 text-white/30" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn('text-xs font-mono', logColors[log.status] || 'text-white/60')}>
              [{log.status?.toUpperCase()}]
            </span>
            <span className="text-xs text-white/30 font-mono">
              {new Date(log.createdAt).toLocaleTimeString()}
            </span>
            {log.provider && (
              <span className="text-[10px] text-white/30 bg-white/5 px-1.5 py-0.5 rounded">
                {log.provider}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 text-[11px] text-white/30 font-mono">
            {log.durationMs > 0 && <span>{formatDuration(log.durationMs)}</span>}
            {log.tokensUsed > 0 && <span>{formatNumber(log.tokensUsed)} tokens</span>}
            {log.estimatedCostUsd > 0 && <span>{formatCost(log.estimatedCostUsd)}</span>}
            {log.retryCount > 0 && <span className="text-yellow-400/50">retry #{log.retryCount}</span>}
            <span className="text-[10px] text-white/20">task: {(log.taskId || '').slice(-8)}</span>
          </div>
          {log.error && (
            <div className="mt-1.5 text-[11px] text-red-400/70 bg-red-500/5 px-2 py-1 rounded border border-red-500/10 font-mono">
              {log.error}
            </div>
          )}
        </div>
        <ChevronDown className={cn(
          'w-3.5 h-3.5 text-white/20 transition-transform mt-1',
          expanded && 'rotate-180'
        )} />
      </div>
      <AnimatePresence>
        {expanded && log.metadata && Object.keys(log.metadata).length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="ml-10 mb-2 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]"
          >
            <pre className="text-[11px] text-white/30 font-mono whitespace-pre-wrap">
              {JSON.stringify(log.metadata, null, 2)}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function TimelineEntry({
  session,
  index,
}: {
  session: any
  index: number
}) {
  const statusIcon = session.status === 'COMPLETED' ? CheckCircle :
    session.status === 'FAILED' ? XCircle : Activity
  const statusColor = session.status === 'COMPLETED' ? 'text-green-400' :
    session.status === 'FAILED' ? 'text-red-400' : 'text-blue-400'
  const lineColor = session.status === 'COMPLETED' ? 'bg-green-500/30' :
    session.status === 'FAILED' ? 'bg-red-500/30' : 'bg-white/10'

  return (
    <div className="relative flex gap-4 pb-6 last:pb-0">
      {/* Timeline line */}
      <div className="flex flex-col items-center">
        <div className={cn('w-3 h-3 rounded-full border-2', statusColor.replace('text', 'border'), 'bg-black')} />
        <div className={cn('w-0.5 flex-1 mt-1', lineColor)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-2">
        <div className="flex items-center gap-2">
          {createElement(statusIcon, { className: `w-3.5 h-3.5 ${statusColor}` })}
          <span className={cn('text-xs font-medium', statusColor)}>
            {session.status}
          </span>
          <span className="text-[10px] text-white/30">
            {new Date(session.startedAt || session.createdAt).toLocaleDateString()}
          </span>
        </div>
        {session.error && (
          <p className="text-[11px] text-red-400/60 mt-1 font-mono">{session.error}</p>
        )}
        <div className="flex items-center gap-3 mt-1 text-[10px] text-white/20 font-mono">
          {session.startedAt && (
            <span>Started: {new Date(session.startedAt).toLocaleTimeString()}</span>
          )}
          {session.completedAt && (
            <span>Completed: {new Date(session.completedAt).toLocaleTimeString()}</span>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────

export function InspectorPage() {
  const { type } = useParams<{ type: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [liveSnapshot, setLiveSnapshot] = useState<InspectorSnapshot | null>(null)
  const [liveLogs, setLiveLogs] = useState<InspectorLogEntry[]>([])
  const logContainerRef = useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = useState(true)
  const [logFilter, setLogFilter] = useState<string>('')

  // Fetch inspector data
  const { data: inspectorData, isLoading: inspectorLoading } = useQuery({
    queryKey: ['inspector', type],
    queryFn: () => employeesService.getInspector(type!),
    enabled: !!type,
    refetchInterval: 5000,
  })

  // Fetch performance data
  const { data: perfData } = useQuery({
    queryKey: ['inspector-performance', type],
    queryFn: () => employeesService.getPerformance(type!, { days: 30 }),
    enabled: !!type,
    refetchInterval: 30000,
  })

  // Fetch logs
  const { data: logsData, refetch: refetchLogs } = useQuery({
    queryKey: ['inspector-logs', type],
    queryFn: () => employeesService.getLogs(type!, { limit: 100 }),
    enabled: !!type,
    refetchInterval: 10000,
  })

  // Fetch history
  const { data: historyData } = useQuery({
    queryKey: ['inspector-history', type],
    queryFn: () => employeesService.getHistory(type!, { limit: 20 }),
    enabled: !!type,
    refetchInterval: 15000,
  })

  // Merge live socket logs with API-fetched logs
  const combinedLogs = [...liveLogs]
  for (const log of (logsData?.data?.logs || [])) {
    if (!combinedLogs.some(l => l._id === log._id)) {
      combinedLogs.push(log)
    }
  }
  // Keep at most 200 combined logs
  combinedLogs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  const logs = combinedLogs.slice(0, 200)

  const snapshot = liveSnapshot || inspectorData?.data || null
  const performance = perfData?.data
  const history = historyData?.data?.sessions || []

  // Socket real-time updates
  useEffect(() => {
    if (!type) return

    const socket = getSocket()

    // Join inspector room
    socket.emit('join:inspector', type)

    // Listen for inspector updates
    const handleInspectorUpdate = (data: any) => {
      if (data.employeeType === type) {
        setLiveSnapshot(data as InspectorSnapshot)
      }
    }

    const handleLogCreated = (data: any) => {
      if (data.employeeType === type && data.log) {
        setLiveLogs(prev => [data.log, ...prev].slice(0, 200))
      }
    }

    const handleStatusChange = (data: any) => {
      if (data.employeeType === type) {
        setLiveSnapshot(prev => prev ? { ...prev, status: data.status } : null)
      }
    }

    const handlePerformanceUpdate = (data: any) => {
      if (data.employeeType === type) {
        // Refetch performance data
        refetchLogs()
      }
    }

    socket.on('inspector:updated', handleInspectorUpdate)
    socket.on('inspector:log_created', handleLogCreated)
    socket.on('inspector:status_changed', handleStatusChange)
    socket.on('inspector:performance_updated', handlePerformanceUpdate)

    return () => {
      socket.emit('leave:inspector', type)
      socket.off('inspector:updated', handleInspectorUpdate)
      socket.off('inspector:log_created', handleLogCreated)
      socket.off('inspector:status_changed', handleStatusChange)
      socket.off('inspector:performance_updated', handlePerformanceUpdate)
    }
  }, [type])

  // Auto-scroll logs
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = 0
    }
  }, [liveLogs, autoScroll])

  if (!type) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-white/30">
        <Bot className="w-12 h-12 mb-3" />
        <p className="text-sm">No employee selected</p>
        <Link to="/employees">
          <Button variant="ghost" className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Employees
          </Button>
        </Link>
      </div>
    )
  }

  if (inspectorLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48 bg-white/5" />
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 bg-white/5" />
          ))}
        </div>
        <Skeleton className="h-64 bg-white/5" />
      </div>
    )
  }

  const filteredLogs = logFilter
    ? logs.filter(l =>
        l.status?.toLowerCase().includes(logFilter.toLowerCase()) ||
        l.provider?.toLowerCase().includes(logFilter.toLowerCase())
      )
    : logs

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to={`/employees/${type}`}
            className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">AI Inspector</h1>
              <Badge variant="default" className="text-xs font-mono bg-white/5 text-white/50">
                {type}
              </Badge>
            </div>
            <p className="text-sm text-white/40 mt-0.5">
              Real-time monitoring and inspection for {type} employee
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {snapshot?.status && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/[0.06]">
              <StatusPulse status={snapshot.status} />
              <span className={cn(
                'text-sm font-medium',
                snapshot.status === 'IDLE' ? 'text-green-400' :
                snapshot.status === 'BUSY' ? 'text-blue-400' :
                snapshot.status === 'ERROR' ? 'text-red-400' : 'text-white/50'
              )}>
                {snapshot.status}
              </span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/employees/${type}`)}
            className="text-white/40 hover:text-white/70"
          >
            <ExternalLink className="w-4 h-4 mr-1.5" />
            Profile
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      {snapshot && (
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
          <StatCard icon={Activity} label="Status" value={snapshot.status} valueColor={
            snapshot.status === 'IDLE' ? 'text-green-400' :
            snapshot.status === 'BUSY' ? 'text-blue-400' :
            snapshot.status === 'ERROR' ? 'text-red-400' : 'text-white/50'
          } />
          <StatCard icon={Zap} label="Tokens" value={formatNumber(snapshot.tokensUsed)} />
          <StatCard icon={DollarSign} label="Cost" value={formatCost(snapshot.estimatedCost)} />
          <StatCard icon={Clock} label="Execution" value={formatDuration(snapshot.executionTime)} />
          <StatCard icon={RefreshCw} label="Retries" value={String(snapshot.retryCount)} />
          <StatCard icon={Shield} label="Health" value={snapshot.healthStatus?.toUpperCase() || 'HEALTHY'} valueColor={
            snapshot.healthStatus === 'healthy' ? 'text-green-400' :
            snapshot.healthStatus === 'degraded' ? 'text-yellow-400' : 'text-red-400'
          } />
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-white/[0.06] pb-1">
        {TABS.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all relative',
                activeTab === tab.id
                  ? 'text-blue-400 bg-blue-500/10'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/5'
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="inspector-tab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full"
                />
              )}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && snapshot && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Left: Current Execution */}
            <div className="xl:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-white/70 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-400" />
                    Current Execution
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {snapshot.currentTask ? (
                    <>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
                          <Target className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{snapshot.currentTask}</p>
                          {snapshot.currentGoal && (
                            <p className="text-xs text-white/40 mt-0.5">{snapshot.currentGoal}</p>
                          )}
                        </div>
                      </div>

                      {snapshot.currentReasoning && (
                        <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                          <p className="text-xs text-white/40 mb-1.5 flex items-center gap-1.5">
                            <Brain className="w-3 h-3" />
                            Reasoning
                          </p>
                          <p className="text-sm text-white/60">{snapshot.currentReasoning}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        {snapshot.currentProvider && (
                          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                            <Cpu className="w-4 h-4 text-white/30" />
                            <div>
                              <p className="text-[10px] text-white/30">Provider</p>
                              <p className="text-xs text-white font-medium">{snapshot.currentProvider}</p>
                            </div>
                          </div>
                        )}
                        {snapshot.currentModel && (
                          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                            <Brain className="w-4 h-4 text-white/30" />
                            <div>
                              <p className="text-[10px] text-white/30">Model</p>
                              <p className="text-xs text-white font-mono">{snapshot.currentModel}</p>
                            </div>
                          </div>
                        )}
                        {snapshot.currentWorkflow && (
                          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                            <GitBranch className="w-4 h-4 text-white/30" />
                            <div>
                              <p className="text-[10px] text-white/30">Workflow</p>
                              <p className="text-xs text-white">{snapshot.currentWorkflow}</p>
                            </div>
                          </div>
                        )}
                        {snapshot.currentStep && (
                          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                            <Layers className="w-4 h-4 text-white/30" />
                            <div>
                              <p className="text-[10px] text-white/30">Step</p>
                              <p className="text-xs text-white">{snapshot.currentStep}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {snapshot.nextPlannedAction && (
                        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06] border-l-2 border-l-blue-500/50">
                          <Play className="w-3.5 h-3.5 text-blue-400" />
                          <span className="text-xs text-white/50">
                            Next: <span className="text-white/70">{snapshot.nextPlannedAction}</span>
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-white/30">
                      <Clock className="w-8 h-8 mb-2" />
                      <p className="text-sm">No active task</p>
                      <p className="text-xs text-white/20 mt-1">Waiting for new tasks...</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tools & Files */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xs text-white/50 flex items-center gap-1.5">
                      <Wrench className="w-3 h-3" />
                      Tools Used
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {snapshot.toolsUsed && snapshot.toolsUsed.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {snapshot.toolsUsed.map(tool => (
                          <Badge key={tool} variant="default" className="bg-white/5 text-white/50 text-[10px]">
                            {tool}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-white/20">No tools used</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-xs text-white/50 flex items-center gap-1.5">
                      <FileText className="w-3 h-3" />
                      Files Generated
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {snapshot.filesGenerated && snapshot.filesGenerated.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {snapshot.filesGenerated.map((file, i) => (
                          <Badge key={i} variant="default" className="text-[10px] text-white/40 bg-white/[0.04]">
                            {file}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-white/20">No files generated</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Right: Quick Status */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xs text-white/50">Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <DetailRow icon={Bot} label="Employee" value={snapshot.employeeType || type} />
                  <DetailRow icon={Cpu} label="Provider" value={snapshot.currentProvider || 'Not set'} />
                  <DetailRow icon={Brain} label="Model" value={snapshot.currentModel || 'Default'} />
                  <DetailRow icon={Shield} label="Health" value={snapshot.healthStatus || 'healthy'} valueColor={
                    snapshot.healthStatus === 'healthy' ? 'text-green-400' :
                    snapshot.healthStatus === 'degraded' ? 'text-yellow-400' : 'text-red-400'
                  } />
                  <DetailRow icon={Clock} label="Last Exec" value={
                    snapshot.lastExecution
                      ? new Date(snapshot.lastExecution).toLocaleString()
                      : 'Never'
                  } />
                  <DetailRow icon={Info} label="Prompt Ver" value={snapshot.promptVersion || 'Default'} />
                  <div className="pt-2 border-t border-white/[0.06]">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-white/30 flex items-center gap-1.5">
                        <Brain className="w-3 h-3" /> Memory Usage
                      </span>
                      <span className="text-xs text-white/50">{snapshot.memoryUsage || 0}%</span>
                    </div>
                    <Progress value={snapshot.memoryUsage || 0} className="h-1.5" />
                  </div>
                </CardContent>
              </Card>

              {/* Error Status */}
              {snapshot.latestError && (
                <Card className="border-red-500/20">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-400">Latest Error</p>
                        <p className="text-xs text-red-400/60 mt-1 font-mono">{snapshot.latestError}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* LOGS TAB */}
        {activeTab === 'logs' && (
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm text-white/70 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-blue-400" />
                  Execution Logs
                </CardTitle>
                <Badge variant="default" className="text-[10px] bg-white/5 text-white/50">
                  {logsData?.data?.total || 0} total
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-white/30" />
                  <input
                    type="text"
                    placeholder="Filter logs..."
                    value={logFilter}
                    onChange={(e) => setLogFilter(e.target.value)}
                    className="w-36 h-8 pl-8 pr-3 rounded-lg bg-white/5 border border-white/[0.08] text-xs text-white placeholder:text-white/25 focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <button
                  onClick={() => setAutoScroll(!autoScroll)}
                  className={cn(
                    'p-1.5 rounded-lg transition-colors',
                    autoScroll ? 'bg-blue-500/10 text-blue-400' : 'text-white/30 hover:text-white/50'
                  )}
                  title={autoScroll ? 'Auto-scroll on' : 'Auto-scroll off'}
                >
                  {autoScroll ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <div
                ref={logContainerRef}
                className="h-[500px] overflow-y-auto space-y-0.5 rounded-lg bg-black/30 border border-white/[0.06] p-3 font-mono text-xs scrollbar-thin"
              >
                {filteredLogs.length > 0 ? (
                  filteredLogs.slice(0, 100).map((log) => (
                    <LogEntry key={log._id} log={log} />
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-white/20">
                    <Terminal className="w-8 h-8 mb-2" />
                    <p className="text-sm">No logs available</p>
                    <p className="text-xs mt-1">Logs will appear as tasks are executed</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* OUTPUT TAB */}
        {activeTab === 'output' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-white/70 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                Latest Output
              </CardTitle>
            </CardHeader>
            <CardContent>
              {snapshot?.latestOutput ? (
                <div className="rounded-lg bg-black/30 border border-white/[0.06] p-4 overflow-auto max-h-[600px]">
                  <pre className="text-xs text-white/60 font-mono whitespace-pre-wrap leading-relaxed">
                    {typeof snapshot.latestOutput === 'object'
                      ? JSON.stringify(snapshot.latestOutput, null, 2)
                      : String(snapshot.latestOutput)}
                  </pre>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-white/20">
                  <FileText className="w-10 h-10 mb-3" />
                  <p className="text-sm">No output yet</p>
                  <p className="text-xs mt-1">Output will appear after task execution</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* TIMELINE TAB */}
        {activeTab === 'timeline' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-white/70 flex items-center gap-2">
                <ListTree className="w-4 h-4 text-blue-400" />
                Execution Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              {history.length > 0 ? (
                <div className="ml-2">
                  {history.map((session, i) => (
                    <TimelineEntry key={session._id} session={session} index={i} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-white/20">
                  <ListTree className="w-8 h-8 mb-2" />
                  <p className="text-sm">No execution history</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* PERFORMANCE TAB */}
        {activeTab === 'performance' && (
          <div className="space-y-6">
            {performance ? (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatCard icon={BarChart3} label="Total Exec" value={String(performance.summary.totalExecutions)} />
                  <StatCard icon={CheckCircle} label="Completed" value={String(performance.summary.completed)} valueColor="text-green-400" />
                  <StatCard icon={XCircle} label="Failed" value={String(performance.summary.failed)} valueColor="text-red-400" />
                  <StatCard icon={Activity} label="Success Rate" value={`${performance.summary.successRate.toFixed(1)}%`}
                    valueColor={performance.summary.successRate >= 80 ? 'text-green-400' : performance.summary.successRate >= 50 ? 'text-yellow-400' : 'text-red-400'} />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatCard icon={Zap} label="Avg Tokens" value={formatNumber(Math.round(performance.summary.averageTokens))} />
                  <StatCard icon={DollarSign} label="Avg Cost" value={formatCost(performance.summary.averageCost)} />
                  <StatCard icon={Clock} label="Avg Duration" value={formatDuration(performance.summary.averageDuration)} />
                  <StatCard icon={DollarSign} label="Total Cost" value={formatCost(performance.summary.totalCost)} />
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {/* Execution Trend */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm text-white/70">Execution Trend (30 days)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={performance.executionTrend}>
                            <defs>
                              <linearGradient id="execGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis
                              dataKey="date"
                              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                              tickFormatter={(val) => val?.slice(5) || ''}
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis
                              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <RechartsTooltip
                              contentStyle={{
                                background: 'rgba(0,0,0,0.9)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                                fontSize: '12px',
                              }}
                              labelStyle={{ color: 'rgba(255,255,255,0.7)' }}
                            />
                            <Area
                              type="monotone"
                              dataKey="count"
                              stroke="#3b82f6"
                              fill="url(#execGradient)"
                              strokeWidth={2}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Token Usage */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm text-white/70">Token Usage</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={performance.tokenTrend}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis
                              dataKey="date"
                              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                              tickFormatter={(val) => val?.slice(5) || ''}
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis
                              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <RechartsTooltip
                              contentStyle={{
                                background: 'rgba(0,0,0,0.9)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                                fontSize: '12px',
                              }}
                              labelStyle={{ color: 'rgba(255,255,255,0.7)' }}
                            />
                            <Bar dataKey="tokens" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Cost Trend */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm text-white/70">Cost Trend</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={performance.costTrend}>
                            <defs>
                              <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis
                              dataKey="date"
                              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                              tickFormatter={(val) => val?.slice(5) || ''}
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis
                              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                              axisLine={false}
                              tickLine={false}
                              tickFormatter={(val) => `$${val.toFixed(4)}`}
                            />
                            <RechartsTooltip
                              contentStyle={{
                                background: 'rgba(0,0,0,0.9)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                                fontSize: '12px',
                              }}
                              labelStyle={{ color: 'rgba(255,255,255,0.7)' }}
                              formatter={(value: any) => [formatCost(value), 'Cost']}
                            />
                            <Area
                              type="monotone"
                              dataKey="cost"
                              stroke="#22c55e"
                              fill="url(#costGradient)"
                              strokeWidth={2}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Status Distribution */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm text-white/70">Status Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[250px] flex items-center justify-center">
                        {performance.statusDistribution.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={performance.statusDistribution}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={4}
                                dataKey="value"
                              >
                                {performance.statusDistribution.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <RechartsTooltip
                                contentStyle={{
                                  background: 'rgba(0,0,0,0.9)',
                                  border: '1px solid rgba(255,255,255,0.1)',
                                  borderRadius: '8px',
                                  fontSize: '12px',
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <p className="text-xs text-white/20">No data available</p>
                        )}
                      </div>
                      <div className="flex justify-center gap-4 mt-2">
                        {performance.statusDistribution.map((entry) => (
                          <div key={entry.name} className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="text-[10px] text-white/40">{entry.name} ({entry.value})</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-white/20">
                <BarChart3 className="w-10 h-10 mb-3" />
                <p className="text-sm">No performance data available</p>
                <p className="text-xs mt-1">Data will populate as tasks are executed</p>
              </div>
            )}
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === 'history' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-white/70 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                Execution History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {history.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/[0.06]">
                        <th className="text-left py-3 px-3 text-xs font-medium text-white/40">Status</th>
                        <th className="text-left py-3 px-3 text-xs font-medium text-white/40">Task ID</th>
                        <th className="text-left py-3 px-3 text-xs font-medium text-white/40">Started</th>
                        <th className="text-left py-3 px-3 text-xs font-medium text-white/40">Completed</th>
                        <th className="text-left py-3 px-3 text-xs font-medium text-white/40">Error</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((session) => (
                        <tr key={session._id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 px-3">
                            <Badge variant={
                              session.status === 'COMPLETED' ? 'success' :
                              session.status === 'FAILED' ? 'error' : 'default'
                            } className="text-[10px]">
                              {session.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-3 font-mono text-xs text-white/50">
                            {(session.taskId || '').slice(-8)}...
                          </td>
                          <td className="py-3 px-3 text-xs text-white/40">
                            {session.startedAt ? new Date(session.startedAt).toLocaleString() : '-'}
                          </td>
                          <td className="py-3 px-3 text-xs text-white/40">
                            {session.completedAt ? new Date(session.completedAt).toLocaleString() : '-'}
                          </td>
                          <td className="py-3 px-3 text-xs text-red-400/60 max-w-[200px] truncate">
                            {session.error || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-white/20">
                  <Clock className="w-8 h-8 mb-2" />
                  <p className="text-sm">No execution history</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  )
}

// ─── Detail Row Component ──────────────────────────────────────────────

function DetailRow({
  icon: Icon,
  label,
  value,
  valueColor,
}: {
  icon: React.ElementType
  label: string
  value: string
  valueColor?: string
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className="w-3.5 h-3.5 text-white/30" />
        <span className="text-xs text-white/40">{label}</span>
      </div>
      <span className={cn('text-xs font-medium', valueColor || 'text-white/70')}>{value}</span>
    </div>
  )
}


