import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Clock, CheckCircle, XCircle,
  Bot, GitBranch, Activity,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge, statusToVariant } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { projectsService } from '@/services/projects.service'
import { cn } from '@/lib/utils'

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()

  const { data, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectsService.getById(id!),
    enabled: !!id,
  })

  const project = data?.data

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

  return (
    <div className="space-y-6">
      <Link to="/projects" className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/70">
        <ArrowLeft className="w-4 h-4" /> Back to Projects
      </Link>

      {/* Project Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-white">{project.title}</h1>
                <Badge variant={statusToVariant(project.status)} className="text-sm">
                  {project.status}
                </Badge>
              </div>
              <p className="text-sm text-white/50">{project.goal}</p>
            </div>
            <Badge variant="info">{project.workflowType}</Badge>
          </div>
          <div className="flex items-center gap-4 text-xs text-white/30">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> Created {new Date(project.createdAt).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1">
              <GitBranch className="w-3 h-3" /> {project.tasks?.length || 0} tasks
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Tasks Timeline */}
      {project.tasks && project.tasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-white/70">Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative space-y-0">
              {project.tasks.sort((a, b) => a.order - b.order).map((task, index) => (
                <div key={task._id} className="flex items-start gap-4 pb-6 last:pb-0">
                  {/* Timeline line */}
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center border-2',
                      task.status === 'COMPLETED' ? 'border-green-500 bg-green-500/10' :
                      task.status === 'FAILED' ? 'border-red-500 bg-red-500/10' :
                      task.status === 'IN_PROGRESS' ? 'border-blue-500 bg-blue-500/10' :
                      'border-white/10 bg-white/5'
                    )}>
                      {task.status === 'COMPLETED' ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : task.status === 'FAILED' ? (
                        <XCircle className="w-4 h-4 text-red-400" />
                      ) : (
                        <Bot className="w-4 h-4 text-white/30" />
                      )}
                    </div>
                    {index < project.tasks.length - 1 && (
                      <div className="w-px flex-1 bg-white/[0.06] mt-1" />
                    )}
                  </div>
                  {/* Task content */}
                  <div className="flex-1 pt-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-white capitalize">
                        {task.employeeType}
                      </h4>
                      <Badge variant={statusToVariant(task.status)}>
                        {task.status}
                      </Badge>
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
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
