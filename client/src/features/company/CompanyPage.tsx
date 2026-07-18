import { useEffect, useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2, Bot, Activity, Zap, BarChart3,
  TrendingUp, CheckCircle, AlertCircle,
  Crown, UserCheck, Network, RefreshCw, ChevronRight,
  Brain, Layers, UserCog,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { systemService } from '@/services/system.service'
import { employeesService } from '@/services/employees.service'
import { departmentsService } from '@/services/employees.service'
import { analyticsService } from '@/services/analytics.service'
import { subscribeToEvent } from '@/services/socket.service'
import { cn } from '@/lib/utils'
import type { Employee, Department, SystemStatus } from '@/types'

// ==================== Types ====================

interface LiveEmployeeStatus {
  employeeType: string
  status: 'IDLE' | 'BUSY' | 'ERROR' | 'OFFLINE'
  currentTask: string | null
  currentThought?: string
}

// ==================== Constants ====================

const departmentColors: Record<string, { bg: string; border: string; text: string; gradient: string }> = {
  research: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', gradient: 'from-blue-500/20 to-blue-600/5' },
  content: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400', gradient: 'from-purple-500/20 to-purple-600/5' },
  media: { bg: 'bg-pink-500/10', border: 'border-pink-500/30', text: 'text-pink-400', gradient: 'from-pink-500/20 to-pink-600/5' },
  publishing: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400', gradient: 'from-green-500/20 to-green-600/5' },
  analytics: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', gradient: 'from-orange-500/20 to-orange-600/5' },
  memory: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-400', gradient: 'from-cyan-500/20 to-cyan-600/5' },
  management: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400', gradient: 'from-yellow-500/20 to-yellow-600/5' },
}

const statusGradient: Record<string, string> = {
  healthy: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/20',
  degraded: 'from-yellow-500/20 to-yellow-600/5 border-yellow-500/20',
  critical: 'from-red-500/20 to-red-600/5 border-red-500/20',
}

// ==================== Sub-components ====================

function StatusPulse({ status }: { status: string }) {
  const colors: Record<string, string> = {
    IDLE: 'bg-green-400',
    BUSY: 'bg-blue-400',
    ERROR: 'bg-red-400',
    OFFLINE: 'bg-white/20',
    healthy: 'bg-emerald-400',
    degraded: 'bg-yellow-400',
    critical: 'bg-red-400',
  }

  return (
    <span className="relative flex h-3 w-3">
      <span
        className={cn(
          'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
          colors[status] || 'bg-white/20'
        )}
      />
      <span
        className={cn(
          'relative inline-flex rounded-full h-3 w-3',
          colors[status] || 'bg-white/20'
        )}
      />
    </span>
  )
}

function OrgConnection({ index, total }: { index: number; total: number }) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-px h-6 bg-gradient-to-b from-white/10 to-white/5" />
      {index < total - 1 && (
        <div className="flex items-center gap-2">
          <div className="w-1 h-1 rounded-full bg-white/10" />
          <div className="w-1 h-1 rounded-full bg-white/10" />
          <div className="w-1 h-1 rounded-full bg-white/10" />
        </div>
      )}
    </div>
  )
}

function CompanyMetric({ label, value, icon: Icon, color, trend }: {
  label: string
  value: string | number
  icon: React.ElementType
  color: string
  trend?: { direction: 'up' | 'down' | 'stable'; text: string }
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] group hover:bg-white/[0.04] hover:border-white/[0.10] transition-all duration-200">
      <div className={cn('p-2 rounded-lg border', color)}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-white/50 truncate">{label}</p>
        <div className="flex items-center gap-2">
          <p className="text-lg font-bold text-white">{value}</p>
          {trend && (
            <span className={cn(
              'text-[10px] font-medium',
              trend.direction === 'up' ? 'text-green-400' :
              trend.direction === 'down' ? 'text-red-400' : 'text-white/30'
            )}>
              {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'} {trend.text}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function EmployeeNode({ employee, isLive }: { employee: Employee; isLive?: LiveEmployeeStatus }) {
  const deptColor = departmentColors[employee.department] || departmentColors.management
  const liveStatus = isLive?.status || employee.status

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'relative p-3 rounded-xl border transition-all duration-200 cursor-pointer group',
        'bg-white/[0.02] hover:bg-white/[0.04]',
        liveStatus === 'IDLE' ? 'border-green-500/20 hover:border-green-500/40' :
        liveStatus === 'BUSY' ? 'border-blue-500/20 hover:border-blue-500/40' :
        liveStatus === 'ERROR' ? 'border-red-500/20 hover:border-red-500/40' :
        'border-white/[0.06] hover:border-white/[0.12]'
      )}
    >
      <div className="flex items-center gap-2.5">
        <div className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
          liveStatus === 'IDLE' ? 'bg-green-500/10' :
          liveStatus === 'BUSY' ? 'bg-blue-500/10' :
          liveStatus === 'ERROR' ? 'bg-red-500/10' : 'bg-white/5'
        )}>
          <Bot className={cn(
            'w-4 h-4',
            liveStatus === 'IDLE' ? 'text-green-400' :
            liveStatus === 'BUSY' ? 'text-blue-400' :
            liveStatus === 'ERROR' ? 'text-red-400' : 'text-white/30'
          )} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-white truncate group-hover:text-blue-400 transition-colors">
            {employee.name}
          </p>
          <p className="text-[10px] text-white/40 truncate capitalize">{employee.type}</p>
        </div>
        <StatusPulse status={liveStatus} />
      </div>
      {isLive?.currentThought && (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="text-[10px] text-white/30 mt-2 pt-2 border-t border-white/[0.04] italic leading-relaxed"
        >
          "{isLive.currentThought}"
        </motion.p>
      )}
    </motion.div>
  )
}

function DepartmentNode({ department, employees, liveStatuses }: {
  department: Department
  employees: Employee[]
  liveStatuses: Map<string, LiveEmployeeStatus>
}) {
  const [isExpanded, setIsExpanded] = useState(true)
  const deptColor = departmentColors[department.name] || departmentColors.management
  const onlineCount = employees.filter(e => {
    const ls = liveStatuses.get(e.type)
    return ls ? ls.status !== 'OFFLINE' : e.status !== 'OFFLINE'
  }).length

  return (
    <motion.div
      layout
      className={cn(
        'rounded-xl border overflow-hidden transition-all duration-300',
        'bg-white/[0.02] hover:bg-white/[0.03]',
        deptColor.border.replace('border-', 'border-white/[0.08] hover:border-')
      )}
    >
      {/* Department Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center border', deptColor.border, deptColor.bg)}>
            <Building2 className={cn('w-4 h-4', deptColor.text)} />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-white capitalize">{department.name}</p>
            <p className="text-[10px] text-white/40">
              {employees.length} employees · {onlineCount} online
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={onlineCount === employees.length ? 'success' : onlineCount > 0 ? 'warning' : 'default'} className="text-[10px] px-2">
            {onlineCount}/{employees.length}
          </Badge>
          <motion.div
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronRight className="w-4 h-4 text-white/30" />
          </motion.div>
        </div>
      </button>

      {/* Employees */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-1.5">
              {departmentColors[department.name] && (
                <div className={cn('h-px mb-2', departmentColors[department.name]?.bg)} />
              )}
              {employees.map((emp) => (
                <EmployeeNode
                  key={emp.type}
                  employee={emp}
                  isLive={liveStatuses.get(emp.type)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function CEOFrame({ status, employees, analytics }: {
  status?: SystemStatus
  employees: number
  analytics?: { totalExecutions: number; successRate: number; totalCost: number }
}) {
  const health = status?.health?.database === 'healthy' && status?.health?.redis === 'healthy' && status?.health?.workers === 'healthy'
    ? 'healthy' as const
    : status?.health?.database === 'healthy' || status?.health?.redis === 'healthy'
    ? 'degraded' as const
    : 'critical' as const

  const healthColor = statusGradient[health]

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, type: 'spring' }}
      className={cn(
        'relative rounded-2xl border p-6',
        'bg-gradient-to-br',
        healthColor
      )}
    >
      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* CEO Avatar */}
        <div className="relative">
          <div className={cn(
            'w-20 h-20 rounded-2xl flex items-center justify-center border-2',
            'bg-gradient-to-br from-yellow-500/20 to-amber-600/10',
            'border-yellow-500/30 shadow-lg shadow-yellow-500/10'
          )}>
            <Crown className="w-10 h-10 text-yellow-400" />
          </div>
          <div className="absolute -top-1 -right-1">
            <StatusPulse status={health} />
          </div>
        </div>

        {/* CEO Info */}
        <div className="flex-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
            <h2 className="text-xl font-bold text-white">AIOS Executive Board</h2>
            <Badge variant={health === 'healthy' ? 'success' : health === 'degraded' ? 'warning' : 'error'}>
              {health === 'healthy' ? 'All Systems Operational' : health === 'degraded' ? 'Degraded Performance' : 'Critical Issues'}
            </Badge>
          </div>
          <p className="text-sm text-white/50">
            Managing {employees} AI Employees across {Object.keys(departmentColors).length} departments
          </p>

          {/* Quick Health */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-3">
            <div className="flex items-center gap-1.5 text-xs">
              <CheckCircle className={cn('w-3.5 h-3.5', status?.health?.database === 'healthy' ? 'text-green-400' : 'text-red-400')} />
              <span className="text-white/50">Database</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <CheckCircle className={cn('w-3.5 h-3.5', status?.health?.redis === 'healthy' ? 'text-green-400' : 'text-red-400')} />
              <span className="text-white/50">Redis</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <CheckCircle className={cn('w-3.5 h-3.5', status?.health?.workers === 'healthy' ? 'text-green-400' : 'text-red-400')} />
              <span className="text-white/50">Workers</span>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="flex gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{analytics?.totalExecutions || 0}</p>
            <p className="text-[10px] text-white/40">Executions</p>
          </div>
          <div className="w-px bg-white/[0.06]" />
          <div className="text-center">
            <p className="text-2xl font-bold text-green-400">
              {analytics?.successRate ? `${(analytics.successRate * 100).toFixed(0)}%` : '--'}
            </p>
            <p className="text-[10px] text-white/40">Success Rate</p>
          </div>
          <div className="w-px bg-white/[0.06]" />
          <div className="text-center">
            <p className="text-2xl font-bold text-white">
              {analytics?.totalCost ? `$${analytics.totalCost.toFixed(0)}` : '--'}
            </p>
            <p className="text-[10px] text-white/40">Total Cost</p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ==================== Main Page ====================

export function CompanyPage() {
  const [liveStatuses, setLiveStatuses] = useState<Map<string, LiveEmployeeStatus>>(new Map())
  const [selectedDept, setSelectedDept] = useState<string | null>(null)
  const [hasRealSocketData, setHasRealSocketData] = useState(false)

  // Fetch system status
  const { data: systemStatusData, isLoading: loadingStatus } = useQuery({
    queryKey: ['system-status'],
    queryFn: () => systemService.getStatus(),
    refetchInterval: 10000,
  })

  // Fetch analytics
  const { data: analyticsData, isLoading: loadingAnalytics } = useQuery({
    queryKey: ['analytics-summary'],
    queryFn: () => analyticsService.getSummary(),
    refetchInterval: 15000,
  })

  // Fetch employees
  const { data: employeesData, isLoading: loadingEmployees } = useQuery({
    queryKey: ['employees-all'],
    queryFn: () => employeesService.list(),
    refetchInterval: 10000,
  })

  // Fetch departments
  const { data: departmentsData, isLoading: loadingDepartments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentsService.list(),
    refetchInterval: 30000,
  })

  const status = systemStatusData?.data
  const analytics = analyticsData?.data
  const employees = employeesData?.data || []
  const departments = departmentsData?.data || []

  // Subscribe to real-time employee status updates
  useEffect(() => {
    const unsub = subscribeToEvent('employee:status', (data: unknown) => {
      const update = data as LiveEmployeeStatus
      if (update?.employeeType) {
        setHasRealSocketData(true)
        setLiveStatuses(prev => {
          const next = new Map(prev)
          next.set(update.employeeType, update)
          return next
        })
      }
    })

    // Demo mode simulation - only runs if no real socket data has arrived
    const thoughtInterval = setInterval(() => {
      if (hasRealSocketData) return

      const busyEmps = employees.filter(e => e.status === 'BUSY')
      if (busyEmps.length > 0) {
        const emp = busyEmps[Math.floor(Math.random() * busyEmps.length)]
        const thoughts = [
          'Processing incoming data...',
          'Analyzing results...',
          'Generating output...',
          'Validating against requirements...',
          'Optimizing performance...',
          'Cross-referencing knowledge base...',
          'Compiling final report...',
          'Checking quality metrics...',
        ]
        setLiveStatuses(prev => {
          // Don't overwrite real socket data
          if (prev.has(emp.type) && hasRealSocketData) return prev
          const next = new Map(prev)
          next.set(emp.type, {
            employeeType: emp.type,
            status: 'BUSY',
            currentTask: emp.currentTask || 'Processing task',
            currentThought: thoughts[Math.floor(Math.random() * thoughts.length)],
          })
          return next
        })
      }
    }, 4000)

    return () => {
      unsub?.()
      clearInterval(thoughtInterval)
    }
  }, [employees, hasRealSocketData])

  // Group employees by department
  const employeesByDept = useMemo(() => {
    const map = new Map<string, Employee[]>()
    employees.forEach((emp) => {
      const dept = emp.department || 'other'
      if (!map.has(dept)) map.set(dept, [])
      map.get(dept)!.push(emp)
    })
    return map
  }, [employees])

  // Compute company metrics
  const totalOnline = useMemo(() => {
    return employees.filter(e => {
      const ls = liveStatuses.get(e.type)
      return ls ? ls.status !== 'OFFLINE' : e.status !== 'OFFLINE'
    }).length
  }, [employees, liveStatuses])

  const totalBusy = useMemo(() => {
    return employees.filter(e => {
      const ls = liveStatuses.get(e.type)
      return ls ? ls.status === 'BUSY' : e.status === 'BUSY'
    }).length
  }, [employees, liveStatuses])

  const totalError = useMemo(() => {
    return employees.filter(e => {
      const ls = liveStatuses.get(e.type)
      return ls ? ls.status === 'ERROR' : e.status === 'ERROR'
    }).length
  }, [employees, liveStatuses])

  const filteredDepartments = useMemo(() => {
    if (!departments || departments.length === 0) {
      // Fallback from employeesByDept
      return Array.from(employeesByDept.keys()).map(name => ({
        _id: name,
        name,
        description: '',
        manager: null,
        employeeCount: employeesByDept.get(name)?.length || 0,
        skills: [],
        employeeTypes: employeesByDept.get(name)?.map(e => e.type) || [],
      }))
    }
    return departments
  }, [departments, employeesByDept])

  const isLoading = loadingStatus || loadingEmployees || loadingDepartments || loadingAnalytics

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Company</h1>
          <p className="text-sm text-white/50 mt-1">Loading organization data...</p>
        </div>
        <Skeleton className="h-48 w-full bg-white/5" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full bg-white/5" />
            ))}
          </div>
          <Skeleton className="h-96 bg-white/5" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Company</h1>
            <p className="text-sm text-white/50 mt-1">
              AI Company Overview · {employees.length} Employees · {filteredDepartments.length} Departments
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/30">
            <RefreshCw className="w-3 h-3" />
            Live
          </div>
        </div>
      </motion.div>

      {/* Company Metrics Strip */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3"
      >
        <CompanyMetric
          label="Total Employees"
          value={employees.length}
          icon={Bot}
          color="border-blue-500/20 bg-blue-500/10 text-blue-400"
        />
        <CompanyMetric
          label="Currently Online"
          value={totalOnline}
          icon={UserCheck}
          color="border-green-500/20 bg-green-500/10 text-green-400"
          trend={{ direction: 'stable', text: `${totalBusy} working` }}
        />
        <CompanyMetric
          label="Active Projects"
          value={status?.projects ?? status?.workflows ?? 0}
          icon={Activity}
          color="border-purple-500/20 bg-purple-500/10 text-purple-400"
        />
        <CompanyMetric
          label="Tasks Running"
          value={totalBusy}
          icon={Zap}
          color="border-yellow-500/20 bg-yellow-500/10 text-yellow-400"
          trend={{ direction: 'up', text: 'active' }}
        />
        <CompanyMetric
          label="Success Rate"
          value={analytics?.successRate ? `${(analytics.successRate * 100).toFixed(0)}%` : '--'}
          icon={TrendingUp}
          color="border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
        />
        <CompanyMetric
          label="Errors"
          value={totalError}
          icon={AlertCircle}
          color="border-red-500/20 bg-red-500/10 text-red-400"
          trend={totalError > 0 ? { direction: 'down', text: 'needs attention' } : undefined}
        />
      </motion.div>

      {/* CEO Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <CEOFrame
          status={status}
          employees={employees.length}
          analytics={analytics}
        />
      </motion.div>

      {/* Managers Layer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <Card className="overflow-hidden border-yellow-500/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                  <UserCog className="w-4 h-4 text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Management Team</p>
                  <p className="text-[10px] text-white/40">
                    {filteredDepartments.length} Department Managers
                  </p>
                </div>
              </div>
              <Badge variant="warning" className="text-[10px]">Executive</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              {filteredDepartments.map((dept: Department) => {
                const deptColor = departmentColors[dept.name] || departmentColors.management
                return (
                  <div
                    key={dept._id}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg border',
                      'bg-white/[0.02] hover:bg-white/[0.04] transition-all',
                      deptColor.border.replace('border-', 'border-white/[0.08] hover:border-')
                    )}
                  >
                    <div className={cn('w-6 h-6 rounded-lg flex items-center justify-center', deptColor.bg)}>
                      <Building2 className={cn('w-3 h-3', deptColor.text)} />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-medium text-white capitalize">{dept.name} Manager</p>
                      <p className="text-[10px] text-white/30">{dept.employeeCount} direct reports</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* CEO → Managers → Departments connection */}
      <div className="flex flex-col items-center py-1">
        <div className="flex items-center gap-4">
          <div className="w-2 h-2 rounded-full bg-yellow-400/40" />
          <div className="w-12 sm:w-24 h-px bg-gradient-to-r from-yellow-400/20 via-white/10 to-white/10" />
          <Network className="w-4 h-4 text-white/20" />
          <div className="w-12 sm:w-24 h-px bg-gradient-to-l from-yellow-400/20 via-white/10 to-white/10" />
          <div className="w-2 h-2 rounded-full bg-yellow-400/40" />
        </div>
      </div>

      {/* Main Content: Departments + Side Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Organization Chart */}
        <div className="lg:col-span-2 space-y-4">
          {/* Department Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setSelectedDept(null)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                !selectedDept
                  ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                  : 'bg-white/5 text-white/50 border-white/10 hover:text-white/70 hover:bg-white/10'
              )}
            >
              All Departments
            </button>
            {filteredDepartments.map((dept: Department) => {
              const deptColor = departmentColors[dept.name] || departmentColors.management
              return (
                <button
                  key={dept._id}
                  onClick={() => setSelectedDept(selectedDept === dept.name ? null : dept.name)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all capitalize',
                    selectedDept === dept.name
                      ? `${deptColor.bg} ${deptColor.text} ${deptColor.border}`
                      : 'bg-white/5 text-white/50 border-white/10 hover:text-white/70 hover:bg-white/10'
                  )}
                >
                  {dept.name}
                </button>
              )
            })}
          </div>

          {/* Organization flow: CEO → Managers → Departments → Employees */}
          <div className="space-y-3">
            {/* Departments */}
            <AnimatePresence mode="popLayout">
              {filteredDepartments
                .filter((dept: Department) => !selectedDept || dept.name === selectedDept)
                .map((dept: Department, index: number) => {
                  const deptEmployees = employeesByDept.get(dept.name) || []
                  return (
                    <motion.div
                      key={dept._id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                    >
                      <DepartmentNode
                        department={dept}
                        employees={deptEmployees}
                        liveStatuses={liveStatuses}
                      />
                    </motion.div>
                  )
                })}
            </AnimatePresence>

            {filteredDepartments.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-white/30">
                <Building2 className="w-12 h-12 mb-3" />
                <p className="text-sm">No departments configured</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Company Insights */}
        <div className="space-y-4">
          {/* System Health Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-white/70 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                System Health
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                <span className="text-xs text-white/50">Database</span>
                <div className="flex items-center gap-2">
                  <StatusPulse status={status?.health?.database === 'healthy' ? 'healthy' : 'critical'} />
                  <Badge variant={status?.health?.database === 'healthy' ? 'success' : 'error'} className="text-[10px]">
                    {status?.health?.database || 'unknown'}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                <span className="text-xs text-white/50">Redis</span>
                <div className="flex items-center gap-2">
                  <StatusPulse status={status?.health?.redis === 'healthy' ? 'healthy' : 'critical'} />
                  <Badge variant={status?.health?.redis === 'healthy' ? 'success' : 'error'} className="text-[10px]">
                    {status?.health?.redis || 'unknown'}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                <span className="text-xs text-white/50">Workers</span>
                <div className="flex items-center gap-2">
                  <StatusPulse status={status?.health?.workers === 'healthy' ? 'healthy' : 'critical'} />
                  <Badge variant={status?.health?.workers === 'healthy' ? 'success' : 'error'} className="text-[10px]">
                    {status?.health?.workers || 'unknown'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Queue Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-white/70 flex items-center gap-2">
                <Layers className="w-4 h-4" />
                Queue Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/50">Queues Active</span>
                <span className="text-white font-medium">{status?.queues || 0}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/50">Workflows Defined</span>
                <span className="text-white font-medium">{status?.workflows || 0}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/50">Providers</span>
                <span className="text-white font-medium">{status?.providers || 0}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/50">Tools Available</span>
                <span className="text-white font-medium">{status?.tools || 0}</span>
              </div>
            </CardContent>
          </Card>

          {/* Employee Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-white/70 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Employee Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="text-white/50">Idle</span>
                  </span>
                  <span className="text-white font-medium">{employees.length - totalBusy - totalError}</span>
                </div>
                <Progress
                  value={((employees.length - totalBusy - totalError) / Math.max(employees.length, 1)) * 100}
                  variant="success"
                  className="h-1.5"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    <span className="text-white/50">Busy</span>
                  </span>
                  <span className="text-white font-medium">{totalBusy}</span>
                </div>
                <Progress
                  value={(totalBusy / Math.max(employees.length, 1)) * 100}
                  variant="default"
                  className="h-1.5"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-400" />
                    <span className="text-white/50">Error</span>
                  </span>
                  <span className="text-white font-medium">{totalError}</span>
                </div>
                <Progress
                  value={(totalError / Math.max(employees.length, 1)) * 100}
                  variant="danger"
                  className="h-1.5"
                />
              </div>
            </CardContent>
          </Card>

          {/* Department Skills Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-white/70 flex items-center gap-2">
                <Brain className="w-4 h-4" />
                Department Skills
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2.5">
                {filteredDepartments.slice(0, 5).map((dept: Department) => {
                  const deptColor = departmentColors[dept.name] || departmentColors.management
                  return (
                    <div key={dept._id} className="flex items-center gap-2">
                      <div className={cn('w-6 h-6 rounded-lg flex items-center justify-center', deptColor.bg)}>
                        <Building2 className={cn('w-3 h-3', deptColor.text)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white capitalize truncate">{dept.name}</p>
                        <p className="text-[10px] text-white/30 truncate">
                          {dept.skills?.slice(0, 3).join(', ') || 'No skills'}
                        </p>
                      </div>
                      <span className="text-xs text-white/50">{dept.employeeCount}</span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
