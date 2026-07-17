import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ArrowLeft, Building2, Bot, Users, Activity, BarChart3 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge, statusToVariant } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { departmentsService } from '@/services/employees.service'
import { cn } from '@/lib/utils'

const departmentColors: Record<string, string> = {
  research: 'from-blue-500/20 to-blue-600/10 border-blue-500/30',
  content: 'from-purple-500/20 to-purple-600/10 border-purple-500/30',
  media: 'from-pink-500/20 to-pink-600/10 border-pink-500/30',
  publishing: 'from-green-500/20 to-green-600/10 border-green-500/30',
  analytics: 'from-orange-500/20 to-orange-600/10 border-orange-500/30',
  memory: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30',
  management: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30',
}

export function DepartmentDetailPage() {
  const { id } = useParams<{ id: string }>()

  const { data, isLoading } = useQuery({
    queryKey: ['department', id],
    queryFn: () => departmentsService.getById(id!),
    enabled: !!id,
  })

  const { data: employeesData, isLoading: loadingEmployees } = useQuery({
    queryKey: ['department-employees', id],
    queryFn: () => departmentsService.getEmployees(id!),
    enabled: !!id,
  })

  const department = data?.data
  const employees = employeesData?.data || []

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48 bg-white/5" />
        <Skeleton className="h-40 w-full bg-white/5" />
      </div>
    )
  }

  if (!department) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-white/30">
        <Building2 className="w-12 h-12 mb-3" />
        <p className="text-sm">Department not found</p>
        <Link to="/departments">
          <Button variant="ghost" className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Departments
          </Button>
        </Link>
      </div>
    )
  }

  const colors = departmentColors[id || ''] || 'from-white/5 to-white/0 border-white/10'

  return (
    <div className="space-y-6">
      <Link to="/departments" className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/70">
        <ArrowLeft className="w-4 h-4" /> Back to Departments
      </Link>

      {/* Department Header */}
      <Card className="relative overflow-hidden">
        <div className={cn('absolute inset-0 bg-gradient-to-br opacity-20', colors.split(' ')[0])} />
        <CardContent className="relative p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center border', colors)}>
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white capitalize">{id}</h1>
              <p className="text-sm text-white/50">{department.description}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-white/40">Employees</p>
              <p className="text-lg font-bold text-white">{department.employeeCount || employees.length}</p>
            </div>
            {department.manager && (
              <div>
                <p className="text-xs text-white/40">Manager</p>
                <p className="text-lg font-bold text-white">{department.manager}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-white/40">Departments</p>
              <p className="text-lg font-bold text-white">{department.employeeTypes?.length || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skills */}
      {department.skills && department.skills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-white/70">Skills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {department.skills.map((skill: string) => (
                <span key={skill} className="px-3 py-1 rounded-lg bg-white/5 text-xs text-white/60 border border-white/[0.06]">
                  {skill}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Employees */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-white/70">
            <Users className="w-4 h-4 inline mr-2" />
            Employees ({employees.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingEmployees ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full bg-white/5" />
              <Skeleton className="h-16 w-full bg-white/5" />
            </div>
          ) : employees.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-white/30">
              <Bot className="w-8 h-8 mr-2" />
              <p className="text-sm">No employees in this department</p>
            </div>
          ) : (
            <div className="space-y-2">
              {employees.map((emp: any) => (
                <Link key={emp.type} to={`/employees/${emp.type}`}>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-all">
                    <div className={cn(
                      'w-9 h-9 rounded-lg flex items-center justify-center',
                      emp.status === 'IDLE' ? 'bg-green-500/10' : emp.status === 'BUSY' ? 'bg-blue-500/10' : 'bg-white/5'
                    )}>
                      <Bot className={cn(
                        'w-4 h-4',
                        emp.status === 'IDLE' ? 'text-green-400' : emp.status === 'BUSY' ? 'text-blue-400' : 'text-white/30'
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{emp.name || emp.type}</p>
                      <p className="text-xs text-white/40">{emp.type}</p>
                    </div>
                    <Badge variant={statusToVariant(emp.status)}>{emp.status}</Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
