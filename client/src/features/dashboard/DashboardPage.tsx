import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  FolderKanban, Bot, CheckCircle, XCircle, Clock, 
  TrendingUp, Activity, BarChart3, Zap, AlertTriangle,
  Shield, Users, ArrowRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { systemService } from '@/services/system.service'
import { analyticsService } from '@/services/analytics.service'
import { approvalsService } from '@/services/approvals.service'
import { useExecutionModeStore } from '@/store/execution-mode.store'
import { DashboardAreaChart, DashboardPieChart, DashboardBarChart } from './DashboardCharts'
import { cn } from '@/lib/utils'

export function DashboardPage() {
  const { globalMode } = useExecutionModeStore()

  const { data: systemStatus, isLoading: loadingStatus } = useQuery({
    queryKey: ['system-status'],
    queryFn: () => systemService.getStatus(),
  })

  const { data: analytics, isLoading: loadingAnalytics } = useQuery({
    queryKey: ['analytics-summary'],
    queryFn: () => analyticsService.getSummary(),
  })

  const { data: employeePerformance, isLoading: loadingPerformance } = useQuery({
    queryKey: ['analytics-employees'],
    queryFn: () => analyticsService.getEmployeePerformance(),
  })

  const { data: costTrends, isLoading: loadingCosts } = useQuery({
    queryKey: ['analytics-costs'],
    queryFn: () => analyticsService.getCostTrends(30),
  })

  const { data: performanceTrends, isLoading: loadingTrends } = useQuery({
    queryKey: ['analytics-performance'],
    queryFn: () => analyticsService.getPerformanceTrends(7),
  })

  const { data: approvalsData } = useQuery({
    queryKey: ['approvals-count'],
    queryFn: () => approvalsService.getCount(),
    refetchInterval: 10000,
  })

  const status = systemStatus?.data
  const summary = analytics?.data
  const pendingApprovals = approvalsData?.data?.count || 0

  const statsCards = [
    {
      label: 'Total Projects',
      value: status?.projects ?? status?.workflows ?? 0,
      icon: FolderKanban,
      color: 'from-blue-500/20 to-blue-600/10',
      iconColor: 'text-blue-400',
      borderColor: 'border-blue-500/20',
    },
    {
      label: 'Running Projects',
      value: status?.employees ?? 0,
      icon: Activity,
      color: 'from-green-500/20 to-green-600/10',
      iconColor: 'text-green-400',
      borderColor: 'border-green-500/20',
    },
    {
      label: 'AI Employees',
      value: status?.employees ?? 0,
      icon: Bot,
      color: 'from-purple-500/20 to-purple-600/10',
      iconColor: 'text-purple-400',
      borderColor: 'border-purple-500/20',
    },
    {
      label: 'Success Rate',
      value: summary ? `${(summary.successRate * 100).toFixed(0)}%` : '--',
      icon: TrendingUp,
      color: 'from-emerald-500/20 to-emerald-600/10',
      iconColor: 'text-emerald-400',
      borderColor: 'border-emerald-500/20',
    },
    {
      label: 'Total Executions',
      value: summary?.totalExecutions ?? 0,
      icon: Zap,
      color: 'from-orange-500/20 to-orange-600/10',
      iconColor: 'text-orange-400',
      borderColor: 'border-orange-500/20',
    },
    {
      label: 'Total Cost',
      value: summary ? `$${summary.totalCost.toFixed(2)}` : '--',
      icon: BarChart3,
      color: 'from-cyan-500/20 to-cyan-600/10',
      iconColor: 'text-cyan-400',
      borderColor: 'border-cyan-500/20',
    },
    {
      label: 'Avg Duration',
      value: summary ? `${(summary.averageDuration / 1000).toFixed(1)}s` : '--',
      icon: Clock,
      color: 'from-pink-500/20 to-pink-600/10',
      iconColor: 'text-pink-400',
      borderColor: 'border-pink-500/20',
    },
    {
      label: 'Total Tokens',
      value: summary ? summary.totalTokens.toLocaleString() : '--',
      icon: Activity,
      color: 'from-yellow-500/20 to-yellow-600/10',
      iconColor: 'text-yellow-400',
      borderColor: 'border-yellow-500/20',
    },
  ]

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-white/50 mt-1">Overview of your AI Operating System</p>
        </div>
        {/* Global Mode Indicator */}
        <Link to="/settings">
          <Badge
            variant={globalMode === 'AUTO' ? 'success' : 'warning'}
            className="text-xs px-3 py-1.5 cursor-pointer hover:opacity-80 transition-opacity"
          >
            {globalMode === 'AUTO' ? (
              <><Zap className="w-3 h-3 mr-1.5" /> Automatic</>
            ) : (
              <><AlertTriangle className="w-3 h-3 mr-1.5" /> Manual</>
            )}
          </Badge>
        </Link>
      </div>

      {/* Mission Control */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'rounded-xl border p-4 transition-all duration-300',
          globalMode === 'MANUAL'
            ? 'border-orange-500/20 bg-orange-500/[0.03]'
            : 'border-emerald-500/20 bg-emerald-500/[0.03]'
        )}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield className={cn(
              'w-4 h-4',
              globalMode === 'MANUAL' ? 'text-orange-400' : 'text-emerald-400'
            )} />
            <h2 className="text-sm font-semibold text-white">Mission Control</h2>
          </div>
          <Badge
            variant={globalMode === 'AUTO' ? 'success' : 'warning'}
            className="text-[10px]"
          >
            {globalMode === 'AUTO' ? 'Fully Autonomous' : 'Manual Oversight'}
          </Badge>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
            <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Mode</p>
            <div className="flex items-center gap-1.5">
              <span className={cn(
                'w-2 h-2 rounded-full',
                globalMode === 'AUTO' ? 'bg-emerald-400' : 'bg-orange-400'
              )} />
              <span className="text-sm font-semibold text-white">
                {globalMode === 'AUTO' ? 'Automatic' : 'Manual'}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
            <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Employees</p>
            <div className="flex items-center gap-1.5">
              <Bot className="w-4 h-4 text-blue-400" />
              <span className="text-lg font-bold text-white">{status?.employees ?? 0}</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
            <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Running Now</p>
            <div className="flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-blue-400" />
              <span className="text-lg font-bold text-white">
                {summary?.totalExecutions && summary?.successRate
                  ? Math.round(summary.totalExecutions * (1 - summary.successRate))
                  : 0
                }
              </span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
            <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Completed</p>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-lg font-bold text-white">
                {summary?.totalExecutions && summary?.successRate
                  ? Math.round(summary.totalExecutions * summary.successRate)
                  : 0
                }
              </span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
            <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Failed</p>
            <div className="flex items-center gap-1.5">
              <XCircle className="w-4 h-4 text-red-400" />
              <span className={cn(
                'text-lg font-bold',
                (summary?.totalExecutions && summary?.failureRate && summary.failureRate > 0) ? 'text-red-400' : 'text-white'
              )}>
                {summary?.totalExecutions && summary?.failureRate !== undefined
                  ? Math.round(summary.totalExecutions * summary.failureRate)
                  : 0
                }
              </span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
            <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Waiting Approval</p>
            <div className="flex items-center gap-1.5">
              <AlertTriangle className={cn(
                'w-4 h-4',
                pendingApprovals > 0 ? 'text-orange-400' : 'text-white/20'
              )} />
              <span className={cn(
                'text-lg font-bold',
                pendingApprovals > 0 ? 'text-orange-400' : 'text-white'
              )}>
                {pendingApprovals}
              </span>
            </div>
            {pendingApprovals > 0 && (
              <Link to="/approvals" className="text-[10px] text-orange-400/70 hover:text-orange-400 mt-1 inline-flex items-center gap-0.5">
                Review <ArrowRight className="w-2.5 h-2.5" />
              </Link>
            )}
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {statsCards.map((stat) => (
          <motion.div key={stat.label} variants={item}>
            <Card className="relative overflow-hidden group hover:border-white/[0.12] transition-all duration-300">
              <div className={cn('absolute inset-0 bg-gradient-to-br opacity-50 group-hover:opacity-70 transition-opacity', stat.color)} />
              <CardContent className="relative p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-white/50 uppercase tracking-wider">{stat.label}</p>
                    {loadingStatus || loadingAnalytics ? (
                      <Skeleton className="h-8 w-20 bg-white/5" />
                    ) : (
                      <p className="text-2xl font-bold text-white">{stat.value}</p>
                    )}
                  </div>
                  <div className={cn('p-2.5 rounded-xl bg-white/5 border', stat.borderColor)}>
                    <stat.icon className={cn('w-5 h-5', stat.iconColor)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-white/70">Cost Trends (30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingCosts ? (
              <Skeleton className="h-[300px] w-full bg-white/5" />
            ) : (
              <DashboardAreaChart
                data={costTrends?.data || []}
                xKey="date"
                series={[
                  { key: 'cost', name: 'Cost ($)', color: '#3b82f6' },
                ]}
                height={300}
              />
            )}
          </CardContent>
        </Card>

        {/* Employee Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-white/70">Employee Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingPerformance ? (
              <Skeleton className="h-[300px] w-full bg-white/5" />
            ) : (
              <DashboardBarChart
                data={employeePerformance?.data || []}
                xKey="employeeType"
                series={[
                  { key: 'executionCount', name: 'Executions', color: '#8b5cf6' },
                  { key: 'successRate', name: 'Success Rate (%)', color: '#22c55e' },
                ]}
                height={300}
              />
            )}
          </CardContent>
        </Card>

        {/* Performance Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-white/70">Performance Trends (7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingTrends ? (
              <Skeleton className="h-[300px] w-full bg-white/5" />
            ) : (
              <DashboardAreaChart
                data={performanceTrends?.data || []}
                xKey="date"
                series={[
                  { key: 'averageDuration', name: 'Avg Duration (ms)', color: '#f59e0b' },
                  { key: 'successRate', name: 'Success Rate', color: '#22c55e' },
                ]}
                height={300}
              />
            )}
          </CardContent>
        </Card>

        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-white/70">System Health</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingStatus ? (
              <Skeleton className="h-[300px] w-full bg-white/5" />
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                  <span className="text-sm text-white/60">Database</span>
                  <Badge variant={status?.health?.database === 'healthy' ? 'success' : 'error'}>
                    {status?.health?.database || 'unknown'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                  <span className="text-sm text-white/60">Redis</span>
                  <Badge variant={status?.health?.redis === 'healthy' ? 'success' : 'error'}>
                    {status?.health?.redis || 'unknown'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                  <span className="text-sm text-white/60">Workers</span>
                  <Badge variant={status?.health?.workers === 'healthy' ? 'success' : 'error'}>
                    {status?.health?.workers || 'unknown'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                  <span className="text-sm text-white/60">AI Providers</span>
                  <Badge variant="info">{status?.providers || 0} active</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                  <span className="text-sm text-white/60">Tools</span>
                  <Badge variant="info">{status?.tools || 0} registered</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                  <span className="text-sm text-white/60">Workflows</span>
                  <Badge variant="info">{status?.workflows || 0} defined</Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
