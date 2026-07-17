import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Search, CheckSquare, Bot, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge, statusToVariant } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { tasksService } from '@/services/tasks.service'
import type { Task } from '@/types'
import { cn } from '@/lib/utils'

export function TasksPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', statusFilter],
    queryFn: () => tasksService.list(statusFilter ? { status: statusFilter } : undefined),
  })

  const tasks = data?.data?.data || []
  const filtered = tasks.filter((t: Task) => {
    if (search && !t.employeeType.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Tasks</h1>
        <p className="text-sm text-white/50 mt-1">{tasks.length} total tasks</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-white/5 border border-white/[0.08] text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['', 'PENDING', 'QUEUED', 'IN_PROGRESS', 'COMPLETED', 'FAILED'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status === statusFilter ? '' : status)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                status === statusFilter
                  ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                  : 'bg-white/5 text-white/50 border-white/10 hover:text-white/70 hover:bg-white/10'
              )}
            >
              {status || 'All'}
            </button>
          ))}
        </div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full bg-white/5" />
          ))
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-white/30">
            <CheckSquare className="w-12 h-12 mb-3" />
            <p className="text-sm">No tasks found</p>
          </div>
        ) : (
          <Card>
            <div className="divide-y divide-white/[0.04]">
              {filtered.map((task: Task) => (
                <div key={task._id} className="flex items-center gap-4 p-4 hover:bg-white/[0.02] transition-colors">
                  <div className={cn(
                    'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
                    task.status === 'COMPLETED' ? 'bg-green-500/10' :
                    task.status === 'FAILED' ? 'bg-red-500/10' :
                    task.status === 'IN_PROGRESS' ? 'bg-blue-500/10' : 'bg-white/5'
                  )}>
                    <Bot className={cn(
                      'w-4 h-4',
                      task.status === 'COMPLETED' ? 'text-green-400' :
                      task.status === 'FAILED' ? 'text-red-400' :
                      task.status === 'IN_PROGRESS' ? 'text-blue-400' : 'text-white/30'
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white capitalize">{task.employeeType}</p>
                    <p className="text-xs text-white/40">Order {task.order} · {task._id.slice(-6)}</p>
                  </div>
                  <Badge variant={statusToVariant(task.status)}>{task.status}</Badge>
                  {task.completedAt && (
                    <span className="text-xs text-white/30 hidden sm:block">
                      {new Date(task.completedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}
      </motion.div>
    </div>
  )
}
