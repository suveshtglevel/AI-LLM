import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  FolderKanban, Plus, Search, Trash2, Archive,
  ExternalLink, Clock, CheckCircle, XCircle,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge, statusToVariant } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { projectsService } from '@/services/projects.service'
import type { Project } from '@/types'
import { cn } from '@/lib/utils'

export function ProjectsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['projects', statusFilter],
    queryFn: () => projectsService.list(statusFilter ? { status: statusFilter } : undefined),
  })

  const deleteMutation = useMutation({
    mutationFn: projectsService.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  })

  const projects = data?.data?.data || []
  const filtered = projects.filter((p: Project) =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.goal.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Projects</h1>
          <p className="text-sm text-white/50 mt-1">{projects.length} total projects</p>
        </div>
        <Button variant="primary" onClick={() => navigate('/')}>
          <Plus className="w-4 h-4" />
          New Project
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-white/5 border border-white/[0.08] text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED'].map((status) => (
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

      {/* Projects List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-3"
      >
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full bg-white/5" />
          ))
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-white/30">
            <FolderKanban className="w-12 h-12 mb-3" />
            <p className="text-sm">No projects found</p>
          </div>
        ) : (
          filtered.map((project: Project, index: number) => (
            <motion.div
              key={project._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <Card className="group hover:border-white/[0.12] transition-all duration-300">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <Link
                          to={`/projects/${project._id}`}
                          className="text-base font-semibold text-white hover:text-blue-400 transition-colors truncate"
                        >
                          {project.title}
                        </Link>
                        <Badge variant={statusToVariant(project.status)}>
                          {project.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-white/40 line-clamp-2 mb-3">{project.goal}</p>
                      <div className="flex items-center gap-4 text-xs text-white/30">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(project.createdAt).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          {project.workflowType}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Link
                        to={`/projects/${project._id}`}
                        className="p-2 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5 transition-all"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => deleteMutation.mutate(project._id)}
                        className="p-2 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </motion.div>
    </div>
  )
}
