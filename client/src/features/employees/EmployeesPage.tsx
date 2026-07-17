import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Bot, Clock, CheckCircle, XCircle, Activity,
  Zap, Brain, Wrench, Cpu, Search, Filter,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge, statusToVariant } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { employeesService } from '@/services/employees.service'
import type { Employee } from '@/types'
import { cn } from '@/lib/utils'

const departmentColors: Record<string, string> = {
  research: 'from-blue-500/20 to-blue-600/10 border-blue-500/20',
  content: 'from-purple-500/20 to-purple-600/10 border-purple-500/20',
  media: 'from-pink-500/20 to-pink-600/10 border-pink-500/20',
  publishing: 'from-green-500/20 to-green-600/10 border-green-500/20',
  analytics: 'from-orange-500/20 to-orange-600/10 border-orange-500/20',
  memory: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/20',
  management: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/20',
}

export function EmployeesPage() {
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState<string>('')

  const { data, isLoading } = useQuery({
    queryKey: ['employees', deptFilter],
    queryFn: () => employeesService.list(deptFilter ? { department: deptFilter } : undefined),
  })

  const employees = data?.data || []

  const filtered = employees.filter((emp: Employee) =>
    emp.name.toLowerCase().includes(search.toLowerCase()) ||
    emp.type.toLowerCase().includes(search.toLowerCase()) ||
    emp.skills?.some((s) => s.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">AI Employees</h1>
          <p className="text-sm text-white/50 mt-1">
            {employees.length} employees registered
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Search by name, type, or skill..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-white/5 border border-white/[0.08] text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['', 'research', 'content', 'media', 'publishing', 'analytics', 'memory'].map((dept) => (
            <button
              key={dept}
              onClick={() => setDeptFilter(dept === deptFilter ? '' : dept)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                dept === deptFilter
                  ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                  : 'bg-white/5 text-white/50 border-white/10 hover:text-white/70 hover:bg-white/10'
              )}
            >
              {dept || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Employee Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <Skeleton className="h-4 w-32 bg-white/5 mb-3" />
                <Skeleton className="h-3 w-24 bg-white/5 mb-4" />
                <Skeleton className="h-2 w-full bg-white/5 mb-2" />
                <Skeleton className="h-2 w-3/4 bg-white/5" />
              </CardContent>
            </Card>
          ))
        ) : filtered.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-white/30">
            <Bot className="w-12 h-12 mb-3" />
            <p className="text-sm">No employees found</p>
          </div>
        ) : (
          filtered.map((employee: Employee) => (
            <Link key={employee.type} to={`/employees/${employee.type}`}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="group hover:border-white/[0.12] transition-all duration-300 cursor-pointer h-full">
                  <div className={cn(
                    'absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl',
                    departmentColors[employee.department] || 'from-white/5 to-white/0'
                  )} />
                  <CardContent className="relative p-5 space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'w-10 h-10 rounded-xl flex items-center justify-center',
                          employee.status === 'IDLE' ? 'bg-green-500/15' :
                          employee.status === 'BUSY' ? 'bg-blue-500/15' :
                          employee.status === 'ERROR' ? 'bg-red-500/15' : 'bg-white/5'
                        )}>
                          <Bot className={cn(
                            'w-5 h-5',
                            employee.status === 'IDLE' ? 'text-green-400' :
                            employee.status === 'BUSY' ? 'text-blue-400' :
                            employee.status === 'ERROR' ? 'text-red-400' : 'text-white/30'
                          )} />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">
                            {employee.name}
                          </h3>
                          <p className="text-xs text-white/40 capitalize">{employee.type}</p>
                        </div>
                      </div>
                      <Badge variant={statusToVariant(employee.status)}>
                        {employee.status}
                      </Badge>
                    </div>

                    {/* Skills */}
                    {employee.skills && employee.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {employee.skills.slice(0, 4).map((skill) => (
                          <span
                            key={skill}
                            className="px-2 py-0.5 rounded-md bg-white/5 text-[11px] text-white/50 border border-white/[0.06]"
                          >
                            {skill}
                          </span>
                        ))}
                        {employee.skills.length > 4 && (
                          <span className="px-2 py-0.5 rounded-md bg-white/5 text-[11px] text-white/30">
                            +{employee.skills.length - 4}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3 pt-2 border-t border-white/[0.06]">
                      <div className="text-center">
                        <p className="text-xs text-white/40">Tasks</p>
                        <p className="text-sm font-semibold text-white">
                          {employee.performance?.totalTasks || 0}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-white/40">Success</p>
                        <p className="text-sm font-semibold text-green-400">
                          {employee.performance?.successRate
                            ? `${(employee.performance.successRate * 100).toFixed(0)}%`
                            : '--'}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-white/40">Avg Time</p>
                        <p className="text-sm font-semibold text-white">
                          {employee.performance?.averageExecutionTime
                            ? `${(employee.performance.averageExecutionTime / 1000).toFixed(1)}s`
                            : '--'}
                        </p>
                      </div>
                    </div>

                    {/* Progress bar for memory */}
                    <div className="flex items-center gap-2">
                      <Brain className="w-3 h-3 text-white/30" />
                      <Progress value={employee.memoryUsage || 0} variant="default" className="flex-1" />
                      <span className="text-[11px] text-white/30 w-8 text-right">
                        {employee.memoryUsage || 0}%
                      </span>
                    </div>

                    {/* Details Row */}
                    <div className="flex items-center gap-3 text-[11px] text-white/30">
                      {employee.tools && employee.tools.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Wrench className="w-3 h-3" />
                          {employee.tools.length} tools
                        </span>
                      )}
                      {employee.provider && (
                        <span className="flex items-center gap-1">
                          <Cpu className="w-3 h-3" />
                          {employee.provider}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </Link>
          ))
        )}
      </motion.div>
    </div>
  )
}
