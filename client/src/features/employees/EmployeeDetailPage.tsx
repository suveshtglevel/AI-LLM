import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Bot, Clock, CheckCircle, XCircle,
  Activity, Brain, Wrench, Cpu, Zap, Calendar,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge, statusToVariant } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { employeesService } from '@/services/employees.service'
import { cn } from '@/lib/utils'

export function EmployeeDetailPage() {
  const { type } = useParams<{ type: string }>()

  const { data, isLoading } = useQuery({
    queryKey: ['employee', type],
    queryFn: () => employeesService.getByType(type!),
    enabled: !!type,
  })

  const employee = data?.data

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48 bg-white/5" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 bg-white/5 col-span-1" />
          <Skeleton className="h-64 bg-white/5 col-span-2" />
        </div>
      </div>
    )
  }

  if (!employee) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-white/30">
        <Bot className="w-12 h-12 mb-3" />
        <p className="text-sm">Employee not found</p>
        <Link to="/employees">
          <Button variant="ghost" className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Employees
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link to="/employees" className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Employees
      </Link>

      {/* Profile Header */}
      <Card className="relative overflow-hidden">
        <div className={cn(
          'absolute inset-0 bg-gradient-to-br opacity-30',
          employee.department === 'research' ? 'from-blue-500/20 to-blue-600/10' :
          employee.department === 'content' ? 'from-purple-500/20 to-purple-600/10' :
          employee.department === 'media' ? 'from-pink-500/20 to-pink-600/10' :
          'from-white/5 to-white/0'
        )} />
        <CardContent className="relative p-6">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className={cn(
              'w-20 h-20 rounded-2xl flex items-center justify-center',
              employee.status === 'IDLE' ? 'bg-green-500/15' :
              employee.status === 'BUSY' ? 'bg-blue-500/15' : 'bg-white/5'
            )}>
              <Bot className={cn(
                'w-10 h-10',
                employee.status === 'IDLE' ? 'text-green-400' :
                employee.status === 'BUSY' ? 'text-blue-400' : 'text-white/50'
              )} />
            </div>
            <div className="flex-1 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-white">{employee.name}</h1>
                  <p className="text-sm text-white/50 capitalize">{employee.type} · {employee.department}</p>
                </div>
                <Badge variant={statusToVariant(employee.status)} className="text-sm px-3 py-1">
                  {employee.status}
                </Badge>
              </div>
              <p className="text-sm text-white/40">{employee.description}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Stats & Details */}
        <div className="space-y-6">
          {/* Performance Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-white/70">Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/50">Total Tasks</span>
                <span className="text-sm font-semibold text-white">{employee.performance?.totalTasks || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/50">Completed</span>
                <span className="text-sm font-semibold text-green-400">{employee.performance?.completedTasks || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/50">Failed</span>
                <span className="text-sm font-semibold text-red-400">{employee.performance?.failedTasks || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/50">Success Rate</span>
                <span className="text-sm font-semibold text-white">
                  {employee.performance?.successRate ? `${(employee.performance.successRate * 100).toFixed(0)}%` : '--'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/50">Avg Execution</span>
                <span className="text-sm font-semibold text-white">
                  {employee.performance?.averageExecutionTime
                    ? `${(employee.performance.averageExecutionTime / 1000).toFixed(1)}s`
                    : '--'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Resource Usage */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-white/70">Resources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-white/50 flex items-center gap-1">
                    <Brain className="w-3 h-3" /> Memory
                  </span>
                  <span className="text-xs text-white/70">{employee.memoryUsage || 0}%</span>
                </div>
                <Progress value={employee.memoryUsage || 0} />
              </div>
              {employee.provider && (
                <div className="flex items-center gap-2 text-sm">
                  <Cpu className="w-4 h-4 text-white/30" />
                  <span className="text-white/50">Provider:</span>
                  <span className="text-white">{employee.provider}</span>
                </div>
              )}
              {employee.tools && employee.tools.length > 0 && (
                <div>
                  <p className="text-xs text-white/50 mb-2 flex items-center gap-1">
                    <Wrench className="w-3 h-3" /> Tools ({employee.tools.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {employee.tools.map((tool) => (
                      <span key={tool} className="px-2 py-0.5 rounded-md bg-white/5 text-xs text-white/50 border border-white/[0.06]">
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Skills */}
          {employee.skills && employee.skills.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-white/70">Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {employee.skills.map((skill) => (
                    <Badge key={skill} variant="default" className="bg-white/5 text-white/60">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Activity Logs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Task */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-white/70">Current Task</CardTitle>
            </CardHeader>
            <CardContent>
              {employee.currentTask ? (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                  <Activity className="w-5 h-5 text-blue-400" />
                  <span className="text-sm text-white">{employee.currentTask}</span>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                  <Clock className="w-5 h-5 text-white/30" />
                  <span className="text-sm text-white/40">No active task</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Log */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-white/70">Activity Log</CardTitle>
            </CardHeader>
            <CardContent>
              {employee.activityLog && employee.activityLog.length > 0 ? (
                <div className="space-y-3">
                  {employee.activityLog.slice(0, 10).map((log) => (
                    <div key={log._id} className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                      <div className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                        log.success ? 'bg-green-500/10' : 'bg-red-500/10'
                      )}>
                        {log.success ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium">{log.action}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-white/40">
                          <span>{log.duration ? `${(log.duration / 1000).toFixed(1)}s` : '--'}</span>
                          {log.tokensUsed && <span>{log.tokensUsed} tokens</span>}
                          {log.cost && <span>${log.cost.toFixed(4)}</span>}
                        </div>
                      </div>
                      <Badge variant={log.success ? 'success' : 'error'}>
                        {log.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center py-8 text-white/30">
                  <p className="text-sm">No activity logs available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
