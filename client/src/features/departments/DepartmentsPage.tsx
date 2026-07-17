import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Building2, Bot, Users, Search as SearchIcon,
  Brain, FileText, Image, BarChart3, Send,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { departmentsService } from '@/services/employees.service'
import { cn } from '@/lib/utils'

const iconMap: Record<string, React.ElementType> = {
  research: SearchIcon,
  content: FileText,
  media: Image,
  publishing: Send,
  analytics: BarChart3,
  memory: Brain,
  management: Users,
}

const colorMap: Record<string, string> = {
  research: 'from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-400',
  content: 'from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-400',
  media: 'from-pink-500/20 to-pink-600/10 border-pink-500/30 text-pink-400',
  publishing: 'from-green-500/20 to-green-600/10 border-green-500/30 text-green-400',
  analytics: 'from-orange-500/20 to-orange-600/10 border-orange-500/30 text-orange-400',
  memory: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30 text-cyan-400',
  management: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30 text-yellow-400',
}

export function DepartmentsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentsService.list(),
  })

  const departments = data?.data || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Departments</h1>
        <p className="text-sm text-white/50 mt-1">{departments.length} departments</p>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 bg-white/5" />
          ))
        ) : (
          departments.map((dept: any) => {
            const Icon = iconMap[dept.name] || Building2
            const colors = colorMap[dept.name] || 'from-white/5 to-white/0 border-white/10 text-white/40'
            return (
              <Link key={dept._id} to={`/departments/${dept.name}`}>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="group hover:border-white/[0.12] transition-all cursor-pointer h-full overflow-hidden">
                    <div className={cn('absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity', colors.split(' ')[0])} />
                    <CardContent className="relative p-5 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center border', colors.split(' ').slice(-3).join(' '))}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-white capitalize group-hover:text-blue-400 transition-colors">
                            {dept.name}
                          </h3>
                          <p className="text-xs text-white/40">{dept.employeeCount} employees</p>
                        </div>
                      </div>
                      {dept.skills && dept.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {dept.skills.slice(0, 5).map((skill: string) => (
                            <span key={skill} className="px-2 py-0.5 rounded-md bg-white/5 text-[11px] text-white/50 border border-white/[0.06]">
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                      {dept.description && (
                        <p className="text-xs text-white/30 line-clamp-2">{dept.description}</p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </Link>
            )
          })
        )}
      </motion.div>
    </div>
  )
}
