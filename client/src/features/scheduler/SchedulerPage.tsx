import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Calendar, Plus, PauseCircle, PlayCircle, Trash2, Clock, Zap } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge, statusToVariant } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { schedulerService } from '@/services/scheduler.service'

export function SchedulerPage() {
  const queryClient = useQueryClient()
  const [showActive, setShowActive] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['scheduler', showActive],
    queryFn: () => schedulerService.list(showActive ? { isActive: true } : undefined),
  })

  const pauseMutation = useMutation({
    mutationFn: (id: string) => schedulerService.pause(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['scheduler'] }),
  })

  const resumeMutation = useMutation({
    mutationFn: (id: string) => schedulerService.resume(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['scheduler'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => schedulerService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['scheduler'] }),
  })

  const jobs = data?.data || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Scheduler</h1>
          <p className="text-sm text-white/50 mt-1">{jobs.length} scheduled jobs</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowActive(!showActive)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              showActive
                ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                : 'bg-white/5 text-white/50 border-white/10 hover:text-white/70'
            }`}
          >
            Active Only
          </button>
          <Button variant="primary">
            <Plus className="w-4 h-4" /> New Job
          </Button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-4"
      >
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48 bg-white/5" />
          ))
        ) : jobs.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-white/30">
            <Calendar className="w-12 h-12 mb-3" />
            <p className="text-sm">No scheduled jobs</p>
          </div>
        ) : (
          jobs.map((job: any) => (
            <Card key={job._id}>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">{job.name}</h3>
                      <p className="text-xs text-white/40">{job.workflowId}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {job.isActive ? (
                      <>
                        <button
                          onClick={() => pauseMutation.mutate(job._id)}
                          className="p-1.5 rounded-lg text-white/30 hover:text-yellow-400 hover:bg-yellow-500/10"
                        >
                          <PauseCircle className="w-4 h-4" />
                        </button>
                        <Badge variant="success">Active</Badge>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => resumeMutation.mutate(job._id)}
                          className="p-1.5 rounded-lg text-white/30 hover:text-green-400 hover:bg-green-500/10"
                        >
                          <PlayCircle className="w-4 h-4" />
                        </button>
                        <Badge variant="default">Paused</Badge>
                      </>
                    )}
                    <button
                      onClick={() => deleteMutation.mutate(job._id)}
                      className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-white/40">{job.description}</p>

                <div className="flex items-center gap-4 text-xs text-white/30">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {job.cronExpression}
                  </span>
                  {job.nextRunAt && (
                    <span className="flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      Next: {new Date(job.nextRunAt).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {job.scheduleDescription && (
                  <p className="text-xs text-blue-400/70">{job.scheduleDescription}</p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </motion.div>
    </div>
  )
}
