import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Layers, PauseCircle, PlayCircle, RefreshCw, Clock, CheckCircle, XCircle, Activity } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { systemService } from '@/services/system.service'
import { cn } from '@/lib/utils'

interface QueueInfo {
  name: string
  waiting: number
  active: number
  completed: number
  failed: number
  delayed: number
  isPaused: boolean
}

const MOCK_QUEUES: QueueInfo[] = [
  { name: 'research', waiting: 3, active: 1, completed: 45, failed: 2, delayed: 0, isPaused: false },
  { name: 'planning', waiting: 1, active: 0, completed: 38, failed: 1, delayed: 0, isPaused: false },
  { name: 'writer', waiting: 5, active: 2, completed: 42, failed: 3, delayed: 1, isPaused: false },
  { name: 'reviewer', waiting: 2, active: 0, completed: 36, failed: 0, delayed: 0, isPaused: true },
  { name: 'voice', waiting: 0, active: 0, completed: 28, failed: 1, delayed: 0, isPaused: false },
  { name: 'image', waiting: 4, active: 1, completed: 30, failed: 2, delayed: 0, isPaused: false },
  { name: 'video', waiting: 0, active: 0, completed: 22, failed: 0, delayed: 0, isPaused: false },
  { name: 'editor', waiting: 1, active: 0, completed: 35, failed: 1, delayed: 0, isPaused: false },
  { name: 'publisher', waiting: 2, active: 0, completed: 40, failed: 0, delayed: 0, isPaused: false },
  { name: 'analytics', waiting: 0, active: 1, completed: 50, failed: 0, delayed: 0, isPaused: false },
  { name: 'memory', waiting: 0, active: 0, completed: 60, failed: 0, delayed: 0, isPaused: false },
]

const queueColor: Record<string, string> = {
  research: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
  planning: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
  writer: 'bg-green-500/10 border-green-500/20 text-green-400',
  reviewer: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
  voice: 'bg-pink-500/10 border-pink-500/20 text-pink-400',
  image: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
  video: 'bg-red-500/10 border-red-500/20 text-red-400',
  editor: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
  publisher: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
  analytics: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
  memory: 'bg-violet-500/10 border-violet-500/20 text-violet-400',
}

export function QueuesPage() {
  const { data: statusData } = useQuery({
    queryKey: ['system-status'],
    queryFn: () => systemService.getStatus(),
  })
  
  const [queues, setQueues] = useState<QueueInfo[]>(MOCK_QUEUES)

  const togglePause = (name: string) => {
    setQueues((prev) => prev.map((q) =>
      q.name === name ? { ...q, isPaused: !q.isPaused } : q
    ))
  }

  const totalWaiting = queues.reduce((sum, q) => sum + q.waiting, 0)
  const totalActive = queues.reduce((sum, q) => sum + q.active, 0)
  const totalCompleted = queues.reduce((sum, q) => sum + q.completed, 0)
  const totalFailed = queues.reduce((sum, q) => sum + q.failed, 0)
  const pausedCount = queues.filter((q) => q.isPaused).length
  const totalQueues = statusData?.data?.queues || MOCK_QUEUES.length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Queues</h1>
        <p className="text-sm text-white/50 mt-1">{totalQueues} BullMQ queues · {pausedCount} paused</p>
      </div>

      {/* Overview Stats */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
        <Card><CardContent className="p-4 text-center">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-2">
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-xl font-bold text-white">{totalWaiting}</p>
          <p className="text-xs text-white/40">Waiting</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <div className="w-9 h-9 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-2">
            <Activity className="w-4 h-4 text-green-400" />
          </div>
          <p className="text-xl font-bold text-white">{totalActive}</p>
          <p className="text-xs text-white/40">Active</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl font-bold text-white">{totalCompleted}</p>
          <p className="text-xs text-white/40">Completed</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-2">
            <XCircle className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-xl font-bold text-white">{totalFailed}</p>
          <p className="text-xs text-white/40">Failed</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <div className="w-9 h-9 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mx-auto mb-2">
            <PauseCircle className="w-4 h-4 text-yellow-400" />
          </div>
          <p className="text-xl font-bold text-white">{pausedCount}</p>
          <p className="text-xs text-white/40">Paused</p>
        </CardContent></Card>
      </motion.div>

      {/* Queue Cards */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {queues.map((queue) => (
          <Card key={queue.name} className={cn(queue.isPaused && 'opacity-60')}>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center border', queueColor[queue.name] || 'bg-white/5 border-white/10')}>
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white capitalize">{queue.name}</h3>
                    <p className="text-xs text-white/40">BullMQ Queue</p>
                  </div>
                </div>
                {queue.isPaused && <Badge variant="warning">Paused</Badge>}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/40">Waiting</span>
                  <span className="text-white">{queue.waiting}</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${Math.min((queue.waiting / 10) * 100, 100)}%` }} />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/40">Active</span>
                  <span className="text-white">{queue.active}</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${Math.min((queue.active / 5) * 100, 100)}%` }} />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/40">Failed</span>
                  <span className="text-red-400">{queue.failed}</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full bg-red-500 transition-all" style={{ width: `${Math.min((queue.failed / 5) * 100, 100)}%` }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.06]">
                <div className="text-center p-2 rounded-lg bg-white/[0.02]">
                  <p className="text-xs text-white/40">Completed</p>
                  <p className="text-sm font-semibold text-white">{queue.completed}</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-white/[0.02]">
                  <p className="text-xs text-white/40">Delayed</p>
                  <p className="text-sm font-semibold text-white">{queue.delayed}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => togglePause(queue.name)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                    queue.isPaused
                      ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                      : 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20'
                  )}
                >
                  {queue.isPaused ? <><PlayCircle className="w-3.5 h-3.5" /> Resume</> : <><PauseCircle className="w-3.5 h-3.5" /> Pause</>}
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-white/50 hover:bg-white/10 transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>
    </div>
  )
}
